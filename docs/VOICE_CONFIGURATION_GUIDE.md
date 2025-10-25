# Professional Sri Lankan Male Voice Configuration for TTS

## Current Configuration Status

### Current Voice Settings
- **Default Voice**: `Zephyr`
- **System Prompt**: Includes Sinhala pronunciation guidance
- **Voice Temperature**: Currently not explicitly configured (should be 0.8)

### Available Gemini Live API Voices
The system has access to 31 different voice options. For a **professional, realistic Sri Lankan male voice**, the best options are:

## Recommended Voice Options (Ranked)

### 1. **Puck** (HIGHLY RECOMMENDED for Male Sri Lankan)
- **Character**: Deep, warm, mature male voice
- **Best for**: Professional banking, customer service
- **Accent compatibility**: Works well with Sinhala pronunciation
- **Tone**: Authoritative yet friendly

### 2. **Charon** (Alternative)
- **Character**: Steady, calm male voice
- **Best for**: Serious, professional contexts
- **Accent compatibility**: Clear articulation
- **Tone**: Formal and composed

### 3. **Fenrir** (Deeper Option)
- **Character**: Deeper male voice
- **Best for**: Authority and trust
- **Accent compatibility**: Strong presence
- **Tone**: Confident and reassuring

### 4. **Orus** (Balanced Option)
- **Character**: Balanced male voice
- **Best for**: Versatile professional use
- **Accent compatibility**: Good clarity
- **Tone**: Professional yet approachable

## Implementation Steps

### Quick Fix (Update DEFAULT_VOICE constant)
Change the default voice from `Zephyr` to `Puck` for better male voice quality.

### Enhanced Configuration (Add voice parameters)
Add speech synthesis parameters for more natural, realistic output:
- **Speaking Rate**: 0.95 (slightly slower for clarity)
- **Pitch**: -2 to -4 semitones (deeper, more masculine)
- **Volume Gain**: 0 dB (neutral)

## Current Issues with Voice Quality

### Problems:
1. **Default voice (Zephyr)** is more neutral/feminine
2. **No pitch/rate control** in current config
3. **Temperature** mentioned in prompt but not in API config
4. **Sinhala pronunciation** depends on system prompt only

### Solutions:
1. ✅ Change to `Puck` voice (male, professional)
2. ✅ Add explicit `speechConfig` parameters
3. ✅ Optimize system prompt for Sinhala characteristics
4. ✅ Fine-tune speaking rate for Sri Lankan accent

## Files to Modify

### 1. `/lib/constants.ts`
Update `DEFAULT_VOICE` from `'Zephyr'` to `'Puck'`

### 2. `/components/demo/streaming-console/StreamingConsole.tsx`
Enhance `speechConfig` with additional parameters

### 3. `/lib/prompts/system-prompt.ts`
Optimize voice instructions for male characteristics

## Detailed Configuration

### Voice Characteristics Matrix

| Voice Name | Gender | Tone | Professional | Accent-Friendly |
|------------|--------|------|--------------|-----------------|
| **Puck** | ♂️ Male | Warm | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Charon** | ♂️ Male | Steady | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Fenrir** | ♂️ Male | Deep | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Orus** | ♂️ Male | Balanced | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| Zephyr (current) | ⚧ Neutral | Light | ⭐⭐⭐ | ⭐⭐⭐ |

## System Prompt Enhancements for Male Voice

Add these characteristics to the system prompt:
- Lower pitch range (masculine timbre)
- Slightly slower pace (authoritative)
- Confident tone (banking professional)
- Clear articulation (Sri Lankan English/Sinhala)

## Testing Recommendations

After implementing changes, test with these phrases:

### Sinhala Test Phrases:
1. "ආයුබෝවන්, සම්පත් බැංකුවට ඔබව සාදරයෙන් පිළිගන්නෙමු."
2. "මම ඔයාට උපකාර කරන්න සතුටුයි."
3. "ඔයාට කොහොමද සම්පත් බැංකුවේ ණය සේවාවන් ගැන දැනගන්න ඕනේ?"

### Expected Voice Quality:
- ✅ Deep, warm male voice
- ✅ Professional banking tone
- ✅ Natural Sinhala pronunciation
- ✅ Clear, confident delivery
- ✅ Appropriate pace (not too fast/slow)

## Advanced Configuration Options

### Option 1: Runtime Voice Selection
Allow users to choose voice preference from settings

### Option 2: Context-Based Voice
- Standard queries: `Puck` (professional)
- Urgent/important: `Fenrir` (authoritative)
- Friendly/casual: `Orus` (approachable)

### Option 3: Voice Modulation
Add real-time pitch and rate adjustments based on conversation context

## Comparison: Before vs After

### Before (Zephyr):
- ❌ Neutral/feminine tone
- ❌ Not professional enough
- ❌ Less authoritative
- ❌ May not match Sri Lankan customer expectations

### After (Puck):
- ✅ Deep male voice
- ✅ Professional banking tone
- ✅ Authoritative yet friendly
- ✅ Better matches customer expectations
- ✅ More realistic for financial services

## Implementation Priority

1. **High Priority** (Immediate): Change DEFAULT_VOICE to `Puck`
2. **Medium Priority** (Soon): Add system prompt voice characteristics
3. **Low Priority** (Future): Add runtime voice selection UI

## Next Steps

Would you like me to:
1. ✅ Update `DEFAULT_VOICE` to `Puck` immediately?
2. ✅ Enhance system prompt with male voice characteristics?
3. ✅ Add voice selection UI for testing different options?
4. ⏳ Implement advanced speech parameters (pitch, rate, etc.)?

---

**Recommended Action**: Implement changes 1-3 for immediate improvement in voice quality and professionalism.
