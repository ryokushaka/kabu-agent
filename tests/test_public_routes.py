
import pytest
from fastapi.testclient import TestClient
from src.app import app
from unittest.mock import patch, MagicMock

client = TestClient(app)

def test_get_market_indices_success():
    # Mocking KIS client response
    with patch("src.api.public_routes.kis_client.get_overseas_index_price") as mock_get_price:
        mock_get_price.return_value = {
            "output1": {
                "ovrs_nmix_prpr": "15000.00",
                "ct_nmix_prpr": "100.00",
                "ovrs_nmix_fluc_rt": "0.67"
            }
        }
        
        response = client.get("/api/public/market/indices")
        assert response.status_code == 200
        data = response.json()
        assert "NASDAQ" in data
        assert data["NASDAQ"]["price"] == "15000.00"

def test_get_market_indices_partial_failure():
    # Test resilience if one call fails
    with patch("src.api.public_routes.kis_client.get_overseas_index_price") as mock_get_price:
        def side_effect(code):
            if code == "NAS":
                return {"output1": {"ovrs_nmix_prpr": "15000.00", "ct_nmix_prpr": "100.00", "ovrs_nmix_fluc_rt": "0.67"}}
            raise Exception("API Error")
        
        mock_get_price.side_effect = side_effect
        
        response = client.get("/api/public/market/indices")
        assert response.status_code == 200
        data = response.json()
        # NASDAQ should be present, others might be missing or empty if we handled it silently
        # In my implementation, I catch exception and skip or warn.
        assert "NASDAQ" in data
        # Check if others are missing as expected or handled
        # My implementation loop: `indices[name] = ...` inside try/except. So failed ones won't be in dict.
        assert len(data) == 1 

def test_get_market_news_success():
    with patch("src.api.public_routes.ai_service.search_news") as mock_search, \
         patch("src.api.public_routes.ai_service.summarize_news") as mock_summarize:
        
        mock_search.return_value = [{"title": "News 1"}]
        mock_summarize.return_value = "## Market Summary\nAll good."
        
        response = client.get("/api/public/market/news")
        assert response.status_code == 200
        assert response.json() == {"summary": "## Market Summary\nAll good."}
