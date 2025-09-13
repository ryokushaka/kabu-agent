"""
설정 관리 모듈
"""
import os
from typing import Optional
from pydantic import BaseSettings


class Settings(BaseSettings):
    """애플리케이션 설정"""
    
    # KIS API 설정
    KIS_APP_KEY: str
    KIS_APP_SECRET: str
    KIS_ACCOUNT_NUMBER: str
    
    # 환경 설정 (real/virtual)
    TRADING_ENV: str = "virtual"
    
    
    # 로깅 설정
    LOG_LEVEL: str = "INFO"
    
    class Config:
        env_file = ".env"
        case_sensitive = True


# 글로벌 설정 인스턴스
settings = Settings()


def get_kis_headers() -> dict:
    """KIS API 공통 헤더 반환"""
    return {
        "Content-Type": "application/json",
        "authorization": "",  # 토큰은 런타임에 설정
        "appkey": settings.KIS_APP_KEY,
        "appsecret": settings.KIS_APP_SECRET,
        "tr_id": "",  # 거래ID는 API별로 설정
    }


def get_api_base_url() -> str:
    """환경에 따른 API 베이스 URL 반환"""
    if settings.TRADING_ENV == "real":
        return "https://openapi.koreainvestment.com:9443"
    else:
        return "https://openapivts.koreainvestment.com:29443"