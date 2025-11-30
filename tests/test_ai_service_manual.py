import asyncio
import os
import sys
from pathlib import Path

# Add project root to python path
project_root = str(Path(__file__).parent.parent)
sys.path.append(project_root)

from src.services.ai_service import GeminiService

async def test_gemini_service():
    print("Testing GeminiService...")
    
    # Check API Key
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("WARNING: GEMINI_API_KEY is not set. Test will likely fail or return error message.")
    else:
        print("GEMINI_API_KEY is found.")

    service = GeminiService()
    
    mock_data = {
        "total_value_usd": 10000.0,
        "total_profit_loss": 500.0,
        "total_return_rate": 5.0,
        "holdings": [
            {
                "name": "Apple",
                "symbol": "AAPL",
                "quantity": 10,
                "return_rate": 10.0,
                "total_value": 1500.0
            },
            {
                "name": "Tesla",
                "symbol": "TSLA",
                "quantity": 5,
                "return_rate": -2.0,
                "total_value": 1000.0
            }
        ]
    }
    
    print("\nSending request to Gemini...")
    try:
        result = await service.analyze_portfolio(mock_data)
        print("\n--- Analysis Result ---")
        print(result[:500] + "..." if len(result) > 500 else result)
        print("\n-----------------------")
        
        if "Error" in result or "Unavailable" in result:
            print("Test Failed (Service returned error)")
        else:
            print("Test Passed (Response received)")
            
    except Exception as e:
        print(f"Test Failed with exception: {e}")

if __name__ == "__main__":
    asyncio.run(test_gemini_service())
