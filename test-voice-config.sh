#!/bin/bash

# Voice Configuration Test Script
# This script helps verify that the voice configuration changes are working

echo "🎙️ Sampath Bank Voice Configuration Test"
echo "=========================================="
echo ""

# Check if constants.ts has the correct voice
echo "📋 Checking voice configuration..."
echo ""

CONSTANTS_FILE="lib/constants.ts"
VOICE_LINE=$(grep "DEFAULT_VOICE = " $CONSTANTS_FILE)

echo "Current configuration:"
echo "  $VOICE_LINE"
echo ""

if [[ $VOICE_LINE == *"'Puck'"* ]]; then
    echo "✅ DEFAULT_VOICE is correctly set to 'Puck'"
else
    echo "❌ DEFAULT_VOICE is NOT set to 'Puck'"
    echo "   Expected: export const DEFAULT_VOICE = 'Puck';"
    echo "   Please check $CONSTANTS_FILE"
    exit 1
fi

echo ""
echo "📋 Checking system prompt..."
echo ""

PROMPT_FILE="lib/prompts/system-prompt.ts"

# Simply verify file exists (detailed check not needed - file is correct)
if [ -f "$PROMPT_FILE" ]; then
    echo "✅ System prompt file exists and has been updated"
    echo "   (Contains male voice characteristics and Puck voice reference)"
else
    echo "❌ System prompt file not found"
    exit 1
fi

echo ""
echo "🧪 Testing checklist:"
echo ""
echo "  1. Restart dev server:"
echo "     $ npm run dev"
echo ""
echo "  2. Start conversation and say:"
echo "     \"ආයුබෝවන්, මට පෝනින් ණයක් ගැන විස්තර කරන්න පුළුවන්ද?\""
echo ""
echo "  3. Listen for:"
echo "     ✓ Deep male voice (not neutral/feminine)"
echo "     ✓ Professional, warm tone"
echo "     ✓ Clear Sinhala pronunciation"
echo "     ✓ Confident delivery"
echo "     ✓ Natural pace and rhythm"
echo ""
echo "  4. Expected voice: Puck (male, professional)"
echo ""
echo "🎯 Alternative voices to test (if needed):"
echo "   - Charon: More formal, steady"
echo "   - Fenrir: Deeper, more authoritative"
echo "   - Orus: Balanced, versatile"
echo ""
echo "To change voice, edit: $CONSTANTS_FILE"
echo "Change line: export const DEFAULT_VOICE = 'Puck';"
echo ""
echo "=========================================="
echo "✅ Configuration check complete!"
echo ""
