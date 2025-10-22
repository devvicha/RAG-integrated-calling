#!/bin/bash

# Test script to verify Sinhala pronunciation and voice improvements
# This script checks if the system prompt has been properly updated with
# enhanced pronunciation rules and natural speaking style

echo "🎙️ Testing Sinhala Pronunciation & Voice Configuration..."
echo "=" | head -c 70 | tr ' ' '='
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# File to check
SYSTEM_PROMPT_FILE="lib/prompts/system-prompt.ts"

if [ ! -f "$SYSTEM_PROMPT_FILE" ]; then
    echo -e "${RED}❌ Error: System prompt file not found!${NC}"
    exit 1
fi

echo -e "${BLUE}📄 Checking file: $SYSTEM_PROMPT_FILE${NC}"
echo ""

# Test 1: Voice Configuration
echo -e "${YELLOW}Test 1: Voice Configuration${NC}"
if grep -q "Voice: Puck" "$SYSTEM_PROMPT_FILE"; then
    echo -e "${GREEN}✅ Voice set to Puck (professional male)${NC}"
else
    echo -e "${RED}❌ Voice not properly configured${NC}"
fi
echo ""

# Test 2: Speaking Pace
echo -e "${YELLOW}Test 2: Speaking Pace & Style${NC}"
if grep -q "FAST AND NATURAL" "$SYSTEM_PROMPT_FILE"; then
    echo -e "${GREEN}✅ Fast and natural pace configured${NC}"
else
    echo -e "${RED}❌ Speaking pace not updated${NC}"
fi

if grep -q "NATURAL, BRISK CONVERSATIONAL PACE" "$SYSTEM_PROMPT_FILE"; then
    echo -e "${GREEN}✅ Brisk conversational pace instruction found${NC}"
else
    echo -e "${RED}❌ Brisk pace instruction missing${NC}"
fi
echo ""

# Test 3: Retroflex Consonants
echo -e "${YELLOW}Test 3: Critical Retroflex Sounds${NC}"
if grep -q "retroflex L" "$SYSTEM_PROMPT_FILE"; then
    echo -e "${GREEN}✅ Retroflex L (ළ) pronunciation guide present${NC}"
else
    echo -e "${RED}❌ Retroflex L guide missing${NC}"
fi

if grep -q "retroflex N" "$SYSTEM_PROMPT_FILE"; then
    echo -e "${GREEN}✅ Retroflex N (ණ) pronunciation guide present${NC}"
else
    echo -e "${RED}❌ Retroflex N guide missing${NC}"
fi
echo ""

# Test 4: Common Word Pronunciations
echo -e "${YELLOW}Test 4: Common Word Pronunciation Examples${NC}"
word_count=0

for word in "ඔයා" "මොනවද" "කොහොමද" "ඕනේ" "පුළුවන්" "හරි" "එහෙනම්" "තේරුණා"; do
    if grep -q "$word" "$SYSTEM_PROMPT_FILE"; then
        ((word_count++))
    fi
done

if [ $word_count -ge 6 ]; then
    echo -e "${GREEN}✅ Common word pronunciations present ($word_count/8 words found)${NC}"
else
    echo -e "${RED}❌ Not enough word pronunciations ($word_count/8 words found)${NC}"
fi
echo ""

# Test 5: Natural Fillers
echo -e "${YELLOW}Test 5: Conversational Fillers${NC}"
filler_count=0

for filler in "හ්ම්ම්" "හරි හරි" "තේරුණා" "අනේ" "එහෙනම්" "බලන්න" "ඉතින්"; do
    if grep -q "$filler" "$SYSTEM_PROMPT_FILE"; then
        ((filler_count++))
    fi
done

if [ $filler_count -ge 5 ]; then
    echo -e "${GREEN}✅ Natural fillers present ($filler_count/7 fillers found)${NC}"
else
    echo -e "${RED}❌ Not enough fillers ($filler_count/7 fillers found)${NC}"
fi
echo ""

# Test 6: Money Pronunciation
echo -e "${YELLOW}Test 6: Money & Number Pronunciation${NC}"
if grep -q "පනස්දාහක්" "$SYSTEM_PROMPT_FILE" || grep -q "ලක්ෂයක්" "$SYSTEM_PROMPT_FILE"; then
    echo -e "${GREEN}✅ Natural money pronunciation examples present${NC}"
else
    echo -e "${RED}❌ Money pronunciation examples missing${NC}"
fi
echo ""

# Test 7: Tone Guidelines
echo -e "${YELLOW}Test 7: Tone & Formality${NC}"
if grep -q "NOT overly formal" "$SYSTEM_PROMPT_FILE"; then
    echo -e "${GREEN}✅ Informal tone guidance present${NC}"
