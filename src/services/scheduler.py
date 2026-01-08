"""
APScheduler 배치 작업 스케줄러
"""
import logging
import os
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger
from apscheduler.events import EVENT_JOB_EXECUTED, EVENT_JOB_ERROR

logger = logging.getLogger(__name__)

# 스케줄러 인스턴스 (싱글톤)
scheduler = BackgroundScheduler()


def job_listener(event):
    """배치 작업 이벤트 리스너"""
    if event.exception:
        logger.error(f"Job {event.job_id} failed: {event.exception}")
    else:
        logger.info(f"Job {event.job_id} completed successfully")


def setup_scheduler():
    """스케줄러 설정 및 작업 등록"""
    # 동적 import로 순환 참조 방지
    from src.services.batch_jobs import (
        collect_market_news,
        create_daily_portfolio_snapshots,
        update_market_indices,
        generate_weekly_ai_reports
    )

    # 환경 변수에서 설정 읽기
    enable_batch_jobs = os.getenv("ENABLE_BATCH_JOBS", "true").lower() == "true"

    if not enable_batch_jobs:
        logger.info("Batch jobs are disabled by ENABLE_BATCH_JOBS environment variable")
        return

    # 뉴스 수집: 2시간마다
    news_interval = int(os.getenv("NEWS_COLLECTION_INTERVAL_HOURS", "2"))
    scheduler.add_job(
        func=collect_market_news,
        trigger=IntervalTrigger(hours=news_interval),
        id='news_collection',
        name='Market News Collection',
        replace_existing=True,
        max_instances=1
    )

    # 포트폴리오 스냅샷: 매일 16:00 (NYSE 종가 후)
    snapshot_hour = int(os.getenv("PORTFOLIO_SNAPSHOT_HOUR", "16"))
    scheduler.add_job(
        func=create_daily_portfolio_snapshots,
        trigger=CronTrigger(hour=snapshot_hour, minute=0),
        id='portfolio_snapshot',
        name='Daily Portfolio Snapshot',
        replace_existing=True,
        max_instances=1
    )

    # 시장 지표 업데이트: 4시간마다
    indices_interval = int(os.getenv("MARKET_INDICES_INTERVAL_HOURS", "4"))
    scheduler.add_job(
        func=update_market_indices,
        trigger=IntervalTrigger(hours=indices_interval),
        id='market_indices',
        name='Market Indices Update',
        replace_existing=True,
        max_instances=1
    )

    # 주간 AI 분석: 매주 일요일 22:00
    scheduler.add_job(
        func=generate_weekly_ai_reports,
        trigger=CronTrigger(day_of_week='sun', hour=22, minute=0),
        id='weekly_ai_report',
        name='Weekly AI Analysis Report',
        replace_existing=True,
        max_instances=1
    )

    # 이벤트 리스너 등록
    scheduler.add_listener(job_listener, EVENT_JOB_EXECUTED | EVENT_JOB_ERROR)

    logger.info("Scheduler configured with 4 jobs")


def start_scheduler():
    """스케줄러 시작"""
    try:
        setup_scheduler()
        scheduler.start()
        logger.info("Scheduler started successfully")

        # 등록된 작업 목록 출력
        jobs = scheduler.get_jobs()
        logger.info(f"Active jobs: {[job.id for job in jobs]}")
    except Exception as e:
        logger.error(f"Failed to start scheduler: {e}")
        raise


def shutdown_scheduler():
    """스케줄러 종료"""
    try:
        scheduler.shutdown(wait=True)
        logger.info("Scheduler shut down successfully")
    except Exception as e:
        logger.error(f"Failed to shutdown scheduler: {e}")
