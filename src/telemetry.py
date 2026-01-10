"""
OpenTelemetry Configuration Module
==================================

Configures distributed tracing for the Kabu Agent FastAPI application.
Integrates with Jaeger via OpenTelemetry Protocol (OTLP).

Environment Variables:
    OTEL_ENABLED: Enable/disable telemetry (default: false)
    OTEL_SERVICE_NAME: Service name for traces (default: kabu-backend)
    OTEL_EXPORTER_OTLP_ENDPOINT: OTLP endpoint URL
    OTEL_TRACE_SAMPLE_RATE: Sampling rate 0.0-1.0 (default: 0.1)
    ENVIRONMENT: Deployment environment (default: production)

Usage:
    from src.telemetry import setup_telemetry

    app = FastAPI()
    setup_telemetry(app, engine=db_engine)
"""

import os
import logging
from typing import Optional
from contextlib import contextmanager

# OpenTelemetry imports
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor, ConsoleSpanExporter
from opentelemetry.sdk.trace.sampling import TraceIdRatioBased, ParentBased
from opentelemetry.sdk.resources import Resource, SERVICE_NAME, SERVICE_VERSION
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter

# Instrumentation imports
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.instrumentation.sqlalchemy import SQLAlchemyInstrumentor
from opentelemetry.instrumentation.redis import RedisInstrumentor
from opentelemetry.instrumentation.requests import RequestsInstrumentor
from opentelemetry.instrumentation.httpx import HTTPXClientInstrumentor

logger = logging.getLogger(__name__)

# Global tracer for manual instrumentation
_tracer: Optional[trace.Tracer] = None


def get_tracer() -> trace.Tracer:
    """Get the global tracer instance for manual instrumentation."""
    global _tracer
    if _tracer is None:
        _tracer = trace.get_tracer(__name__)
    return _tracer


def is_telemetry_enabled() -> bool:
    """Check if telemetry is enabled via environment variable."""
    return os.getenv("OTEL_ENABLED", "false").lower() in ("true", "1", "yes")


