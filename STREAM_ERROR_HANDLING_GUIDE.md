# Quick Reference: Stream Error Handling

## How It Works

The streaming connection now has **automatic error recovery** that keeps the stream running unless you explicitly click the stop button.

## User Actions

### Starting the Stream
- Click the microphone button
- Stream connects automatically
- Audio starts flowing

### Stopping the Stream
- Click the microphone button again
- Stream disconnects immediately
- **No automatic reconnection** (as intended)

## Automatic Recovery Scenarios

### Network Drops
**What happens:**
- Connection lost detected
- System waits 1 second, then tries to reconnect
- If that fails, waits 2 seconds, then 4, 8, 16...
- Up to 5 reconnection attempts

**User sees:**
```
🔄 Connection lost. Reconnecting in 1.0s... (attempt 1/5)
```

### Reconnection Success
**User sees:**
```
✅ Reconnected successfully!
```

### All Attempts Failed
**User sees:**
```
⚠️ Connection lost after multiple attempts. 
Please click the microphone button to reconnect.
```

### Tool Call Errors
**What happens:**
- Tool execution error caught
- Error logged and reported
- Audio stream **automatically resumes**
- User conversation continues smoothly

### Audio Processing Errors
**What happens:**
- Audio buffer error caught
- Error logged (doesn't break stream)
- Stream continues processing

## Circuit Breaker (Safety Feature)

If the system detects **3 consecutive connection failures** in rapid succession:

1. **Circuit opens**: Prevents immediate retry
2. **Cooldown**: 60-second pause
3. **User message**: "Too many connection failures. Cooling down for 60s..."
4. **Auto-reset**: After 60 seconds, allows retries again

This prevents:
- Server overload
- Excessive API calls
- Battery drain on client

## Developer Console Logs

### Connection Events
```
🔌 Live connection OPEN
🔌 Live connection CLOSE
```

### Reconnection
```
🔄 Attempting to reconnect in 2000ms (attempt 2/5)...
🔌 Attempting reconnection...
✅ Reconnection successful
```

### Errors
```
❌ Live connection error: [error details]
❌ Connection failed (2/3): [error message]
⚠️ Fatal error detected, initiating reconnection...
```

### Tool Calls
```
🧰 Toolcall received: ['search_knowledge_base']
▶️ Resuming audio streamer after tool call
```

## Configuration (in useLiveAPI.ts)

```typescript
// Reconnection settings
maxReconnectAttempts = 5           // Try up to 5 times
baseReconnectDelayMs = 1000        // Start with 1 second
maxReconnectDelayMs = 30000        // Cap at 30 seconds

// Circuit breaker settings  
maxConsecutiveFailures = 3         // Open after 3 failures
circuitBreakerResetTimeMs = 60000  // Reset after 60 seconds
```

## Exponential Backoff Formula

```
delay = min(baseDelay × 2^(attempt-1), maxDelay)
```

Example delays:
- Attempt 1: 1s
- Attempt 2: 2s
- Attempt 3: 4s
- Attempt 4: 8s
- Attempt 5: 16s

## Testing Tips

### Test Auto-Reconnect
1. Start stream
2. Kill backend server: `Ctrl+C` on FastAPI terminal
3. Observe: Reconnection attempts with backoff
4. Restart backend
5. Observe: Connection restored automatically

### Test Manual Disconnect
1. Start stream
2. Click stop button
3. Observe: No reconnection attempts
4. Stream stays stopped

### Test Circuit Breaker
1. Start stream with backend offline
2. Try connecting 3 times rapidly
3. Observe: Circuit breaker opens
4. Wait 60 seconds
5. Observe: Circuit resets

### Test Tool Error Recovery
1. Start stream
2. Ask a question that triggers `search_knowledge_base`
3. Kill backend during search
4. Observe: Tool error caught, audio resumes

## Error Messages Explained

| Message | Meaning | Action Needed |
|---------|---------|---------------|
| 🔄 Reconnecting... | Auto-recovery in progress | None - wait |
| ✅ Connection established! | Recovery successful | None |
| ⚠️ Stream error | Non-fatal error | None - continues |
| ⚠️ Connection lost after multiple attempts | Max retries reached | Click mic to retry |
| ⚠️ Too many connection failures | Circuit breaker open | Wait 60s |

## Common Issues

### Stream Won't Start
**Check:**
- API key configured?
- Backend server running?
- Browser console for errors?

### Constant Reconnecting
**Possible causes:**
- Backend unstable
- Network issues
- API rate limiting

**Solution:**
- Check backend logs
- Verify network stability
- Check API quota

### Circuit Breaker Triggered
**Why:**
- Backend offline
- Network completely down
- API authentication failed

**Solution:**
- Fix underlying issue
- Wait for circuit reset (60s)
- Manually reconnect

## Best Practices

### For Users
- ✅ Let auto-recovery work (don't spam reconnect)
- ✅ Wait for "Reconnected successfully" message
- ✅ Click stop only when you want to end session

### For Developers
- ✅ Monitor console logs for patterns
- ✅ Check backend health first
- ✅ Verify API key and quotas
- ✅ Test with network throttling

## Summary

The stream is designed to be **resilient and self-healing**:
- Automatically recovers from temporary issues
- Backs off intelligently to prevent overload
- Keeps user informed with clear messages
- Only stops when user explicitly requests

**You can trust it to keep running smoothly!** 🚀
