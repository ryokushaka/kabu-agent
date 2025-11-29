# AI 모델 비교: OpenAI GPT-4 vs Google Gemini

## 📊 개요

포트폴리오 AI 투자 피드백 기능 구현을 위한 최적 AI 모델 선택 분석

---

## 1. 가격 비교 (2025년 11월 기준)

### OpenAI GPT-4

| 모델 | Input Price | Output Price | 사용 케이스 |
|------|-------------|--------------|------------|
| **GPT-4** | $30.00 / 1M tokens | $60.00 / 1M tokens | 최고 품질 |
| **GPT-4 Turbo** | $10.00 / 1M tokens | $30.00 / 1M tokens | 균형 |
| **GPT-4o mini** | $0.15 / 1M tokens | $0.60 / 1M tokens | 저비용 |

### Google Gemini

| 모델 | Input Price | Output Price | 사용 케이스 |
|------|-------------|--------------|------------|
| **Gemini 1.5 Pro** | $1.25 / 1M tokens | $5.00 / 1M tokens | 고품질, 긴 컨텍스트 |
| **Gemini 1.5 Flash** | $0.075 / 1M tokens | $0.30 / 1M tokens | 빠르고 저렴 |
| **Gemini 2.0 Flash** | $0.10 / 1M tokens | $0.40 / 1M tokens | 최신, 멀티모달 |

> [!NOTE]
> **Gemini Free Tier**: 
> - 1.5 Flash: 15 RPM, 1M TPM, 1500 RPD (무료)
> - 개인 프로젝트라면 무료 티어로도 충분!

---

## 2. 포트폴리오 피드백 비용 계산

### 사용 시나리오
```
입력 토큰 (Input):
- 시스템 프롬프트: ~800 tokens
- 포트폴리오 데이터 (10개 종목): ~1,200 tokens
- 총 입력: ~2,000 tokens

출력 토큰 (Output):
- AI 분석 결과 (종합평가, 강점, 약점, 추천): ~1,500 tokens
```

### 피드백 1회당 비용

| 모델 | Input Cost | Output Cost | **총 비용** |
|------|------------|-------------|-------------|
| GPT-4 | $0.060 | $0.090 | **$0.150** |
| GPT-4 Turbo | $0.020 | $0.045 | **$0.065** |
| GPT-4o mini | $0.0003 | $0.0009 | **$0.0012** |
| **Gemini 1.5 Pro** | $0.0025 | $0.0075 | **$0.010** |
| **Gemini 1.5 Flash** | $0.00015 | $0.00045 | **$0.0006** |
| **Gemini 2.0 Flash** | $0.0002 | $0.0006 | **$0.0008** |

### 월간 비용 (사용자 100명, 일일 1회 피드백)

| 모델 | 일일 비용 (100명) | 월간 비용 (30일) |
|------|------------------|-----------------|
| GPT-4 | $15.00 | **$450.00** |
| GPT-4 Turbo | $6.50 | **$195.00** |
| GPT-4o mini | $0.12 | **$3.60** |
| **Gemini 1.5 Pro** | $1.00 | **$30.00** ⭐ |
| **Gemini 1.5 Flash** | $0.06 | **$1.80** ⭐⭐⭐ |
| **Gemini 2.0 Flash** | $0.08 | **$2.40** ⭐⭐ |

> [!IMPORTANT]
> **결론**: Gemini가 **15~250배 저렴**!

---

## 3. 성능 및 기능 비교

### 추론 능력

| 항목 | GPT-4 Turbo | Gemini 1.5 Pro | Gemini 1.5 Flash | 비고 |
|------|-------------|----------------|------------------|------|
| 일반 추론 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | Gemini Pro ≈ GPT-4 |
| 한국어 이해 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | Gemini 우수 |
| JSON 출력 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | 둘 다 JSON 모드 지원 |
| 투자 분석 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | GPT-4 약간 우세 |
| 응답 속도 | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Flash 가장 빠름 |

### 특징

#### GPT-4 Turbo
- ✅ 성숙한 API, 많은 레퍼런스
- ✅ 투자/금융 도메인 이해도 높음
- ❌ 상대적으로 고가
- ❌ 한국어 지원 보통

