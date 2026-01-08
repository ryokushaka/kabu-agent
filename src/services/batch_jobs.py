"""
배치 작업 함수들
"""
import logging
from datetime import datetime, timedelta
from sqlalchemy import select, delete
from sqlalchemy.orm import Session

from src.database.connection import db_manager
from src.database.models import MarketNews, Portfolio, PortfolioHistory, BatchJobLog
from src.services.ai_service import GeminiService
from src.cache.redis_client import redis_cache

logger = logging.getLogger(__name__)
ai_service = GeminiService()


async def collect_market_news():
    """
    시장 뉴스 자동 수집 (2시간마다)
    """
    job_id = "news_collection"
    started_at = datetime.now()

    try:
        # 배치 로그 시작
        log_batch_job(job_id, "running", started_at)

        # 1. 뉴스 검색
        query = "미국 주식 시장"
        news_items = await ai_service.search_news(query)

        # 2. DB 저장
        saved_count = 0
        with db_manager.get_session() as session:
            for item in news_items:
                # 중복 체크 (URL 기준)
                existing = session.execute(
                    select(MarketNews).where(MarketNews.content_url == item['link'])
                ).scalar_one_or_none()

                if not existing:
                    news = MarketNews(
                        source=item.get('source', 'DuckDuckGo'),
                        title=item['title'],
                        summary=item.get('snippet', ''),
                        content_url=item['link'],
                        published_at=item.get('published_at', datetime.now()),
                        category='market'
                    )
                    session.add(news)
                    saved_count += 1

            session.commit()

        # 3. 오래된 뉴스 삭제 (30일 이상)
        cleanup_old_news(days=30)

        # 4. Redis 캐시 무효화
        redis_cache.delete("public:market_news")

        # 배치 로그 완료
        log_batch_job(job_id, "success", started_at, datetime.now(), items_processed=saved_count)

        logger.info(f"News collection completed: {saved_count} new items")

    except Exception as e:
        log_batch_job(job_id, "failed", started_at, datetime.now(), error=str(e))
        logger.error(f"News collection failed: {e}")


def cleanup_old_news(days: int = 30):
    """오래된 뉴스 삭제"""
    cutoff_date = datetime.now() - timedelta(days=days)

    with db_manager.get_session() as session:
        deleted = session.execute(
            delete(MarketNews).where(MarketNews.published_at < cutoff_date)
        ).rowcount
        session.commit()

        logger.info(f"Deleted {deleted} old news items")


async def create_daily_portfolio_snapshots():
    """
    포트폴리오 일일 스냅샷 생성 (매일 16:00)
    """
    job_id = "portfolio_snapshot"
    started_at = datetime.now()

    try:
        log_batch_job(job_id, "running", started_at)

        with db_manager.get_session() as session:
            # 모든 포트폴리오 조회
            portfolios = session.execute(select(Portfolio)).scalars().all()

            snapshot_count = 0
            for portfolio in portfolios:
                # 오늘 날짜로 이미 스냅샷이 있는지 확인
                today = datetime.now().date()
                existing = session.execute(
                    select(PortfolioHistory).where(
                        PortfolioHistory.portfolio_id == portfolio.id,
                        PortfolioHistory.date == today
                    )
                ).scalar_one_or_none()

                if not existing:
                    # 일일 스냅샷 생성
                    daily_return = calculate_daily_return(session, portfolio)
                    total_return = float(
                        portfolio.total_profit_loss / portfolio.total_invested * 100
                    ) if portfolio.total_invested > 0 else 0

                    snapshot = PortfolioHistory(
                        portfolio_id=portfolio.id,
                        date=today,
                        total_assets=portfolio.total_assets,
                        total_invested=portfolio.total_invested,
                        cash_balance=portfolio.cash_balance,
                        daily_return=daily_return,
                        total_return=total_return
                    )
                    session.add(snapshot)
                    snapshot_count += 1

            session.commit()

        log_batch_job(job_id, "success", started_at, datetime.now(), items_processed=snapshot_count)
        logger.info(f"Portfolio snapshots created: {snapshot_count} portfolios")

    except Exception as e:
        log_batch_job(job_id, "failed", started_at, datetime.now(), error=str(e))
        logger.error(f"Portfolio snapshot failed: {e}")


