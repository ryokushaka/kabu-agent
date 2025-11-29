"""
인증 관련 Pydantic 스키마
"""
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from uuid import UUID


class UserRegister(BaseModel):
    """사용자 회원가입 스키마"""
    username: str
    email: str
    password: str
    full_name: Optional[str] = None


class UserLogin(BaseModel):
    """사용자 로그인 스키마"""
    username: str
    password: str


class UserResponse(BaseModel):
    """사용자 응답 스키마"""
    id: UUID
    username: str
    email: str
    full_name: Optional[str]
    is_active: bool
    is_verified: bool
    created_at: datetime
    last_login: Optional[datetime]
    
    class Config:
        from_attributes = True


class Token(BaseModel):
    """토큰 응답 스키마"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserResponse


class TokenRefresh(BaseModel):
    """토큰 갱신 요청 스키마"""
    refresh_token: str


class UserApiTokenCreate(BaseModel):
    """사용자 API 토큰 생성 스키마"""
    kis_app_key: str
    kis_app_secret: str
    kis_account_number: str


class UserApiTokenResponse(BaseModel):
    """사용자 API 토큰 응답 스키마"""
    id: UUID
    service: str
    kis_account_number: str
    expires_at: datetime
    created_at: datetime
    
    class Config:
        from_attributes = True