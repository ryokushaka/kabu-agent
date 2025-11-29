from openpyxl import Workbook
from openpyxl.styles import Font, Alignment, PatternFill, Border, Side
from io import BytesIO
from src.models import PortfolioSummary
from src.excel.sheets.dashboard import write_dashboard_sheet
from src.excel.sheets.holdings import write_holdings_sheet
from src.excel.sheets.analysis import write_analysis_sheet
from src.excel.sheets.returns import write_returns_sheet
from src.excel.sheets.cover import write_cover_sheet
from src.excel.sheets.risk import write_risk_sheet
from src.excel.sheets.glossary import write_glossary_sheet

class ExcelWriter:
    def __init__(self):
        self.wb = Workbook()
        # Remove default sheet
        self.wb.remove(self.wb.active)

    def create_workbook(self, data: PortfolioSummary) -> Workbook:
        """포트폴리오 데이터로 엑셀 워크북 생성"""
        
        # 1. 표지 (Cover)
        write_cover_sheet(self.wb, data)

        # 2. 리스크 분석 (Risk)
        write_risk_sheet(self.wb, data)

        # 3. 대시보드 시트 (요약)
        write_dashboard_sheet(self.wb, data)
        
        # 4. 분석 시트 (신규)
        write_analysis_sheet(self.wb, data)
        
        # 5. 보유종목 시트
        write_holdings_sheet(self.wb, data)
        
        # 6. 수익률 분석 시트
        write_returns_sheet(self.wb, data)
        
        # 7. 용어 설명 시트 (Glossary)
        write_glossary_sheet(self.wb)
        
        return self.wb

    def save_to_bytes(self) -> bytes:
        """워크북을 바이트로 저장"""
        output = BytesIO()
        self.wb.save(output)
        output.seek(0)
        return output.getvalue()