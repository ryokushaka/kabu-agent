"""
투자 용어 가이드 API
"""
from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List
from pydantic import BaseModel

from src.services.glossary_service import GlossaryService

router = APIRouter(prefix="/api/glossary", tags=["Glossary"])
glossary_service = GlossaryService()


class GlossaryTermResponse(BaseModel):
    """용어 응답 모델"""
    id: str
    term_ko: str
    term_en: str
    definition: str
    example: Optional[str]
    category: str
    difficulty_level: str
    view_count: int
    is_ai_generated: bool

    class Config:
        from_attributes = True


@router.get("/terms", response_model=List[GlossaryTermResponse])
async def get_terms(
    category: Optional[str] = None,
    difficulty: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0)
):
    """투자 용어 목록 조회"""
    try:
        terms = glossary_service.get_all_terms(
            category=category,
            difficulty=difficulty,
            search=search,
            limit=limit,
            offset=offset
        )
        return [
            GlossaryTermResponse(
                id=str(term.id),
                term_ko=term.term_ko,
                term_en=term.term_en,
                definition=term.definition,
                example=term.example,
                category=term.category,
                difficulty_level=term.difficulty_level,
                view_count=term.view_count,
                is_ai_generated=term.is_ai_generated
            )
            for term in terms
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# NOTE: Static routes must be defined BEFORE parameterized routes
# to prevent FastAPI from matching "popular" as a term_id
@router.get("/terms/popular", response_model=List[GlossaryTermResponse])
async def get_popular_terms(
    limit: int = Query(10, ge=1, le=50)
):
    """인기 용어 조회"""
    try:
        terms = glossary_service.get_popular_terms(limit=limit)
        return [
            GlossaryTermResponse(
                id=str(term.id),
                term_ko=term.term_ko,
                term_en=term.term_en,
                definition=term.definition,
                example=term.example,
                category=term.category,
                difficulty_level=term.difficulty_level,
                view_count=term.view_count,
                is_ai_generated=term.is_ai_generated
            )
            for term in terms
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/terms/{term_id}", response_model=GlossaryTermResponse)
async def get_term_detail(term_id: str):
    """용어 상세 조회"""
    try:
        term = glossary_service.get_term_by_id(term_id)
        if not term:
            raise HTTPException(status_code=404, detail="Term not found")

        return GlossaryTermResponse(
            id=str(term.id),
            term_ko=term.term_ko,
            term_en=term.term_en,
            definition=term.definition,
            example=term.example,
            category=term.category,
            difficulty_level=term.difficulty_level,
            view_count=term.view_count,
            is_ai_generated=term.is_ai_generated
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/terms/category/{category}", response_model=List[GlossaryTermResponse])
async def get_terms_by_category(
    category: str,
    limit: int = Query(20, ge=1, le=100)
):
    """카테고리별 용어 조회"""
    try:
        terms = glossary_service.get_terms_by_category(category=category, limit=limit)
        return [
            GlossaryTermResponse(
                id=str(term.id),
                term_ko=term.term_ko,
                term_en=term.term_en,
                definition=term.definition,
                example=term.example,
                category=term.category,
                difficulty_level=term.difficulty_level,
                view_count=term.view_count,
                is_ai_generated=term.is_ai_generated
            )
            for term in terms
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/terms/generate")
async def generate_term_explanation(term_ko: str, term_en: str):
    """AI로 용어 설명 생성"""
    try:
        explanation = await glossary_service.generate_term_explanation(term_ko, term_en)
        return {"explanation": explanation}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/search", response_model=List[GlossaryTermResponse])
async def search_terms(
    keyword: str = Query(..., min_length=1),
    limit: int = Query(20, ge=1, le=100)
):
    """용어 검색"""
    try:
        terms = glossary_service.search_terms(keyword=keyword, limit=limit)
        return [
            GlossaryTermResponse(
                id=str(term.id),
                term_ko=term.term_ko,
                term_en=term.term_en,
                definition=term.definition,
                example=term.example,
                category=term.category,
                difficulty_level=term.difficulty_level,
                view_count=term.view_count,
                is_ai_generated=term.is_ai_generated
            )
            for term in terms
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
