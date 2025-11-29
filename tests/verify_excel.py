import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.models import PortfolioSummary, Holding
from src.excel.writer import ExcelWriter
from datetime import datetime

def verify_excel_generation():
    print("Generating mock data...")
    
    holdings = [
        Holding(
            symbol="AAPL",
            name="Apple Inc.",
            quantity=10,
            current_price=150.0,
            average_price=140.0,
            total_value=1500.0,
            return_rate=7.14,
            sector="Technology",
            fifty_two_week_high=180.0,
            fifty_two_week_low=130.0,
            weight=30.0,
            currency="USD"
        ),
        Holding(
            symbol="MSFT",
            name="Microsoft Corp.",
            quantity=5,
            current_price=300.0,
            average_price=280.0,
            total_value=1500.0,
            return_rate=7.14,
            sector="Technology",
            fifty_two_week_high=350.0,
            fifty_two_week_low=250.0,
            weight=30.0,
            currency="USD"
        ),
        Holding(
            symbol="JPM",
            name="JPMorgan Chase",
            quantity=20,
            current_price=100.0,
            average_price=110.0,
            total_value=2000.0,
            return_rate=-9.09,
            sector="Financials",
            fifty_two_week_high=120.0,
            fifty_two_week_low=90.0,
            weight=40.0,
            currency="USD"
        )
    ]
    
    summary = PortfolioSummary(
        total_value_usd=5000.0,
        total_value_krw=7000000.0,
        total_profit_loss=200.0,
        total_return_rate=4.0,
        cash_balance=1000.0,
        holdings=holdings,
        sector_allocation={
            "Technology": 3000.0,
            "Financials": 2000.0
        }
    )
    
    print("Creating Excel workbook...")
    try:
        writer = ExcelWriter()
        writer.create_workbook(summary)
        file_content = writer.save_to_bytes()
        
        filename = "test_enhanced_report.xlsx"
        with open(filename, "wb") as f:
            f.write(file_content)
            
        print(f"Successfully created {filename}")
        print(f"File size: {len(file_content)} bytes")
        
    except Exception as e:
        print(f"Error creating Excel: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    verify_excel_generation()