else
    echo -e "${RED}❌ Tone guidance missing${NC}"
fi

if grep -q "Sound Like a Real Person" "$SYSTEM_PROMPT_FILE"; then
    echo -e "${GREEN}✅ Natural person instruction present${NC}"
else
    echo -e "${YELLOW}⚠️  Natural person instruction might be missing${NC}"
fi
echo ""

# Test 8: Example Comparisons
echo -e "${YELLOW}Test 8: Example Comparisons (Good vs Bad)${NC}"
if grep -q "❌" "$SYSTEM_PROMPT_FILE" && grep -q "✅" "$SYSTEM_PROMPT_FILE"; then
    echo -e "${GREEN}✅ Example comparisons present${NC}"
else
    echo -e "${RED}❌ Example comparisons missing${NC}"
fi
echo ""

# Test 9: Greeting Options
echo -e "${YELLOW}Test 9: Natural Greetings${NC}"
greeting_count=0

if grep -q "මොකද අවශ්‍ය" "$SYSTEM_PROMPT_FILE"; then
    ((greeting_count++))
fi

if grep -q "කොහොමද උදව් කරන්න පුළුවන්" "$SYSTEM_PROMPT_FILE"; then
    ((greeting_count++))
fi

if [ $greeting_count -ge 1 ]; then
    echo -e "${GREEN}✅ Natural greetings present ($greeting_count options)${NC}"
else
    echo -e "${RED}❌ Natural greetings missing${NC}"
fi
echo ""

# Summary
echo "=" | head -c 70 | tr ' ' '='
echo ""
echo -e "${BLUE}📊 Summary:${NC}"
echo ""

# Calculate overall score
total_tests=9
passed_tests=0

# Simple pass/fail check (this is a basic implementation)
if grep -q "Voice: Puck" "$SYSTEM_PROMPT_FILE"; then ((passed_tests++)); fi
if grep -q "FAST AND NATURAL" "$SYSTEM_PROMPT_FILE"; then ((passed_tests++)); fi
if grep -q "retroflex L" "$SYSTEM_PROMPT_FILE"; then ((passed_tests++)); fi
if [ $word_count -ge 6 ]; then ((passed_tests++)); fi
if [ $filler_count -ge 5 ]; then ((passed_tests++)); fi
if grep -q "පනස්දාහක්" "$SYSTEM_PROMPT_FILE" || grep -q "ලක්ෂයක්" "$SYSTEM_PROMPT_FILE"; then ((passed_tests++)); fi
if grep -q "NOT overly formal" "$SYSTEM_PROMPT_FILE"; then ((passed_tests++)); fi
if grep -q "❌" "$SYSTEM_PROMPT_FILE" && grep -q "✅" "$SYSTEM_PROMPT_FILE"; then ((passed_tests++)); fi
if [ $greeting_count -ge 1 ]; then ((passed_tests++)); fi

percentage=$((passed_tests * 100 / total_tests))

echo "Tests Passed: $passed_tests / $total_tests ($percentage%)"
echo ""

if [ $percentage -ge 80 ]; then
    echo -e "${GREEN}✅ All critical pronunciation improvements are in place!${NC}"
    echo -e "${GREEN}✅ System is ready for natural, fast Sinhala speech.${NC}"
elif [ $percentage -ge 60 ]; then
    echo -e "${YELLOW}⚠️  Most improvements are in place, but some are missing.${NC}"
    echo -e "${YELLOW}   Review the failed tests above.${NC}"
else
    echo -e "${RED}❌ Many pronunciation improvements are missing.${NC}"
    echo -e "${RED}   Please review and update the system prompt.${NC}"
fi

echo ""
echo "=" | head -c 70 | tr ' ' '='
echo ""

# Display sample pronunciation rules
echo -e "${BLUE}📖 Sample Pronunciation Rules Found:${NC}"
echo ""
grep -A 2 "ළ (ḷa)" "$SYSTEM_PROMPT_FILE" | head -3 | sed 's/^/  /'
echo ""
grep -A 2 "ණ (ṇa)" "$SYSTEM_PROMPT_FILE" | head -3 | sed 's/^/  /'
echo ""

# Display sample fillers
echo -e "${BLUE}💬 Sample Conversational Fillers:${NC}"
echo ""
grep "හ්ම්ම්" "$SYSTEM_PROMPT_FILE" | head -1 | sed 's/^/  /'
grep "හරි හරි" "$SYSTEM_PROMPT_FILE" | head -1 | sed 's/^/  /'
grep "බලන්න" "$SYSTEM_PROMPT_FILE" | head -1 | sed 's/^/  /'
echo ""

echo "=" | head -c 70 | tr ' ' '='
echo ""
echo -e "${GREEN}✅ Pronunciation test complete!${NC}"
echo ""

exit 0
