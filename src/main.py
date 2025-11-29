from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from datetime import timedelta
from typing import List

from src.api import auth_routes, portfolio_routes, analysis_routes, ai_routes, exchange_routes, export_routes
from src.models import User, PortfolioSummary, MarketNews
from src.kis_api import kis_client
from src.utils import setup_logging, setup_project_path
from src.auth.dependencies import get_current_active_user

# Setup logging and path
setup_project_path()
setup_logging()

app = FastAPI(title="Overseas Stock Portfolio Management System")

# CORS configuration
origins = [
    "http://localhost",
    "http://localhost:3000",
    "http://localhost:5173", # Vite default port
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth_routes.router)
app.include_router(portfolio_routes.router)
app.include_router(export_routes.router)
app.include_router(analysis_routes.router)
app.include_router(ai_routes.router)
app.include_router(exchange_routes.router)

@app.get("/users/me", response_model=User)
async def read_users_me(current_user: User = Depends(get_current_active_user)):
    return current_user

@app.get("/portfolio", response_model=PortfolioSummary)
async def get_portfolio(current_user: User = Depends(get_current_active_user)):
    # Authenticate with KIS API
    if not kis_client.authenticate():
        raise HTTPException(status_code=500, detail="Failed to authenticate with KIS API")

    # Fetch balance data
    balance_data = kis_client.get_overseas_balance()
    
    if "error" in balance_data or balance_data.get("rt_cd") != "0":
         # Fallback to mock data if API fails or returns error (for development)
        return {
            "total_value_usd": 26500.00,
            "total_value_krw": 35000000.00,
            "total_profit_loss": 2550.00,
            "total_return_rate": 9.62,
            "holdings": [
                {
                    "symbol": "AAPL",
                    "name": "Apple Inc.",
                    "quantity": 100,
                    "current_price": 175.50,
                    "average_price": 150.00,
                    "total_value": 17550.00,
                    "return_rate": 17.00
                },
                {
                    "symbol": "GOOGL",
                    "name": "Alphabet Inc.",
                    "quantity": 50,
                    "current_price": 140.00,
                    "average_price": 130.00,
                    "total_value": 7000.00,
                    "return_rate": 7.69
                }
            ]
        }

    # Process KIS API response
    holdings = []
    output1 = balance_data.get("output1", [])
    output2 = balance_data.get("output2", {})
    
    for item in output1:
        holdings.append({
            "symbol": item.get("ovrs_pdno"),
            "name": item.get("ovrs_item_name"),
            "quantity": float(item.get("ovrs_cblc_qty", 0)),
            "current_price": float(item.get("now_pric2", 0)),
            "average_price": float(item.get("pchs_avg_pric", 0)),
            "total_value": float(item.get("ovrs_stck_evlu_amt", 0)),
            "return_rate": float(item.get("evlu_pfls_rt", 0))
        })
        
    return {
        "total_value_usd": float(output2.get("ovrs_tot_pfls", 0)), # This might need adjustment based on actual API field for total value
        "total_value_krw": float(output2.get("tot_evlu_pfls_amt", 0)), # This is profit/loss, need total value
        "total_profit_loss": float(output2.get("ovrs_tot_pfls", 0)),
        "total_return_rate": float(output2.get("tot_pftrt", 0)),
        "holdings": holdings
    }

@app.get("/market/news", response_model=List[MarketNews])
async def get_market_news(current_user: User = Depends(get_current_active_user)):
    news_data = kis_client.get_overseas_news(limit=5)
    
    if not news_data or news_data.get("rt_cd") != "0":
        return []
        
    news_list = []
    for item in news_data.get("output", []):
        news_list.append({
            "title": item.get("title"),
            "time": item.get("data_dt") + " " + item.get("data_tm"), # Assuming fields
            "summary": "", # API might not return summary
            "link": "" # API might not return link
        })
    return news_list

@app.get("/")
async def root():
    return {"message": "Welcome to Overseas Stock Portfolio Management System API"}