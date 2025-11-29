# Gemini API 안전 필터 문제 분석 및 해결방안

> **작성일**: 2025-11-24  
> **문제**: `finish_reason=2` (SAFETY) 차단  
> **모델**: `models/gemini-2.5-flash`

---

## 📋 문제 원인 분석

공식 문서와 커뮤니티 리포트를 기반으로 분석한 결과:

### 1. **투자 조언 → "Dangerous Content" 오인**
- Gemini API는 **금융 데이터(숫자, 티커)를 개인정보(신용카드 번호 등)로 오인**할 수 있음
- "investment", "recommendation", "advice" 등의 키워드가 위험한 콘텐츠로 분류될 수 있음
- `HARM_CATEGORY_DANGEROUS_CONTENT` 필터가 작동

### 2. **BLOCK_NONE 설정의 제한**
- `BLOCK_NONE`은 **제한된 설정**으로, 완전히 작동하지 않을 수 있음
- **Core Harms**(아동 안전 등)는 항상 차단됨 (조정 불가)
- 일부 경우 **allowlist 권한** 필요 (Google 계정 팀 문의 또는 월 청구 결제 전환)

### 3. **모델별 차이**
- `gemini-2.5-flash`와 `gemini-2.0-flash-exp`는 안전 필터 동작이 다름
- 일부 모델에서는 `BLOCK_NONE` 대신 `OFF` 사용 가능 (비공식)

### 4. **"Soft Blocking"**
- 안전 필터로 명시적으로 차단되지 않아도 **모델이 응답 거부** 가능
- `finish_reason: SAFETY`로 표시되지만 `BLOCK_NONE`이 무시됨

---

## ✅ 해결 방안

### **방안 1: 프롬프트 재설계 (가장 효과적)** ⭐

#### 문제되는 표현 회피
```python
# ❌ 차단될 가능성 높음
"Provide investment recommendations and financial advice"
"Analyze portfolio and suggest rebalancing"

# ✅ 안전한 표현
"Analyze portfolio data characteristics"
"Describe portfolio composition patterns"
"Summarize data insights"
```

#### 구체적 변경사항
1. **"Investment" → "Portfolio Data"**
2. **"Recommendations" → "Observations" / "Patterns"**
3. **"Advice" → "Insights" / "Summary"**
4. **"Suggest" → "Describe"**
5. 금융 용어를 데이터 분석 용어로 변경

---

### **방안 2: HarmCategory 별 세밀한 설정**

#### 현재 코드 문제
```python
# 현재: 모든 카테고리에 BLOCK_NONE (작동 안 함)
safety_settings=[
    {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE"},
    {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE"},
    {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_NONE"},
    {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_NONE"},
]
```

#### 권장 설정
```python
# DANGEROUS_CONTENT만 낮춤 (금융 데이터 오인 방지)
safety_settings=[
    {
        "category": "HARM_CATEGORY_DANGEROUS_CONTENT",
        "threshold": "BLOCK_ONLY_HIGH"  # or "OFF" (일부 모델)
    }
]
```

---

### **방안 3: 응답 검증 및 Fallback 로직**

```python
def generate_portfolio_feedback_with_fallback(portfolio_data: Dict) -> Dict:
    """안전 필터 우회를 위한 fallback 로직"""
    
    # 1차 시도: 일반 프롬프트
    try:
        result = _try_generate_feedback(portfolio_data, detailed=True)
        if result['success']:
            return result
    except Exception as e:
        logger.warning(f"Detailed prompt blocked: {e}")
    
    # 2차 시도: 간소화된 프롬프트
    try:
        result = _try_generate_feedback(portfolio_data, detailed=False)
        if result['success']:
            return result
    except Exception as e:
        logger.warning(f"Simple prompt blocked: {e}")
    
    # 3차 Fallback: 규칙 기반 분석
    return _rule_based_analysis(portfolio_data)
```

---

### **방안 4: 응답 검증 강화**

```python
# finish_reason 체크 추가
if response.candidates:
    candidate = response.candidates[0]
    
    # finish_reason 상세 로깅
    logger.info(f"Finish reason: {candidate.finish_reason}")
    
    # safety_ratings 확인
    if candidate.safety_ratings:
        for rating in candidate.safety_ratings:
            logger.info(f"Category: {rating.category}, "
                       f"Probability: {rating.probability}")
    
    # SAFETY 차단 시 어떤 카테고리인지 확인
    if candidate.finish_reason == genai.types.FinishReason.SAFETY:
        blocked_category = [r for r in candidate.safety_ratings 
                          if r.probability in ['MEDIUM', 'HIGH']]
        raise SafetyBlockError(f"Blocked by: {blocked_category}")
```

