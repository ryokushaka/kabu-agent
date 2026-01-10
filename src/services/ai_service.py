import google.generativeai as genai
import os
import logging
import json
import hashlib
from typing import Dict, Any, List
from src.cache.redis_client import redis_cache as redis_client

logger = logging.getLogger(__name__)

class GeminiService:
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY")
        if not self.api_key:
            logger.warning("GEMINI_API_KEY not found in environment variables.")
        else:
            genai.configure(api_key=self.api_key)
            # Use gemini-2.0-flash as it is available for this key
            self.model = genai.GenerativeModel('gemini-2.0-flash')

    async def analyze_portfolio(self, portfolio_data: Dict[str, Any]) -> str:
        if not self.api_key:
            return "### Error\n\nGemini API key is not configured. Please check your server settings."

        # Generate cache key based on portfolio data hash
        data_str = json.dumps(portfolio_data, sort_keys=True)
        data_hash = hashlib.md5(data_str.encode()).hexdigest()
        cache_key = f"ai:analysis:{data_hash}"

        # Check cache
        cached_analysis = redis_client.get(cache_key)
        if cached_analysis:
            logger.info("Returning cached portfolio analysis")
            return cached_analysis

        prompt = self._construct_prompt(portfolio_data)
        
        try:
            # Safety settings to avoid blocking legitimate financial analysis
            safety_settings = {
                genai.types.HarmCategory.HARM_CATEGORY_HATE_SPEECH: genai.types.HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
                genai.types.HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: genai.types.HarmBlockThreshold.BLOCK_ONLY_HIGH,
                genai.types.HarmCategory.HARM_CATEGORY_HARASSMENT: genai.types.HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
                genai.types.HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: genai.types.HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
            }

            response = await self.model.generate_content_async(
                prompt,
                safety_settings=safety_settings
            )
            
            if response.text:
                # Cache result for 24 hours (analysis doesn't change unless portfolio changes)
                redis_client.set(cache_key, response.text, expire=86400)
                return response.text
            else:
                return "### Error\n\nNo response generated from Gemini."
                
        except Exception as e:
            logger.error(f"Error generating analysis: {str(e)}")
            return f"### Analysis Unavailable\n\nAn error occurred while generating the portfolio analysis: {str(e)}"

    def _construct_prompt(self, data: Dict[str, Any]) -> str:
        # Extract key metrics
        total_value_usd = data.get("total_value_usd", 0)
        total_profit_loss = data.get("total_profit_loss", 0)
        total_return_rate = data.get("total_return_rate", 0)
        holdings = data.get("holdings", [])
        
        # Format holdings for prompt (limit to top 10 to avoid token limits if necessary, though Flash handles large context)
        holdings_str = ""
        sorted_holdings = sorted(holdings, key=lambda x: x.get('total_value', 0), reverse=True)
        
        for h in sorted_holdings:
            name = h.get('name', 'Unknown')
            symbol = h.get('symbol', 'N/A')
            qty = h.get('quantity', 0)
            ret = h.get('return_rate', 0)
            val = h.get('total_value', 0)
            holdings_str += f"- **{name} ({symbol})**: ${val:,.2f} ({qty} shares), Return: {ret}%\n"

        return f"""
        You are an expert financial advisor and portfolio analyst. 
        Analyze the following overseas stock portfolio and provide a comprehensive diagnosis in **Markdown** format.
        
        ## Portfolio Snapshot
        - **Total Value**: ${total_value_usd:,.2f}
        - **Total Profit/Loss**: ${total_profit_loss:,.2f}
        - **Total Return Rate**: {total_return_rate:.2f}%
        
        ## Holdings Details
        {holdings_str}
        
        ## Analysis Request
        Please provide a structured report covering the following sections. Use Markdown headers (##, ###) and bullet points.
        
        1.  **📊 Overall Assessment**: A brief executive summary of the portfolio's health and performance.
        2.  **⚖️ Risk Analysis**: Identify concentration risks (e.g., too much tech?), single-stock risks, or volatility concerns.
        3.  **🛡️ Diversification Check**: Evaluate how well-diversified the portfolio is across sectors and asset classes.
        4.  **💡 Actionable Insights**: Suggest 2-3 general strategies (e.g., "Consider rebalancing X", "Look into defensive sectors"). **Disclaimer**: State that this is not financial advice.
        5.  **🔮 Market Context**: Briefly mention how current general market trends (e.g., interest rates, AI boom) might impact these specific holdings.
        
        **Tone**: Professional, objective, yet encouraging.
        **Language**: Korean (한국어).
        """

    async def search_news(self, query: str) -> list:
        """
        DuckDuckGo를 사용하여 뉴스 검색 (캐싱 적용)
        """
        # Cache key for news search
        cache_key = f"ai:news_search:{query}"
        cached_results = redis_client.get(cache_key)
        
        if cached_results:
            logger.info(f"Returning cached news search for: {query}")
            return cached_results

        try:
            from duckduckgo_search import DDGS
            
            logger.info(f"Searching news for: {query}")
            results = []
            
            with DDGS() as ddgs:
                # 한국어 뉴스 검색 시도
                news_gen = ddgs.news(keywords=query, region="kr-kr", safesearch="off", timelimit="d", max_results=5)
                for r in news_gen:
                    results.append(r)
                    
                # 결과가 적으면 글로벌 뉴스도 검색 (영어 -> 한국어 요약 예정)
                if len(results) < 3:
                    news_gen_global = ddgs.news(keywords=query, region="us-en", safesearch="off", timelimit="d", max_results=5)
                    for r in news_gen_global:
                        results.append(r)
            
            final_results = results[:8] # 최대 8개 반환
            
            # Cache results for 1 hour
            redis_client.set(cache_key, json.dumps(final_results), expire=3600)
            
            return final_results
            
        except Exception as e:
            logger.error(f"Error searching news: {e}")
            return []

    async def summarize_news(self, news_items: list) -> str:
        """
        뉴스 항목들을 Gemini를 사용하여 한국어로 요약 (캐싱 적용)
        """
        if not self.api_key or not news_items:
            return "뉴스 정보를 가져올 수 없습니다."

        # Create a hash of the news items to use as cache key
        news_str = json.dumps(news_items, sort_keys=True)
        news_hash = hashlib.md5(news_str.encode()).hexdigest()
        cache_key = f"ai:news_summary:{news_hash}"

        cached_summary = redis_client.get(cache_key)
        if cached_summary:
            logger.info("Returning cached news summary")
            return cached_summary

        # 뉴스 데이터 텍스트화
        news_text = ""
        for i, item in enumerate(news_items):
            title = item.get('title', 'No Title')
            snippet = item.get('body', '') or item.get('snippet', '')
            source = item.get('source', 'Unknown')
            date = item.get('date', '')
            news_text += f"[{i+1}] Title: {title}\nSource: {source} ({date})\nContent: {snippet}\n\n"

        prompt = f"""
        You are a financial news assistant. 
        Below are the latest news headlines and snippets related to the user's stock portfolio or interest.
        
        ## Raw News Data
        {news_text}
        
        ## Task
        1.  Select the most relevant and important news items (up to 5).
        2.  Summarize them into a cohesive "Market News Briefing" in **Korean**.
        3.  For each item, provide a **Title** (in Korean), a **Summary** (1-2 sentences), and cite the **Source**.
        4.  If the news is in English, translate the core message accurately.
        5.  Format as a Markdown list.
        
        **Format Example:**
        ### 📰 주요 시장 뉴스
        
        1. **[Title in Korean]**
        - 요약 내용...
        - *출처: Bloomberg*
        
        2. ...
        """
        
        try:
            response = await self.model.generate_content_async(prompt)
            if response.text:
                # Cache summary for 2 hours
                redis_client.set(cache_key, response.text, expire=7200)
                return response.text
            else:
                return None
        except Exception as e:
            logger.error(f"Error summarizing news: {e}")
            return None
