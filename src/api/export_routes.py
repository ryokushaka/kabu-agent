from fastapi import APIRouter, HTTPException, Response
from src.api.portfolio_routes import get_portfolio_balance
from src.excel.writer import ExcelWriter
from src.models import PortfolioSummary, Holding
from datetime import datetime

router = APIRouter(prefix="/api/export", tags=["Export"])

@router.get("/excel")
async def export_portfolio_excel():
    """
    포트폴리오 엑셀 다운로드
    """
    try:
        # 1. 포트폴리오 데이터 조회
        balance = await get_portfolio_balance()
        
        # 2. 데이터 변환 및 상세 정보 조회
        holdings = []
        sector_allocation = {}
        total_value = balance.stock_value
        
        from src.kis_api import kis_client
        
        for pos in balance.positions:
            # 상세 정보 조회 (섹터, 52주)
            details = kis_client.get_overseas_stock_details(pos.ticker)
            
            # 비중 계산
            weight = (pos.market_value / total_value * 100) if total_value > 0 else 0
            
            # 섹터 비중 집계
            sector = details.get("sector", "Unknown")
            sector_allocation[sector] = sector_allocation.get(sector, 0) + pos.market_value
            
            holdings.append(Holding(
                symbol=pos.ticker,
                name=pos.name,
                quantity=pos.quantity,
                current_price=pos.current_price,
                average_price=pos.avg_price,
                total_value=pos.market_value,
                return_rate=pos.profit_loss_percent,
                sector=sector,
                fifty_two_week_high=details.get("high52", 0.0),
                fifty_two_week_low=details.get("low52", 0.0),
                weight=weight,
                currency="USD"
            ))
            
        # 환율 정보는 balance에서 가져옴
        
        # 3. 리스크 분석 수행
        from src.services.analysis_service import perform_portfolio_analysis
        analysis_result = await perform_portfolio_analysis(balance)
        
        # 일일 수익률 계산 (가중 평균)
        weighted_daily_return = 0
        if total_value > 0:
            for pos in balance.positions:
                weighted_daily_return += pos.daily_return * (pos.market_value / total_value)
        
        # MDD 추출
        max_drawdown = 0.0
        if analysis_result and "metrics" in analysis_result:
            max_drawdown = analysis_result["metrics"].get("max_drawdown", 0.0)

        summary = PortfolioSummary(
            total_value_usd=balance.stock_value,
            total_value_krw=balance.stock_value * balance.exchange_rate,
            total_profit_loss=balance.total_profit_loss,
            total_return_rate=balance.total_return_percent,
            cash_balance=balance.cash,
            holdings=holdings,
            sector_allocation=sector_allocation,
            analysis=analysis_result,
            daily_return=weighted_daily_return,
            max_drawdown=max_drawdown,
            exchange_rate=balance.exchange_rate
        )
        
        # 3. 엑셀 생성
        writer = ExcelWriter()
        writer.create_workbook(summary)
        file_content = writer.save_to_bytes()
        
        # 4. 파일 응답
        filename = f"portfolio_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
        
        return Response(
            content=file_content,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