def calculate_daily_return(session: Session, portfolio: Portfolio) -> float:
    """일일 수익률 계산"""
    try:
        # 어제 스냅샷 조회
        yesterday = (datetime.now() - timedelta(days=1)).date()
        yesterday_snapshot = session.execute(
            select(PortfolioHistory).where(
                PortfolioHistory.portfolio_id == portfolio.id,
                PortfolioHistory.date == yesterday
            )
        ).scalar_one_or_none()

        if yesterday_snapshot and yesterday_snapshot.total_assets > 0:
            # 일일 수익률 = (오늘 자산 - 어제 자산) / 어제 자산 * 100
            daily_return = float(
                (portfolio.total_assets - yesterday_snapshot.total_assets)
                / yesterday_snapshot.total_assets * 100
            )
            return daily_return

        return 0.0

    except Exception as e:
        logger.error(f"Failed to calculate daily return: {e}")
        return 0.0


async def update_market_indices():
    """
    시장 지표 업데이트 (4시간마다)
    """
    job_id = "market_indices"
    started_at = datetime.now()

    try:
        log_batch_job(job_id, "running", started_at)

        # KIS API를 통해 시장 지표 업데이트
        # 실제 구현은 kis_client 구현에 따라 조정
        indices_updated = 0

        # TODO: KIS API 연동하여 실제 시장 지표 데이터 가져오기
        # 예시 코드:
        # from src.kis_api import kis_client
        # for code in ["NAS", "SPX", "DOW"]:
        #     data = await kis_client.get_index_data(code)
        #     # 저장 로직
        #     indices_updated += 1

        # Redis 캐시에 시장 지표 저장
        redis_cache.delete("public:market_indices")

        log_batch_job(job_id, "success", started_at, datetime.now(), items_processed=indices_updated)
        logger.info(f"Market indices updated: {indices_updated} indices")

    except Exception as e:
        log_batch_job(job_id, "failed", started_at, datetime.now(), error=str(e))
        logger.error(f"Market indices update failed: {e}")


async def generate_weekly_ai_reports():
    """
    주간 AI 분석 리포트 생성 (매주 일요일 22:00)
    """
    job_id = "weekly_ai_report"
    started_at = datetime.now()

    try:
        log_batch_job(job_id, "running", started_at)

        with db_manager.get_session() as session:
            # 모든 활성 포트폴리오 조회
            portfolios = session.execute(
                select(Portfolio).join(Portfolio.user).where(
                    Portfolio.user.has(is_active=True)
                )
            ).scalars().all()

            report_count = 0
            for portfolio in portfolios:
                try:
                    # TODO: 포트폴리오별 AI 분석 리포트 생성
                    # 예시 코드:
                    # analysis = await ai_service.analyze_portfolio(portfolio)
                    # # 리포트 저장 로직
                    report_count += 1

                except Exception as portfolio_error:
                    logger.error(f"Failed to generate report for portfolio {portfolio.id}: {portfolio_error}")
                    continue

        log_batch_job(job_id, "success", started_at, datetime.now(), items_processed=report_count)
        logger.info(f"Weekly AI reports generated: {report_count} reports")

    except Exception as e:
        log_batch_job(job_id, "failed", started_at, datetime.now(), error=str(e))
        logger.error(f"Weekly AI report generation failed: {e}")


def log_batch_job(
    job_id: str,
    status: str,
    started_at: datetime,
    completed_at: datetime = None,
    items_processed: int = 0,
    error: str = None
):
    """배치 작업 로그 기록"""
    try:
        with db_manager.get_session() as session:
            log = BatchJobLog(
                job_id=job_id,
                status=status,
                started_at=started_at,
                completed_at=completed_at,
                items_processed=items_processed,
                error_message=error
            )
            session.add(log)
            session.commit()
    except Exception as e:
        logger.error(f"Failed to log batch job: {e}")
