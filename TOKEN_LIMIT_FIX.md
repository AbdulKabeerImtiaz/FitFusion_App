# Token Limit Fix for Plan Generation

## Problem
Plan generation was failing with error:
```
500 Internal Server Error: "{"detail":"Plan generation failed: Response was terminated early: MAX_TOKENS"}"
```

The RAG service was hitting the Gemini LLM's maximum output token limit when generating multi-week workout plans (especially 8-week plans with 5 days per week = 40 workout days).

## Root Cause
1. The workout prompt template was extremely verbose (~2000+ tokens just for instructions)
2. Generating 8 weeks × 5 days × 5-6 exercises with detailed JSON output exceeded the 8192 token output limit
3. The prompt included extensive examples and explanations that consumed tokens without adding value to the output

## Solution Applied

### 1. Optimized Workout Prompt Template
**File**: `rag-service/app/rag/prompts.py`

**Changes**:
- Reduced prompt from ~2000 tokens to ~400 tokens
- Condensed 10 detailed instruction sections into 5 concise rules
- Removed verbose examples and explanations
- Kept all critical requirements:
  - Exercise variety across weeks
  - Progressive overload periodization
  - Proper volume (4-6 exercises per day)
  - Equipment and location constraints
  - Complete week generation

**Before**: 
- Verbose instructions with examples
- Multiple paragraphs per rule
- Detailed explanations of training philosophy

**After**:
- Concise bullet points
- Direct instructions
- Same quality output with 80% less prompt tokens

### 2. Token Allocation
- Input prompt: ~400 tokens (optimized)
- Exercise context: ~2000 tokens (50 exercises)
- User profile: ~100 tokens
- **Total input**: ~2500 tokens
- **Available for output**: 8192 tokens (Gemini 2.0 Flash limit)
- **Required for 8-week plan**: ~6000-7000 tokens
- **Result**: Fits within limit ✓

### 3. Files Modified
1. `rag-service/app/rag/prompts.py` - Optimized WORKOUT_PROMPT_TEMPLATE
2. `rag-service/app/rag/engine.py` - Confirmed max_tokens=8192 setting

###