/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
/**
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GenAILiveClient } from '../lib/GenAILiveClient';
import { LiveConnectConfig, LiveServerToolCall } from '@google/genai';
import { AudioStreamer } from '../../tts/lib/AudioStreamer';
import { audioContext } from '../../lib/utils';
import VolMeterWorket from '../../stt/lib/worklets/VolMeter';
import { useLogStore, useSettings } from '../lib/state';
import { FunctionDispatcher } from '../../lib/services/function-dispatcher-new';
import { knowledgeDocuments } from '../../lib/services/knowledge-loader';

export type UseLiveApiResults = {
  client: GenAILiveClient;
  setConfig: (config: LiveConnectConfig) => void;
  config: LiveConnectConfig;

  connect: () => Promise<void>;
  disconnect: () => void;
  connected: boolean;

  volume: number;
};

export function useLiveApi({
  apiKey,
}: {
  apiKey: string;
}): UseLiveApiResults {
  const { model } = useSettings();
  const client = useMemo(() => new GenAILiveClient(apiKey, model), [apiKey, model]);
  
  // Initialize function dispatcher
  const functionDispatcher = useMemo(() => new FunctionDispatcher(apiKey), [apiKey]);
  const [dispatcherInitialized, setDispatcherInitialized] = useState(false);

  const audioStreamerRef = useRef<AudioStreamer | null>(null);

  const [volume, setVolume] = useState(0);
  const [connected, setConnected] = useState(false);
  const [config, setConfig] = useState<LiveConnectConfig>({});
  
  // Track if user manually disconnected
  const userDisconnectedRef = useRef(false);
  // Track reconnection attempts with exponential backoff
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;
  const baseReconnectDelayMs = 1000; // Start with 1 second
  const maxReconnectDelayMs = 30000; // Max 30 seconds
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Track consecutive connection failures for circuit breaker
  const consecutiveFailuresRef = useRef(0);
  const maxConsecutiveFailures = 3;
  const circuitBreakerResetTimeMs = 60000; // Reset after 1 minute

  // Initialize function dispatcher when component mounts
  useEffect(() => {
    if (dispatcherInitialized) return;

    let cancelled = false;

    (async () => {
      try {
        console.log('🧩 Initializing FunctionDispatcher with knowledge base…');
        await functionDispatcher.initialize(knowledgeDocuments);
        if (!cancelled) {
          setDispatcherInitialized(true);
          console.log('✅ FunctionDispatcher ready');
        }
      } catch (error) {
        console.error('❌ Failed to initialize function dispatcher:', error);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [functionDispatcher, dispatcherInitialized]);

  // register audio for streaming server -> speakers
  useEffect(() => {
    if (!audioStreamerRef.current) {
      audioContext({ id: 'audio-out' }).then((audioCtx: AudioContext) => {
        audioStreamerRef.current = new AudioStreamer(audioCtx);
        audioStreamerRef.current
          .addWorklet<any>('vumeter-out', VolMeterWorket, (ev: any) => {
            setVolume(ev.data.volume);
          })
          .then(() => {
            // Successfully added worklet
          })
          .catch(err => {
            console.error('Error adding worklet:', err);
          });
      });
    }
  }, [audioStreamerRef]);

  useEffect(() => {
    const onOpen = () => {
      setConnected(true);
      reconnectAttemptsRef.current = 0; // Reset reconnect attempts on successful connection
      consecutiveFailuresRef.current = 0; // Reset consecutive failures
      console.log('🔌 Live connection OPEN');
      
      // Show success message if this was a reconnection
      if (reconnectAttemptsRef.current > 0) {
        useLogStore.getState().addTurn({
          role: 'system',
          text: '✅ Connection established!',
          isFinal: true,
        });
      }
    };

    const onClose = (event: CloseEvent) => {
      setConnected(false);
      console.log('🔌 Live connection CLOSE', event);
      
      // Clear any pending reconnect timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      
      // Auto-reconnect if not manually disconnected
      if (!userDisconnectedRef.current && reconnectAttemptsRef.current < maxReconnectAttempts) {
        reconnectAttemptsRef.current++;
        
        // Calculate delay with exponential backoff: 1s, 2s, 4s, 8s, 16s (capped at 30s)
        const delay = Math.min(
          baseReconnectDelayMs * Math.pow(2, reconnectAttemptsRef.current - 1),
          maxReconnectDelayMs
        );
        
        console.log(`🔄 Attempting to reconnect in ${delay}ms (attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts})...`);
        
        useLogStore.getState().addTurn({
          role: 'system',
          text: `🔄 Connection lost. Reconnecting in ${(delay / 1000).toFixed(1)}s... (attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts})`,
          isFinal: true,
        });
        
        reconnectTimeoutRef.current = setTimeout(async () => {
          try {
            console.log('🔌 Attempting reconnection...');
            await connect();
            console.log('✅ Reconnection successful');
            
            useLogStore.getState().addTurn({
              role: 'system',
              text: '✅ Reconnected successfully!',
              isFinal: true,
            });
          } catch (error) {
            console.error('❌ Reconnection failed:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            
            useLogStore.getState().addTurn({
              role: 'system',
              text: `⚠️ Reconnection failed: ${errorMessage}`,
              isFinal: true,
            });
          }
        }, delay);
      } else if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
        console.error('❌ Max reconnection attempts reached. Please manually reconnect.');
        useLogStore.getState().addTurn({
          role: 'system',
          text: '⚠️ Connection lost after multiple attempts. Please click the microphone button to reconnect.',
          isFinal: true,
        });
      }
    };

    const onError = (error: ErrorEvent) => {
      console.error('❌ Live connection error:', error);
      
      // Extract meaningful error message
      const errorMessage = error.message || error.error?.message || 'Unknown error';
      const errorType = error.error?.name || error.type || 'Error';
      
      // Add error message to UI
      useLogStore.getState().addTurn({
        role: 'system',
        text: `⚠️ Stream error (${errorType}): ${errorMessage}`,
        isFinal: true,
      });
      
      // Check if this is a fatal error that requires reconnection
      const isFatalError = 
        errorMessage.toLowerCase().includes('network') ||
        errorMessage.toLowerCase().includes('timeout') ||
        errorMessage.toLowerCase().includes('connection') ||
        errorMessage.toLowerCase().includes('disconnect');
      
      if (isFatalError && !userDisconnectedRef.current) {
        console.log('⚠️ Fatal error detected, initiating reconnection...');
        
        // Trigger reconnection by simulating a close event
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          const delay = Math.min(
            baseReconnectDelayMs * Math.pow(2, reconnectAttemptsRef.current),
            maxReconnectDelayMs
          );
          
          reconnectAttemptsRef.current++;
          console.log(`🔄 Auto-recovery attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts} in ${delay}ms...`);
          
          reconnectTimeoutRef.current = setTimeout(async () => {
            try {
              await connect();
              console.log('✅ Auto-recovery successful');
              
              useLogStore.getState().addTurn({
                role: 'system',
                text: '✅ Connection recovered!',
                isFinal: true,
              });
            } catch (err) {
              console.error('❌ Auto-recovery failed:', err);
            }
          }, delay);
        }
      } else if (!isFatalError) {
        // Non-fatal error - just log and continue
        console.log('ℹ️ Non-fatal error, continuing stream...');
      }
    };

    const stopAudioStreamer = () => {
      if (audioStreamerRef.current) {
        console.warn('⏸️ Audio streamer stopped due to interruption');
        try {
          audioStreamerRef.current.stop();
        } catch (error) {
          console.error('Error stopping audio streamer:', error);
        }
      }
    };

    const onAudio = (data: ArrayBuffer) => {
      try {
        if (audioStreamerRef.current) {
          audioStreamerRef.current.addPCM16(new Uint8Array(data));
        }
      } catch (error) {
        console.error('Error processing audio data:', error);
        // Don't crash - continue stream
      }
    };

    client.on('open', onOpen);
    client.on('close', onClose);
    client.on('error', onError);
    client.on('interrupted', stopAudioStreamer);
    client.on('audio', onAudio);

    const onToolCall = async (toolCall: LiveServerToolCall) => {
      console.log('🧰 Toolcall received:', toolCall.functionCalls.map(fc => fc.name));

      if (!dispatcherInitialized) {
        console.warn('⚠️ Tool call before dispatcher ready.');
        try {
          client.sendToolResponse({
            functionResponses: toolCall.functionCalls.map(fc => ({
              id: fc.id,
              name: fc.name,
              response: {
                result: null,
                error: 'Tooling not ready',
              },
            })),
          });
        } catch (error) {
          console.error('Error sending tool response:', error);
        }
        return;
      }

      // Stop audio temporarily for tool execution
      if (audioStreamerRef.current) {
        try {
          audioStreamerRef.current.stop();
        } catch (error) {
          console.error('Error stopping audio for tool call:', error);
        }
      }

      try {
        const functionResponses = await Promise.all(
          toolCall.functionCalls.map(async fc => {
            try {
              // Debug logging removed - only log to console for development
              console.log(`🔧 Executing function: ${fc.name}`, fc.args);

              const [response] = await functionDispatcher.dispatchFunctions([
                {
                  id: fc.id,
                  name: fc.name,
                  args: fc.args,
                },
              ]);

              console.log(`✅ Function ${fc.name} completed`);

              return response;
            } catch (error) {
              console.error(`Error executing tool ${fc.name}:`, error);
              return {
                id: fc.id,
                name: fc.name,
                response: {
                  result: null,
                  error: error instanceof Error ? error.message : 'Tool execution failed',
                },
              };
            }
          }),
        );

        client.sendToolResponse({ functionResponses });

        // Show RAG lookup complete message to user
        useLogStore.getState().addTurn({
          role: 'system',
          text: `✅ RAG lookup complete for **${toolCall.functionCalls.map(fc => fc.name).join(', ')}**`,
          isFinal: true,
        });
      } catch (error) {
        console.error('💥 Error during tool call execution:', error);
        try {
          client.sendToolResponse({
            functionResponses: toolCall.functionCalls.map(fc => ({
              id: fc.id,
              name: fc.name,
              response: {
                result: null,
                error: error instanceof Error ? error.message : 'Unknown error',
              },
            })),
          });
        } catch (sendError) {
          console.error('Error sending error response:', sendError);
        }
      } finally {
        // Always resume audio, even if there was an error
        if (audioStreamerRef.current && !userDisconnectedRef.current) {
          try {
            console.log('▶️ Resuming audio streamer after tool call');
            await audioStreamerRef.current.resume();
          } catch (error) {
            console.error('Error resuming audio streamer:', error);
          }
        }
      }
    };

    client.on('toolcall', onToolCall);

    return () => {
      client.off('open', onOpen);
      client.off('close', onClose);
      client.off('error', onError);
      client.off('interrupted', stopAudioStreamer);
      client.off('audio', onAudio);
      client.off('toolcall', onToolCall);
    };
  }, [client, dispatcherInitialized]);

  // Cleanup effect for timeouts
  useEffect(() => {
    return () => {
      // Clear any pending reconnect timeout when component unmounts
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };
  }, []);

  const connect = useCallback(async () => {
    if (!config) {
      throw new Error('config has not been set');
    }
    
    // Check circuit breaker
    if (consecutiveFailuresRef.current >= maxConsecutiveFailures) {
      const errorMsg = `⚠️ Too many connection failures (${consecutiveFailuresRef.current}). Cooling down for ${circuitBreakerResetTimeMs / 1000}s...`;
      console.error(errorMsg);
      
      useLogStore.getState().addTurn({
        role: 'system',
        text: errorMsg,
        isFinal: true,
      });
      
      // Reset circuit breaker after cooldown period
      setTimeout(() => {
        console.log('🔄 Circuit breaker reset, connection attempts allowed again');
        consecutiveFailuresRef.current = 0;
      }, circuitBreakerResetTimeMs);
      
      throw new Error('Circuit breaker open - too many consecutive failures');
    }

    if (!dispatcherInitialized) {
      console.log('⏳ Waiting for dispatcher to initialize...');
      await new Promise<void>(resolve => {
        const interval = setInterval(() => {
          if (dispatcherInitialized) {
            clearInterval(interval);
            resolve();
          }
        }, 150);
      });
    }

    userDisconnectedRef.current = false; // User is connecting

    try {
      const anyClient = client as any;
      if (anyClient.connected) {
        console.warn('⚠️ Live already connected — disconnecting first');
        await client.disconnect();
        await new Promise(res => setTimeout(res, 300));
      }

      console.log('🎙️ Connecting to Gemini Live…');
      await client.connect(config);
      
      // Reset consecutive failures on successful connection
      consecutiveFailuresRef.current = 0;
    } catch (error) {
      // Track consecutive failures
      consecutiveFailuresRef.current++;
      console.error(`❌ Connection failed (${consecutiveFailuresRef.current}/${maxConsecutiveFailures}):`, error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      useLogStore.getState().addTurn({
        role: 'system',
        text: `⚠️ Connection failed: ${errorMessage}`,
        isFinal: true,
      });
      
      throw error;
    }
  }, [client, config, dispatcherInitialized]);

  const disconnect = useCallback(async () => {
    userDisconnectedRef.current = true; // User manually disconnected
    reconnectAttemptsRef.current = maxReconnectAttempts; // Prevent auto-reconnect
    
    // Clear any pending reconnect timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    try {
      await client.disconnect();
      setConnected(false);
      if (audioStreamerRef.current) {
        try {
          audioStreamerRef.current.stop();
        } catch (error) {
          console.error('Error stopping audio streamer on disconnect:', error);
        }
      }
      console.log('👋 Disconnected by user');
    } catch (error) {
      console.error('❌ Error during disconnect:', error);
      setConnected(false);
    }
  }, [client]);

  return {
    client,
    config,
    setConfig,
    connect,
    disconnect,
    connected,
    volume,
  };
}
