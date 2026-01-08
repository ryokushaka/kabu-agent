"""
투자 용어 가이드 서비스
"""
import logging
from typing import List, Optional
from sqlalchemy import select, func
from sqlalchemy.orm import Session

from src.database.models import GlossaryTerm
from src.database.connection import db_manager
from src.services.ai_service import GeminiService

logger = logging.getLogger(__name__)
ai_service = GeminiService()


class GlossaryService:
    """투자 용어 서비스"""

    @staticmethod
    def get_all_terms(
        category: Optional[str] = None,
        difficulty: Optional[str] = None,
        search: Optional[str] = None,
        limit: int = 50,
        offset: int = 0
    ) -> List[GlossaryTerm]:
        """용어 목록 조회"""
        with db_manager.get_session() as session:
            query = select(GlossaryTerm)

            # 필터링
            if category:
                query = query.where(GlossaryTerm.category == category)
            if difficulty:
                query = query.where(GlossaryTerm.difficulty_level == difficulty)
            if search:
                # LIKE 검색 사용 (PostgreSQL korean text search가 설치되지 않은 경우)
                query = query.where(
                    (GlossaryTerm.term_ko.ilike(f'%{search}%')) |
                    (GlossaryTerm.term_en.ilike(f'%{search}%')) |
                    (GlossaryTerm.definition.ilike(f'%{search}%'))
                )

            # 조회수 순 정렬
            query = query.order_by(GlossaryTerm.view_count.desc())

            # 페이지네이션
            query = query.limit(limit).offset(offset)

            return session.execute(query).scalars().all()

    @staticmethod
    def get_term_by_id(term_id: str) -> Optional[GlossaryTerm]:
        """용어 상세 조회"""
        with db_manager.get_session() as session:
            term = session.get(GlossaryTerm, term_id)

            # 조회수 증가
            if term:
                term.view_count += 1
                session.commit()
                session.refresh(term)

            return term

    @staticmethod
    async def generate_term_explanation(term_ko: str, term_en: str) -> str:
        """AI로 용어 설명 생성"""
        prompt = f"""
다음 투자 용어에 대한 상세한 설명을 작성해주세요:

한국어: {term_ko}
영어: {term_en}

다음 형식으로 작성:
1. 정의: 간단명료한 설명 (2-3문장)
2. 예시: 실제 사례 또는 계산 방법
3. 관련 개념: 연관된 다른 용어들

투자 초보자도 이해할 수 있도록 쉽게 설명해주세요.
"""

        explanation = await ai_service.generate_content(prompt)
        return explanation

    @staticmethod
    def increment_view_count(term_id: str):
        """조회수 증가"""
        with db_manager.get_session() as session:
            term = session.get(GlossaryTerm, term_id)
            if term:
                term.view_count += 1
                session.commit()

    @staticmethod
    def get_popular_terms(limit: int = 10) -> List[GlossaryTerm]:
        """인기 용어 조회"""
        with db_manager.get_session() as session:
            query = select(GlossaryTerm).order_by(
                GlossaryTerm.view_count.desc()
            ).limit(limit)

            return session.execute(query).scalars().all()

    @staticmethod
    def get_terms_by_category(category: str, limit: int = 20) -> List[GlossaryTerm]:
        """카테고리별 용어 조회"""
        with db_manager.get_session() as session:
            query = select(GlossaryTerm).where(
                GlossaryTerm.category == category
            ).order_by(
                GlossaryTerm.view_count.desc()
            ).limit(limit)

            return session.execute(query).scalars().all()

    @staticmethod
    def get_terms_by_difficulty(difficulty: str, limit: int = 20) -> List[GlossaryTerm]:
        """난이도별 용어 조회"""
        with db_manager.get_session() as session:
            query = select(GlossaryTerm).where(
                GlossaryTerm.difficulty_level == difficulty
            ).order_by(
                GlossaryTerm.view_count.desc()
            ).limit(limit)

            return session.execute(query).scalars().all()

    @staticmethod
    def search_terms(keyword: str, limit: int = 20) -> List[GlossaryTerm]:
        """용어 검색"""
        with db_manager.get_session() as session:
            # LIKE 검색 사용 (PostgreSQL korean text search가 설치되지 않은 경우)
            query = select(GlossaryTerm).where(
                (GlossaryTerm.term_ko.ilike(f'%{keyword}%')) |
                (GlossaryTerm.term_en.ilike(f'%{keyword}%')) |
                (GlossaryTerm.definition.ilike(f'%{keyword}%'))
            ).order_by(
                GlossaryTerm.view_count.desc()
            ).limit(limit)

            return session.execute(query).scalars().all()
