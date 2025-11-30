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
from src.excel.sheets.ai_analysis_sheet import AIAnalysisSheet

class ExcelWriter:
    def __init__(self):
        self.workbook = Workbook()
        # 기본 시트 제거
        self.workbook.remove(self.workbook.active)

    def create_workbook(self, data: PortfolioSummary) -> Workbook:
        """포트폴리오 데이터로 엑셀 워크북 생성"""
        
        # 1. 표지 (Cover)
        write_cover_sheet(self.workbook, data)

        # 2. 리스크 분석 (Risk)
        write_risk_sheet(self.workbook, data)

        # 3. 대시보드 시트 (요약)
        write_dashboard_sheet(self.workbook, data)
        
        # 4. 분석 시트
        write_analysis_sheet(self.workbook, data)
        
        # 5. AI 분석 시트 (신규)
        ai_sheet = AIAnalysisSheet()
        ai_sheet.write(self.workbook, data)
        
        # 6. 보유종목 시트
        write_holdings_sheet(self.workbook, data)
        
        # 7. 수익률 분석 시트
        write_returns_sheet(self.workbook, data)
        
        # 8. 용어 설명 시트 (Glossary)
        write_glossary_sheet(self.workbook)
        
        return self.workbook

    def save_to_bytes(self) -> bytes:
        """워크북을 바이트로 저장"""
        output = BytesIO()
        self.workbook.save(output)
        output.seek(0)
        return output.getvalue()