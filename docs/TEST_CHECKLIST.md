# 🧪 Stream Error Handling - Test Checklist

Use this checklist to verify that the error handling implementation is working correctly.

---

## Pre-Test Setup

- [ ] Backend server running (`cd backend && python -m uvicorn rag.search_rag:app --reload --port 8000`)
- [ ] Frontend dev server running (`npm run dev`)
- [ ] Browser console open (F12) to see logs
- [ ] API key configured in `.env.local`

---

## Test 1: Normal Operation ✅

**Objective**: Verify basic stream functionality

### Steps
1. [ ] Click microphone button to start stream
2. [ ] Verify connection opens (see "🔌 Live connection OPEN" in console)
3. [ ] Speak a test question
4. [ ] Verify audio response plays
5. [ ] Click microphone button to stop
6. [ ] Verify clean disconnect (see "👋 Disconnected by user")

### Expected Result
- Stream starts immediately
- Audio flows smoothly
- No error messages
- Clean stop on button click

---

## Test 2: Automatic Reconnection ✅

**Objective**: Verify auto-reconnect on connection drop

### Steps
1. [ ] Start stream
2. [ ] Wait for successful connection
3. [ ] Stop backend server (Ctrl+C in backend terminal)
4. [ ] Observe console for reconnection attempts
5. [ ] Restart backend server
6. [ ] Verify connection restored

### Expected Console Output
```
🔌 Live connection CLOSE
🔄 Attempting to reconnect in 1000ms (attempt 1/5)...
🔌 Attempting reconnection...
❌ Reconnection failed: [error]
🔄 Attempting to reconnect in 2000ms (attempt 2/5)...
🔌 Attempting reconnection...
✅ Reconnection successful
✅ Connection established!
```

### Expected User Messages
```
🔄 Connection lost. Reconnecting in 1.0s... (attempt 1/5)
🔄 Connection lost. Reconnecting in 2.0s... (attempt 2/5)
✅ Reconnected successfully!
```

---

## Test 3: Exponential Backoff ✅

**Objective**: Verify delays increase exponentially

### Steps
1. [ ] Start stream
2. [ ] Kill backend (keep it down)
3. [ ] Watch reconnection attempts
4. [ ] Time the delays between attempts

### Expected Delays
- Attempt 1: 1 second
- Attempt 2: 2 seconds
- Attempt 3: 4 seconds
- Attempt 4: 8 seconds
- Attempt 5: 16 seconds
- After 5 attempts: Stop retrying

### Expected Final Message
```
⚠️ Connection lost after multiple attempts. 
Please click the microphone button to reconnect.
```

---

## Test 4: Manual Disconnect (No Auto-Reconnect) ✅

**Objective**: Verify manual stop prevents auto-reconnect

### Steps
1. [ ] Start stream
2. [ ] Wait for connection
3. [ ] Click stop button
4. [ ] Kill backend server
5. [ ] Wait 30 seconds
6. [ ] Verify NO reconnection attempts

### Expected Result
- Stream stops immediately on button click
- No reconnection attempts even with backend down
- Console shows "👋 Disconnected by user"
- Stream stays stopped

---

## Test 5: Circuit Breaker ✅

**Objective**: Verify circuit breaker opens after repeated failures

### Steps
1. [ ] Ensure backend is stopped
2. [ ] Click start (attempt 1)
3. [ ] Wait for failure
4. [ ] Click start (attempt 2)
5. [ ] Wait for failure
6. [ ] Click start (attempt 3)
7. [ ] Observe circuit breaker message

### Expected Console Output
```
❌ Connection failed (1/3): [error]
❌ Connection failed (2/3): [error]
❌ Connection failed (3/3): [error]
⚠️ Too many connection failures (3). Cooling down for 60s...
```

### Expected User Message
```
⚠️ Connection failed: [error message]
⚠️ Too many connection failures (3). Cooling down for 60s...
```

### After Cooldown (60s)
8. [ ] Wait 60 seconds
9. [ ] Start backend
10. [ ] Click start
11. [ ] Verify connection successful

---

## Test 6: Tool Call Error Recovery ✅

**Objective**: Verify stream continues after tool errors

### Steps
1. [ ] Start stream with backend running
2. [ ] Ask a question that triggers `search_knowledge_base`
3. [ ] While tool is executing, kill backend
4. [ ] Observe error handling
5. [ ] Verify audio stream resumes

### Expected Console Output
```
🧰 Toolcall received: ['search_knowledge_base']
Triggering function call: **search_knowledge_base**
Error executing tool search_knowledge_base: [error]
▶️ Resuming audio streamer after tool call
✅ RAG lookup complete for **search_knowledge_base**
```

### Expected Result
- Tool error caught and logged
- Error sent to Gemini
- Audio stream automatically resumes
- Conversation continues (Gemini may say "having trouble accessing information")

---

## Test 7: Audio Processing Error ✅

**Objective**: Verify audio errors don't break stream

### Steps
1. [ ] Start stream
2. [ ] Monitor console during audio playback
3. [ ] Look for any audio processing errors
4. [ ] Verify stream continues despite errors

