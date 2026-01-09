import { onCLS, onFCP, onLCP, onTTFB, onINP, Metric } from 'web-vitals';

interface VitalsMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
  navigationType: string;
}

type ReportHandler = (metric: VitalsMetric) => void;

const thresholds = {
  LCP: { good: 2500, poor: 4000 },
  CLS: { good: 0.1, poor: 0.25 },
  FCP: { good: 1800, poor: 3000 },
  TTFB: { good: 800, poor: 1800 },
  INP: { good: 200, poor: 500 },
};

const getRating = (name: string, value: number): 'good' | 'needs-improvement' | 'poor' => {
  const threshold = thresholds[name as keyof typeof thresholds];
  if (!threshold) return 'good';

  if (value <= threshold.good) return 'good';
  if (value <= threshold.poor) return 'needs-improvement';
  return 'poor';
};

const formatMetric = (metric: Metric): VitalsMetric => ({
  name: metric.name,
  value: metric.value,
  rating: getRating(metric.name, metric.value),
  delta: metric.delta,
  id: metric.id,
  navigationType: metric.navigationType || 'unknown',
});

export const reportWebVitals = (onReport?: ReportHandler): void => {
  const handler = (metric: Metric) => {
    const formattedMetric = formatMetric(metric);

    if (import.meta.env.DEV) {
      const color = {
        good: 'color: green',
        'needs-improvement': 'color: orange',
        poor: 'color: red',
      }[formattedMetric.rating];

      console.log(
        `%c[Web Vitals] ${formattedMetric.name}: ${formattedMetric.value.toFixed(2)} (${formattedMetric.rating})`,
        color
      );
    }

    onReport?.(formattedMetric);
  };

  onCLS(handler);
  onFCP(handler);
  onLCP(handler);
  onTTFB(handler);
  onINP(handler);
};

export const sendToAnalytics = (metric: VitalsMetric): void => {
  const body = JSON.stringify({
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
    id: metric.id,
    page: window.location.pathname,
    timestamp: Date.now(),
  });

  if (navigator.sendBeacon) {
    navigator.sendBeacon('/api/analytics/vitals', body);
  } else {
    fetch('/api/analytics/vitals', {
      method: 'POST',
      body,
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
    }).catch(() => {});
  }
};

export const initWebVitals = (): void => {
  reportWebVitals(sendToAnalytics);
};

export type { VitalsMetric };