#### Gemini 1.5 Pro
- ✅ 긴 컨텍스트 (최대 2M tokens)
- ✅ 한국어 능력 우수
- ✅ 매우 저렴 (GPT-4 대비 1/6)
- ✅ JSON 모드, 함수 호출 지원
- ❌ 레퍼런스 상대적으로 적음

#### Gemini 1.5 Flash
- ✅ **가장 저렴** (GPT-4 대비 1/250)
- ✅ **무료 티어 제공**
- ✅ 빠른 응답 속도
- ✅ 기본적인 분석 충분
- ⚠️ 복잡한 추론에서 Pro보다 약함

---

## 4. 포트폴리오 피드백 사용 사례 평가

### 요구사항
1. 포트폴리오 데이터 분석 (섹터, 수익률, 비중)
2. 강점/약점 도출
3. 구체적 투자 조언 (3-5개)
4. 리밸런싱 제안
5. 위험도 평가

### 모델별 적합성

| 모델 | 적합성 | 이유 |
|------|--------|------|
| GPT-4 Turbo | ⭐⭐⭐⭐ | 고품질이지만 비용 부담 |
| GPT-4o mini | ⭐⭐⭐ | 저렴하지만 깊이 부족 |
| **Gemini 1.5 Pro** | ⭐⭐⭐⭐⭐ | **최적** (성능 + 가격) |
| **Gemini 1.5 Flash** | ⭐⭐⭐⭐ | 무료 티어 활용 가능 |

---

## 5. 최종 권장안

### 🏆 **추천: Google Gemini 1.5 Pro**

#### 이유
1. **가격**: GPT-4 대비 1/6 수준 ($0.01 vs $0.15)
2. **성능**: GPT-4와 거의 동등한 수준
3. **한국어**: 투자 조언을 한국어로 제공할 때 GPT-4보다 우수
4. **컨텍스트**: 2M tokens 지원 (향후 시계열 데이터 포함 시 유리)
5. **안정성**: Google AI Studio 무료 티어로 테스트 가능

#### 대안: Gemini 1.5 Flash (초기 단계)
- **무료 티어**로 시작 (15 RPM, 1500 RPD)
- 사용자 증가 시 Pro로 업그레이드

---

## 6. 구현 변경 사항

### 환경 변수

```bash
# .env
# OpenAI 대신 Google AI 사용
GOOGLE_API_KEY=your_google_ai_api_key_here

# 또는 Vertex AI 사용 (GCP)
# GOOGLE_CLOUD_PROJECT=your-project-id
# GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json
```

### Python 코드 (Gemini API)

```python
# src/ai/feedback.py
import google.generativeai as genai
import os
import json
from typing import Dict

# API 키 설정
genai.configure(api_key=os.getenv('GOOGLE_API_KEY'))

# 모델 선택
model = genai.GenerativeModel('gemini-1.5-pro')  # 또는 'gemini-1.5-flash'

def generate_portfolio_feedback(portfolio_data: Dict) -> Dict:
    """
    포트폴리오 데이터를 분석하여 AI 피드백 생성
    """
    # 프롬프트 구성
    prompt = f"""
당신은 전문 투자 자문가입니다. 다음 포트폴리오를 분석하고 조언을 제공하세요.

## 포트폴리오 정보
- 총 자산: ${portfolio_data['total_assets_usd']} USD
- 총 수익률: {portfolio_data['total_return_percent']}%
- 일일 수익률: {portfolio_data['daily_return_percent']}%

### 섹터 분포
{json.dumps(portfolio_data['sector_distribution'], ensure_ascii=False, indent=2)}

### 보유 종목 (상위 5개)
{json.dumps(portfolio_data['top_holdings'], ensure_ascii=False, indent=2)}

## 분석 요청사항
1. 포트폴리오 종합 평가 (1-2문장)
2. 강점 분석 (2-3개)
3. 약점 및 개선점 (2-3개)
4. 구체적인 투자 조언 (3-5개)
5. 리밸런싱 제안 (필요시)
6. 위험도 평가

## 응답 형식
JSON 형식으로 다음 구조를 따라주세요:
{{
  "overall_assessment": "종합 평가 문장",
  "strengths": ["강점1", "강점2", "강점3"],
  "weaknesses": ["약점1", "약점2"],
  "recommendations": ["조언1", "조언2", "조언3"],
  "rebalancing_suggestions": [
    {{
      "action": "reduce",
      "ticker": "AAPL",
      "current_weight": 15.0,
      "target_weight": 12.0,
      "reason": "이유"
    }}
  ],
  "risk_assessment": {{
    "level": "medium_high",
    "volatility_estimate": "15-20%",
    "concentration_risk": "높음"
  }}
}}

한국어로 답변해주세요.
"""

    # Gemini API 호출
    response = model.generate_content(
        prompt,
        generation_config=genai.GenerationConfig(
            temperature=0.7,
            top_p=0.95,
            top_k=40,
            max_output_tokens=2048,
            response_mime_type="application/json"  # JSON 모드
        )
    )
    
    # 응답 파싱
    ai_response = json.loads(response.text)
    
    return {
        "success": True,
        "ai_analysis": ai_response,
        "model": "gemini-1.5-pro",
        "tokens_used": response.usage_metadata.total_token_count
    }
```

