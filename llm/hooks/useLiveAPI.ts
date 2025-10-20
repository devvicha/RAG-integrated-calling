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
      console.log('🔌 Live connection OPEN');
    };

    const onClose = () => {
      setConnected(false);
      console.log('🔌 Live connection CLOSE');
    };

    const stopAudioStreamer = () => {
      if (audioStreamerRef.current) {
        console.warn('⏸️ Audio streamer stopped due to interruption');
        audioStreamerRef.current.stop();
      }
    };

    const onAudio = (data: ArrayBuffer) => {
      if (audioStreamerRef.current) {
        audioStreamerRef.current.addPCM16(new Uint8Array(data));
      }
    };

    client.on('open', onOpen);
    client.on('close', onClose);
    client.on('interrupted', stopAudioStreamer);
    client.on('audio', onAudio);

    const onToolCall = async (toolCall: LiveServerToolCall) => {
      console.log('🧰 Toolcall received:', toolCall.functionCalls.map(fc => fc.name));

      if (!dispatcherInitialized) {
        console.warn('⚠️ Tool call before dispatcher ready.');
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
        return;
      }

      if (audioStreamerRef.current) {
        audioStreamerRef.current.stop();
      }

      try {
        const functionResponses = await Promise.all(
          toolCall.functionCalls.map(async fc => {
            const triggerMessage = `Triggering function call: **${fc.name}**\n\`\`\`json\n${JSON.stringify(fc.args, null, 2)}\n\`\`\``;
            useLogStore.getState().addTurn({
              role: 'system',
              text: triggerMessage,
              isFinal: true,
            });

            const [response] = await functionDispatcher.dispatchFunctions([
              {
                id: fc.id,
                name: fc.name,
                args: fc.args,
              },
            ]);

            const responseMessage = `Function call response:\n\`\`\`json\n${JSON.stringify(response, null, 2)}\n\`\`\``;
            useLogStore.getState().addTurn({
              role: 'system',
              text: responseMessage,
              isFinal: true,
            });

            return response;
          }),
        );

        client.sendToolResponse({ functionResponses });

        useLogStore.getState().addTurn({
          role: 'system',
          text: `✅ RAG lookup complete for **${toolCall.functionCalls
            .map(fc => fc.name)
            .join(', ')}**`,
          isFinal: true,
        });
      } catch (error) {
        console.error('💥 Error during tool call execution:', error);
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
      } finally {
        if (audioStreamerRef.current) {
          console.log('▶️ Resuming audio streamer after tool call');
          await audioStreamerRef.current.resume();
        }
      }
    };

    client.on('toolcall', onToolCall);

    return () => {
      client.off('open', onOpen);
      client.off('close', onClose);
      client.off('interrupted', stopAudioStreamer);
      client.off('audio', onAudio);
      client.off('toolcall', onToolCall);
    };
  }, [client, dispatcherInitialized]);

  const connect = useCallback(async () => {
    if (!config) {
      throw new Error('config has not been set');
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

    const anyClient = client as any;
    if (anyClient.connected) {
      console.warn('⚠️ Live already connected — disconnecting first');
      await client.disconnect();
      await new Promise(res => setTimeout(res, 300));
    }

    console.log('🎙️ Connecting to Gemini Live…');
    await client.connect(config);
  }, [client, config, dispatcherInitialized]);

  const disconnect = useCallback(async () => {
    await client.disconnect();
    setConnected(false);
    if (audioStreamerRef.current) {
      audioStreamerRef.current.stop();
    }
  }, [client]);

  return {
    client,
    config,
    setConfig,
    connect,
    connected,
    disconnect,
    volume,
  };
}