### Expected Behavior
- Any audio errors logged to console
- Stream continues processing
- No crash or freeze
- Audio continues for subsequent messages

---

## Test 8: Network Flicker ✅

**Objective**: Verify handling of brief network interruptions

### Steps
1. [ ] Start stream
2. [ ] Briefly toggle WiFi off and on (1-2 seconds)
3. [ ] Observe reconnection
4. [ ] Verify quick recovery

### Expected Result
- Connection drops briefly
- Auto-reconnect kicks in (attempt 1 or 2)
- Recovers within 3-4 seconds
- Stream continues smoothly

---

## Test 9: Component Unmount Cleanup ✅

**Objective**: Verify proper cleanup on page navigation

### Steps
1. [ ] Start stream with reconnection in progress
2. [ ] Navigate away from page (or refresh)
3. [ ] Check console for cleanup logs
4. [ ] Verify no timeout leaks

### Expected Result
- All event listeners removed
- Pending timeouts cleared
- No console errors
- Clean unmount

---

## Test 10: Long-Running Session ✅

**Objective**: Verify stability over extended use

### Steps
1. [ ] Start stream
2. [ ] Have multiple conversations (10+ turns)
3. [ ] Trigger several tool calls
4. [ ] Let run for 5-10 minutes
5. [ ] Verify no degradation

### Expected Result
- No memory leaks
- Consistent performance
- Audio quality stable
- No timeout buildup

---

## Test 11: Rapid Start/Stop ✅

**Objective**: Verify handling of quick user interactions

### Steps
1. [ ] Click start
2. [ ] Immediately click stop
3. [ ] Repeat 5-10 times rapidly
4. [ ] Verify clean state after each

### Expected Result
- No errors in console
- Proper cleanup each time
- State remains consistent
- No hanging connections

---

## Test 12: Multiple Simultaneous Errors ✅

**Objective**: Verify handling of compound error scenarios

### Steps
1. [ ] Start stream
2. [ ] Trigger a tool call
3. [ ] During tool execution, kill backend
4. [ ] Observe error handling cascade

### Expected Result
- Tool error caught
- Connection error caught
- Reconnection initiated
- Audio stream protected
- No crashes

---

## Performance Checks

### CPU Usage
- [ ] Normal operation: Low (<10%)
- [ ] During reconnection: Moderate spike, then low
- [ ] During tool calls: Moderate spike, then low

### Memory Usage
- [ ] No steady increase over time
- [ ] Proper cleanup on disconnect
- [ ] No leaked timeouts or listeners

### Network Usage
- [ ] Reasonable retry frequency (not spamming)
- [ ] Exponential backoff working
- [ ] Circuit breaker limiting requests

---

## Browser Compatibility

Test in multiple browsers:
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (macOS)

---

## Edge Cases

### Backend Returns 500 Error
- [ ] Stream handles gracefully
- [ ] Shows user-friendly message
- [ ] Doesn't crash

### API Key Invalid
- [ ] Clear error message
- [ ] No infinite retry loop
- [ ] User can reconfigure

### Network Completely Down
- [ ] Max retries respected (5 attempts)
- [ ] Circuit breaker eventually opens
- [ ] User can try again later

---

## Success Criteria

All tests should show:
✅ No unhandled errors in console  
✅ No crashes or frozen UI  
✅ Clear user feedback for all states  
✅ Stream continues unless user stops  
✅ Automatic recovery from transient issues  
✅ Proper cleanup on unmount  
✅ Resource-efficient operation  

---

## Failure Indicators

Watch for:
❌ Unhandled promise rejections  
❌ Infinite retry loops  
❌ Memory leaks over time  
❌ Frozen or unresponsive UI  
❌ Missing error messages  
❌ Auto-reconnect when user stops  
❌ Crashes or white screen  

---

## Notes Section

Use this space to record any issues found during testing:

```
Test Date: ______________
Tester: ______________

Issues Found:
1. 
2. 
3. 

Notes:


```

---

## Final Checklist

Before marking as complete:
- [ ] All 12 tests passed
- [ ] No console errors during testing
- [ ] Performance metrics acceptable
- [ ] Multiple browsers tested
- [ ] Edge cases handled
- [ ] User experience smooth
- [ ] Documentation reviewed

---

**Status**: ⬜ Not Started | 🔄 In Progress | ✅ Complete

**Tester Signature**: ________________  
**Date**: ________________  
**Result**: ⬜ Pass | ⬜ Fail | ⬜ Pass with Notes

---

## Quick Test Commands

```bash
# Start backend
cd backend && python -m uvicorn rag.search_rag:app --reload --port 8000

# Start frontend
npm run dev

# Stop backend (to test reconnection)
Ctrl+C in backend terminal

# Check backend status
curl http://localhost:8000/health

# Monitor logs
# Open browser console (F12) and watch for:
# - 🔌 connection events
# - 🔄 reconnection attempts
# - ❌ error messages
# - ✅ success confirmations
```