---

## 🔧 수정된 코드 (권장)

```python
# src/ai/feedback.py

def generate_portfolio_feedback(portfolio_data: Dict) -> Dict:
    """안전 필터 우회 개선 버전"""
    try:
        model = get_gemini_model()
        
        # 프롬프트: 조언 대신 데이터 분석으로 표현
        prompt = f"""
Analyze the following stock portfolio data and identify patterns.

Portfolio Statistics:
- Assets: ${portfolio_data.get('total_assets_usd', 0):.2f}
- Return: {portfolio_data.get('total_return_percent', 0):.2f}%
- Sectors: {json.dumps(portfolio_data.get('sector_distribution', {}), ensure_ascii=False)}
- Holdings: {json.dumps(portfolio_data.get('top_holdings', []), ensure_ascii=False)}

Provide a data analysis in Korean using this JSON structure:
{{
  "overall_assessment": "Summary of portfolio characteristics",
  "strengths": ["observed strength 1", "observed strength 2"],
  "weaknesses": ["observed weakness 1", "observed weakness 2"],
  "observations": ["data insight 1", "data insight 2"],
  "rebalancing_suggestions": [],
  "risk_assessment": {{
    "level": "medium",
    "volatility_estimate": "10-15%",
    "concentration_risk": "보통"
  }}
}}
"""
        
        # 안전 설정: DANGEROUS_CONTENT만 완화
        response = model.generate_content(
            prompt,
            generation_config=genai.GenerationConfig(
                temperature=0.7,
                max_output_tokens=2048,
                response_mime_type="application/json"
            ),
            safety_settings={
                genai.types.HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: 
                    genai.types.HarmBlockThreshold.BLOCK_ONLY_HIGH
            }
        )
        
        # 응답 검증
        if not response.candidates:
            raise ValueError("No response candidates")
        
        candidate = response.candidates[0]
        
        # finish_reason 체크
        if candidate.finish_reason == genai.types.FinishReason.SAFETY:
            # 어떤 카테고리가 차단했는지 확인
            safety_info = {
                str(rating.category): str(rating.probability)
                for rating in candidate.safety_ratings
            }
            logger.warning(f"Safety block: {safety_info}")
            raise ValueError(f"Content blocked by safety filter: {safety_info}")
        
        if not response.text:
            raise ValueError("Empty response text")
        
        ai_response = json.loads(response.text)
        
        return {
            "success": True,
            "ai_analysis": ai_response,
            "model": "gemini-2.5-flash",
            "tokens_used": response.usage_metadata.total_token_count,
            "generated_at": datetime.now().isoformat()
        }
    
    except Exception as e:
        logger.error(f"Error generating AI feedback: {e}")
        return {
            "success": False,
            "error": str(e)
        }
```

---

## 📊 테스트 결과 예상

### 예상 성공 케이스
- ✅ 프롬프트가 "데이터 분석" 관점으로 변경됨
- ✅ `DANGEROUS_CONTENT` 임계값을 `BLOCK_ONLY_HIGH`로 낮춤
- ✅ "investment advice" 대신 "data insights" 사용

### 여전히 실패할 경우
1. **Google AI Studio에서 수동 테스트**
   - https://aistudio.google.com/
   - 프롬프트를 직접 테스트하여 어떤 표현이 차단되는지 확인
   
2. **API 키 재발급**
   - 새 프로젝트 생성
   - 새 API 키 발급
   
3. **모델 변경**
   - `models/gemini-2.5-pro` 시도
   - `models/gemini-flash-latest` 시도

---

## 🎯 즉시 적용 가능한 조치

1. **프롬프트 키워드 변경** (가장 효과적)
2. **safety_settings를 딕셔너리 형태로 변경**
3. **finish_reason 상세 로깅 추가**
4. **Fallback 로직 구현**

---

**권장 우선순위**: 
1. 프롬프트 재설계 (방안 1)
2. Safety settings 개선 (방안 2)
3. Fallback 로직 (방안 3)
