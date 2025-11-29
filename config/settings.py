"""
설정 관리 모듈
"""
import os
from typing import Optional
from pydantic_settings import BaseSettings
from pydantic import ConfigDict


class Settings(BaseSettings):
    """애플리케이션 설정"""
    
    model_config = ConfigDict(
        env_file=".env",
        case_sensitive=True,
        extra='ignore'  # .env에 있는 추가 필드 무시
    )
    
    # KIS API 설정
    KIS_APP_KEY: str = ""
    KIS_APP_SECRET: str = ""
    KIS_ACCOUNT_NUMBER: str = ""
    KIS_BASE_URL: str = ""
    
    # 환경 설정 (real/virtual)
    TRADING_ENV: str = "virtual"
    
    # 로깅 설정
    LOG_LEVEL: str = "INFO"


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
    # .env에서 직접 지정된 URL이 있으면 우선 사용
    if settings.KIS_BASE_URL:
        return settings.KIS_BASE_URL
    
    # 환경에 따른 기본 URL
    if settings.TRADING_ENV == "real":
        return "https://openapi.koreainvestment.com:9443"
    else:
        return "https://openapivts.koreainvestment.com:29443"