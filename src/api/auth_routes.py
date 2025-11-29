"""
인증 관련 API 라우트
"""
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from src.database.connection import get_db
from src.database.models import User, UserApiToken
from src.schemas.auth import (
    UserRegister, UserLogin, UserResponse, Token, TokenRefresh,
    UserApiTokenCreate, UserApiTokenResponse
)
from src.auth.jwt_handler import jwt_handler
from src.auth.dependencies import get_current_user, get_current_active_user
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register_user(user_data: UserRegister, db: Session = Depends(get_db)):
    """사용자 회원가입"""
    try:
        # 이메일 및 사용자명 중복 확인
        existing_user = db.query(User).filter(
            (User.email == user_data.email) | (User.username == user_data.username)
        ).first()
        
        if existing_user:
            if existing_user.email == user_data.email:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email already registered"
                )
            else:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Username already taken"
                )
        
        # 새 사용자 생성
        hashed_password = User.hash_password(user_data.password)
        new_user = User(
            username=user_data.username,
            email=user_data.email,
            hashed_password=hashed_password,
            full_name=user_data.full_name,
            is_active=True,
            is_verified=False
        )
        
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        logger.info(f"새 사용자 회원가입: {user_data.username} ({user_data.email})")
        return new_user
        
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User already exists"
        )
    except Exception as e:
        db.rollback()
        logger.error(f"회원가입 중 오류: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Registration failed"
        )


@router.post("/login", response_model=Token)
async def login_user(user_credentials: UserLogin, db: Session = Depends(get_db)):
    """사용자 로그인"""
    try:
        # 사용자 인증
        user = db.query(User).filter(User.username == user_credentials.username).first()
        
        if not user or not user.verify_password(user_credentials.password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Inactive user"
            )
        
        # JWT 토큰 생성
        access_token_expires = timedelta(minutes=jwt_handler.access_token_expire_minutes)
        access_token = jwt_handler.create_access_token(
            data={"sub": str(user.id)}, expires_delta=access_token_expires
        )
        refresh_token = jwt_handler.create_refresh_token(data={"sub": str(user.id)})
        
        # 마지막 로그인 시간 업데이트
        user.last_login = datetime.now(timezone.utc)
        db.commit()
        
        logger.info(f"사용자 로그인: {user.username}")
        
        return Token(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            expires_in=jwt_handler.access_token_expire_minutes * 60,
            user=UserResponse.model_validate(user)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"로그인 중 오류: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Login failed"
        )


@router.post("/refresh", response_model=Token)
async def refresh_token(token_data: TokenRefresh, db: Session = Depends(get_db)):
    """토큰 갱신"""
    try:
        # 리프레시 토큰 검증
        payload = jwt_handler.verify_token(token_data.refresh_token)
        if not payload or payload.get("type") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token"
            )
        
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token"
            )
        
        # 사용자 조회
        user = db.query(User).filter(User.id == user_id).first()
        if not user or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found or inactive"
            )
        
        # 새 액세스 토큰 생성
        access_token_expires = timedelta(minutes=jwt_handler.access_token_expire_minutes)
        access_token = jwt_handler.create_access_token(
            data={"sub": str(user.id)}, expires_delta=access_token_expires
        )
        
        return Token(
            access_token=access_token,
            refresh_token=token_data.refresh_token,  # 기존 리프레시 토큰 유지
            token_type="bearer",
            expires_in=jwt_handler.access_token_expire_minutes * 60,
            user=UserResponse.model_validate(user)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"토큰 갱신 중 오류: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Token refresh failed"
        )


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_active_user)):
    """현재 사용자 정보 조회"""
    return UserResponse.model_validate(current_user)


@router.post("/api-token", response_model=UserApiTokenResponse)
async def create_user_api_token(
    token_data: UserApiTokenCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """사용자 API 토큰 생성 (KIS API 키 등록)"""
    try:
        # 기존 토큰 확인 및 업데이트 또는 새 토큰 생성
        existing_token = db.query(UserApiToken).filter(
            UserApiToken.user_id == current_user.id,
            UserApiToken.service == "KIS"
        ).first()
        
        if existing_token:
            # 기존 토큰 업데이트
            existing_token.kis_app_key = token_data.kis_app_key
            existing_token.kis_app_secret = token_data.kis_app_secret
            existing_token.kis_account_number = token_data.kis_account_number
            existing_token.access_token = "pending"  # 실제 토큰은 KIS API 호출 시 생성
            existing_token.expires_at = datetime.now(timezone.utc) + timedelta(hours=24)
            existing_token.updated_at = datetime.now(timezone.utc)
            
            db.commit()
            db.refresh(existing_token)
            
            logger.info(f"사용자 API 토큰 업데이트: {current_user.username}")
            return UserApiTokenResponse.model_validate(existing_token)
        else:
            # 새 토큰 생성
            new_token = UserApiToken(
                user_id=current_user.id,
                service="KIS",
                access_token="pending",  # 실제 토큰은 KIS API 호출 시 생성
                expires_at=datetime.now(timezone.utc) + timedelta(hours=24),
                kis_app_key=token_data.kis_app_key,
                kis_app_secret=token_data.kis_app_secret,
                kis_account_number=token_data.kis_account_number
            )
            
            db.add(new_token)
            db.commit()
            db.refresh(new_token)
            
            logger.info(f"사용자 API 토큰 생성: {current_user.username}")
            return UserApiTokenResponse.model_validate(new_token)
            
    except Exception as e:
        db.rollback()
        logger.error(f"API 토큰 생성 중 오류: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create API token"
        )


@router.get("/api-token", response_model=UserApiTokenResponse)
async def get_user_api_token(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """사용자 API 토큰 조회"""
    try:
        token = db.query(UserApiToken).filter(
            UserApiToken.user_id == current_user.id,
            UserApiToken.service == "KIS"
        ).first()
        
        if not token:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="API token not found"
            )
        
        return UserApiTokenResponse.model_validate(token)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"API 토큰 조회 중 오류: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve API token"
        )


@router.delete("/api-token")
async def delete_user_api_token(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """사용자 API 토큰 삭제"""
    try:
        token = db.query(UserApiToken).filter(
            UserApiToken.user_id == current_user.id,
            UserApiToken.service == "KIS"
        ).first()
        
        if not token:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="API token not found"
            )
        
        db.delete(token)
        db.commit()
        
        logger.info(f"사용자 API 토큰 삭제: {current_user.username}")
        return {"message": "API token deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"API 토큰 삭제 중 오류: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete API token"
        )