def setup_telemetry(
    app,
    engine=None,
    service_name: Optional[str] = None,
    service_version: Optional[str] = None,
) -> bool:
    """
    Configure OpenTelemetry for the FastAPI application.

    Args:
        app: FastAPI application instance
        engine: SQLAlchemy engine instance (optional)
        service_name: Override service name (default from env)
        service_version: Service version for traces

    Returns:
        bool: True if telemetry was enabled, False otherwise
    """
    if not is_telemetry_enabled():
        logger.info("OpenTelemetry disabled (OTEL_ENABLED != true)")
        return False

    try:
        # Configuration from environment
        _service_name = service_name or os.getenv("OTEL_SERVICE_NAME", "kabu-backend")
        _service_version = service_version or os.getenv("SERVICE_VERSION", "1.0.0")
        _environment = os.getenv("ENVIRONMENT", "production")
        _otlp_endpoint = os.getenv(
            "OTEL_EXPORTER_OTLP_ENDPOINT",
            "http://otel-collector.monitoring.svc.cluster.local:4317"
        )
        _sample_rate = float(os.getenv("OTEL_TRACE_SAMPLE_RATE", "0.1"))

        logger.info(f"Configuring OpenTelemetry for {_service_name}")
        logger.info(f"OTLP endpoint: {_otlp_endpoint}")
        logger.info(f"Sample rate: {_sample_rate}")

        # Create resource with service metadata
        resource = Resource.create({
            SERVICE_NAME: _service_name,
            SERVICE_VERSION: _service_version,
            "deployment.environment": _environment,
            "service.namespace": "kabu-agent",
            "telemetry.sdk.language": "python",
        })

        # Configure sampler
        # ParentBased: respect parent's sampling decision, otherwise use ratio
        sampler = ParentBased(root=TraceIdRatioBased(_sample_rate))

        # Create tracer provider
        tracer_provider = TracerProvider(
            resource=resource,
            sampler=sampler
        )

        # Configure OTLP exporter
        # TLS Configuration:
        #   - insecure=True: Use for internal cluster communication (no TLS)
        #   - insecure=False: Use for external endpoints or when mTLS is enabled
        # Control via OTEL_EXPORTER_OTLP_INSECURE environment variable
        _use_insecure = os.getenv("OTEL_EXPORTER_OTLP_INSECURE", "true").lower() in ("true", "1", "yes")

        if not _use_insecure:
            logger.info("OTLP exporter configured with TLS (secure mode)")
        else:
            logger.info("OTLP exporter configured without TLS (insecure mode for cluster-internal)")

        otlp_exporter = OTLPSpanExporter(
            endpoint=_otlp_endpoint,
            insecure=_use_insecure
        )

        # Add batch processor for efficient exporting
        # Reduced batch size for low-memory environment
        tracer_provider.add_span_processor(
            BatchSpanProcessor(
                otlp_exporter,
                max_queue_size=256,       # Reduced from default 2048
                max_export_batch_size=64,  # Reduced from default 512
                schedule_delay_millis=5000  # 5 seconds
            )
        )

        # Optional: Add console exporter for debugging
        if os.getenv("OTEL_DEBUG", "false").lower() == "true":
            tracer_provider.add_span_processor(
                BatchSpanProcessor(ConsoleSpanExporter())
            )

        # Set global tracer provider
        trace.set_tracer_provider(tracer_provider)

        # Initialize global tracer
        global _tracer
        _tracer = trace.get_tracer(_service_name, _service_version)

        # Instrument FastAPI
        FastAPIInstrumentor.instrument_app(
            app,
            excluded_urls="health,metrics,favicon.ico",  # Exclude health/metrics endpoints
        )
        logger.info("FastAPI instrumentation enabled")

        # Instrument SQLAlchemy if engine provided
        if engine is not None:
            SQLAlchemyInstrumentor().instrument(
                engine=engine,
                enable_commenter=True,  # Add SQL comments with trace context
            )
            logger.info("SQLAlchemy instrumentation enabled")

        # Instrument Redis
        RedisInstrumentor().instrument()
        logger.info("Redis instrumentation enabled")

        # Instrument HTTP clients (requests library)
        RequestsInstrumentor().instrument()
        logger.info("Requests instrumentation enabled")

        # Instrument HTTPX (async HTTP client)
        HTTPXClientInstrumentor().instrument()
        logger.info("HTTPX instrumentation enabled")

        logger.info("OpenTelemetry setup complete")
        return True

    except Exception as e:
        logger.error(f"Failed to setup OpenTelemetry: {e}")
        return False


def shutdown_telemetry():
    """Shutdown OpenTelemetry and flush remaining spans."""
    try:
        provider = trace.get_tracer_provider()
        if hasattr(provider, 'shutdown'):
            provider.shutdown()
            logger.info("OpenTelemetry shutdown complete")
    except Exception as e:
        logger.error(f"Error during OpenTelemetry shutdown: {e}")


@contextmanager
def create_span(name: str, attributes: Optional[dict] = None):
    """
    Context manager for creating custom spans.

    Usage:
        with create_span("external_api_call", {"api": "kis"}):
            response = call_external_api()

    Args:
        name: Span name
        attributes: Optional attributes to add to span
    """
    tracer = get_tracer()
    with tracer.start_as_current_span(name) as span:
        if attributes:
            for key, value in attributes.items():
                span.set_attribute(key, value)
        yield span


def add_span_attributes(**kwargs):
    """
    Add attributes to the current span.

    Usage:
        add_span_attributes(user_id="123", operation="portfolio_fetch")
    """
    span = trace.get_current_span()
    for key, value in kwargs.items():
        span.set_attribute(key, value)


def record_exception(exception: Exception, attributes: Optional[dict] = None):
    """
    Record an exception on the current span.

    Args:
        exception: The exception to record
        attributes: Optional additional attributes
    """
    span = trace.get_current_span()
    span.record_exception(exception)
    span.set_status(trace.Status(trace.StatusCode.ERROR, str(exception)))
    if attributes:
        for key, value in attributes.items():
            span.set_attribute(key, value)