### 의존성 추가

```bash
# requirements.txt에 추가
google-generativeai>=0.3.0
```

```bash
# 설치
pip install google-generativeai
```

---

## 7. API 키 발급 방법

### Option 1: Google AI Studio (간편, 무료 티어)

1. [Google AI Studio](https://aistudio.google.com/) 접속
2. "Get API Key" 클릭
3. Google 계정 로그인
4. API 키 생성 (무료!)
5. `.env` 파일에 추가

```bash
GOOGLE_API_KEY=AIzaSy...
```

### Option 2: Vertex AI (GCP, 프로덕션)

1. GCP 콘솔에서 Vertex AI 활성화
2. Service Account 생성
3. JSON 키 다운로드
4. 환경 변수 설정

```bash
GOOGLE_CLOUD_PROJECT=your-project-id
GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json
```

---

## 8. 비용 비교 요약

### 시나리오: 사용자 100명, 일일 1회 피드백

| 항목 | OpenAI GPT-4 Turbo | **Google Gemini 1.5 Pro** | 절감액 |
|------|--------------------|-----------------------------|--------|
| 피드백 1회 | $0.065 | **$0.010** | -85% |
| 일간 (100명) | $6.50 | **$1.00** | $5.50 |
| 월간 (30일) | $195.00 | **$30.00** | **$165.00** |
| 연간 | $2,340.00 | **$360.00** | **$1,980.00** |

> [!TIP]
> **Gemini 1.5 Flash 무료 티어 활용 시**:
> - 일간 1,500 요청까지 무료 (사용자 1,500명 커버)
> - 초기 단계에서는 비용 $0!

---

## 9. 성능 테스트 결과 (예상)

### 테스트 시나리오
- 포트폴리오: 10개 종목, 다양한 섹터
- 요청: 강점/약점/추천 분석

### 예상 결과

| 메트릭 | GPT-4 Turbo | Gemini 1.5 Pro | Gemini 1.5 Flash |
|--------|-------------|----------------|------------------|
| 응답 품질 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| 한국어 자연스러움 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| 응답 속도 | 2-3초 | 1-2초 | **0.5-1초** |
| JSON 파싱 성공률 | 95% | 98% | 95% |

---

## 10. 최종 결론 및 권장사항

### ✅ **권장: Google Gemini 1.5 Pro**

**최종 선택 이유**:
1. ⭐ **비용 효율성**: GPT-4 대비 1/6 ($30/월 vs $195/월)
2. ⭐ **성능**: GPT-4와 거의 동등한 분석 품질
3. ⭐ **한국어 지원**: 투자 조언을 한국어로 제공 시 우수
4. ⭐ **확장성**: 무료 티어로 시작 → Pro로 업그레이드 가능
5. ⭐ **미래 대비**: 긴 컨텍스트 (2M tokens)로 시계열 분석 확장 용이

### 📋 구현 우선순위

#### Phase 1: 무료 티어로 시작 (권장)
- **Gemini 1.5 Flash** 무료 티어
- 일일 1,500 요청까지 무료
- 초기 사용자 검증 및 피드백 수집

#### Phase 2: 유료 전환 (사용자 증가 시)
- **Gemini 1.5 Pro** 유료 플랜
- 더 높은 품질 + 여전히 저렴

#### 백업 옵션: GPT-4o mini
- Gemini 장애 시 fallback
- 비용: ~$0.0012/피드백

---

**문서 작성일**: 2025-11-24  
**최종 권장**: Google Gemini 1.5 Pro (무료 티어로 시작)
