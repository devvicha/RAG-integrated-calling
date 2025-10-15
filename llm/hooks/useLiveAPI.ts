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
    const initializeDispatcher = async () => {
      if (!dispatcherInitialized) {
        try {
          await functionDispatcher.initialize(knowledgeDocuments);
          setDispatcherInitialized(true);
          console.log('✅ Function dispatcher initialized with knowledge base');
        } catch (error) {
          console.error('❌ Failed to initialize function dispatcher:', error);
        }
      }
    };
    
    initializeDispatcher();
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
    };

    const onClose = () => {
      setConnected(false);
    };

    const stopAudioStreamer = () => {
      if (audioStreamerRef.current) {
        console.warn('Audio streamer stopped due to interruption');
        audioStreamerRef.current.stop();
      }
    };

    const onAudio = (data: ArrayBuffer) => {
      if (audioStreamerRef.current) {
        console.log('Audio data received:', data.byteLength);
        audioStreamerRef.current.addPCM16(new Uint8Array(data));
      }
    };

    client.on('interrupted', () => {
      console.error('Streaming interrupted event received');
      stopAudioStreamer();
    });

    // Bind event listeners
    client.on('open', onOpen);
    client.on('close', onClose);
    client.on('interrupted', stopAudioStreamer);
    client.on('audio', onAudio);

    const onToolCall = async (toolCall: LiveServerToolCall) => {
      if (!dispatcherInitialized) {
        console.warn('Tool call received before dispatcher ready.');
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

      const functionResponses = await Promise.all(
        toolCall.functionCalls.map(async fc => {
          const triggerMessage = `Triggering function call: **${fc.name}**\n\`\`\`json\n${JSON.stringify(fc.args, null, 2)}\n\`\`\``;
          useLogStore.getState().addTurn({
            role: 'system',
            text: triggerMessage,
            isFinal: true,
          });

          try {
            const [response] = await functionDispatcher.dispatchFunctions([{
              id: fc.id,
              name: fc.name,
              args: fc.args,
            }]);

            const responseMessage = `Function call response:\n\`\`\`json\n${JSON.stringify(response, null, 2)}\n\`\`\``;
            useLogStore.getState().addTurn({
              role: 'system',
              text: responseMessage,
              isFinal: true,
            });

            return response;
          } catch (error: any) {
            const errorMessage = `Function execution failed for **${fc.name}**: ${error?.message || error}`;
            console.error(errorMessage);
            useLogStore.getState().addTurn({
              role: 'system',
              text: errorMessage,
              isFinal: true,
            });

            return {
              id: fc.id,
              name: fc.name,
              response: {
                result: null,
                error: error instanceof Error ? error.message : 'Unknown error',
              },
            };
          }
        }),
      );

      client.sendToolResponse({ functionResponses });
    };

    client.on('toolcall', onToolCall);

    return () => {
      // Clean up event listeners
      client.off('open', onOpen);
      client.off('close', onClose);
      client.off('interrupted', stopAudioStreamer);
      client.off('audio', onAudio);
      client.off('toolcall', onToolCall);
    };
  }, [client]);

  const connect = useCallback(async () => {
    if (!config) {
      throw new Error('config has not been set');
    }
    client.disconnect();
    await client.connect(config);
  }, [client, config]);

  const disconnect = useCallback(async () => {
    client.disconnect();
    setConnected(false);
  }, [setConnected, client]);

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
