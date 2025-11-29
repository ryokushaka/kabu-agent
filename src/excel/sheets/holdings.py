from openpyxl.workbook import Workbook
from openpyxl.styles import Font, Alignment, PatternFill, Border, Side
from src.models import PortfolioSummary

def write_holdings_sheet(wb: Workbook, data: PortfolioSummary):
    """보유 종목 상세 시트 생성"""
    ws = wb.create_sheet("보유 종목 상세")
    
    # 스타일 정의
    header_font = Font(name='맑은 고딕', size=11, bold=True, color='FFFFFF')
    header_fill = PatternFill(start_color='4472C4', end_color='4472C4', fill_type='solid')
    row_font = Font(name='맑은 고딕', size=10)
    
    center_align = Alignment(horizontal='center', vertical='center')
    right_align = Alignment(horizontal='right', vertical='center')
    
    thin_border = Border(left=Side(style='thin'), right=Side(style='thin'), 
                         top=Side(style='thin'), bottom=Side(style='thin'))

    # 헤더
    headers = ["종목코드", "종목명", "섹터", "보유수량", "비중(%)", "평균단가($)", "현재가($)", "52주 최고($)", "52주 최저($)", "평가금액($)", "평가손익($)", "수익률(%)"]
    
    for col_idx, header in enumerate(headers, 1):
        cell = ws.cell(row=1, column=col_idx, value=header)
        cell.font = header_font
        cell.fill = header_fill
        cell.alignment = center_align
        cell.border = thin_border

    # 데이터 입력
    for row_idx, holding in enumerate(data.holdings, 2):
        row_data = [
            holding.symbol,
            holding.name,
            holding.sector,
            holding.quantity,
            holding.weight / 100, # 퍼센트 포맷을 위해 100으로 나눔
            holding.average_price,
            holding.current_price,
            holding.fifty_two_week_high,
            holding.fifty_two_week_low,
            holding.total_value,
            holding.total_value - (holding.average_price * holding.quantity), # 평가손익 계산
            holding.return_rate / 100 # 이미 퍼센트 단위라면 100으로 나눠야 엑셀 % 포맷 적용됨 (확인 필요: API가 10.5로 주면 0.105로 변환)
        ]
        
        # API return_rate가 이미 % 단위(예: 15.5)라고 가정하면 엑셀 % 포맷(0.155)을 위해 100으로 나눔
        # 만약 API가 0.155로 준다면 나눌 필요 없음. KIS API는 보통 % 단위(15.5)로 줌.
        
        for col_idx, value in enumerate(row_data, 1):
            cell = ws.cell(row=row_idx, column=col_idx, value=value)
            cell.font = row_font
            cell.border = thin_border
            
            # 정렬 및 포맷팅
            if col_idx in [1, 2, 3]: # 코드, 이름, 섹터
                cell.alignment = center_align
            else: # 숫자 데이터
                cell.alignment = right_align
                if col_idx in [6, 7, 8, 9, 10, 11]: # 금액 ($)
                    cell.number_format = '#,##0.00'
                elif col_idx == 4: # 수량
                    cell.number_format = '#,##0'
                elif col_idx in [5, 12]: # 비중, 수익률 (%)
                    cell.number_format = '0.00%'
                    
            # 수익률/손익 색상
            if col_idx in [11, 12]: # 평가손익, 수익률
                if value > 0:
                    cell.font = Font(name='맑은 고딕', size=10, color='FF0000') # 빨강
                elif value < 0:
                    cell.font = Font(name='맑은 고딕', size=10, color='0000FF') # 파랑

    # 컬럼 너비 자동 조정
    widths = [10, 25, 15, 10, 10, 12, 12, 12, 12, 15, 15, 12]
    for i, width in enumerate(widths, 1):
        ws.column_dimensions[chr(64+i)].width = width