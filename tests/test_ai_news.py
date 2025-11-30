import asyncio
import os
from src.services.ai_service import GeminiService
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def test_news():
    print("Testing AI News Feature...")
    
    # Check API Key
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("Error: GEMINI_API_KEY not found.")
        return

    service = GeminiService()
    
    # 1. Test Search
    query = "NVIDIA stock"
    print(f"\n1. Searching news for: {query}")
    news_items = await service.search_news(query)
    
    if not news_items:
        print("No news found (DuckDuckGo might be rate limited or blocked).")
    else:
        print(f"Found {len(news_items)} items.")
        for i, item in enumerate(news_items[:3]):
            print(f"[{i+1}] {item.get('title')} ({item.get('source')})")

    # 2. Test Summarization
    if news_items:
        print("\n2. Summarizing news...")
        summary = await service.summarize_news(news_items)
        print("\n--- Summary ---")
        print(summary)
        print("-----------------")
    else:
        print("Skipping summarization test due to no news.")

if __name__ == "__main__":
    asyncio.run(test_news())
