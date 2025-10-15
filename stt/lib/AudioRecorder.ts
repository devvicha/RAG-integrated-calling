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

import { audioContext } from '../../lib/utils';
import AudioRecordingWorklet from './worklets/AudioProcessing';
import VolMeterWorket from './worklets/VolMeter';

import { createWorketFromSrc } from './AudioWorkletRegistry';
import EventEmitter from 'eventemitter3';

function arrayBufferToBase64(buffer: ArrayBuffer) {
  var binary = '';
  var bytes = new Uint8Array(buffer);
  var len = bytes.byteLength;
  for (var i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

export class AudioRecorder {
  private emitter = new EventEmitter();

  public on = this.emitter.on.bind(this.emitter);
  public off = this.emitter.off.bind(this.emitter);

  stream: MediaStream | undefined;
  audioContext: AudioContext | undefined;
  source: MediaStreamAudioSourceNode | undefined;
  recording: boolean = false;
  recordingWorklet: AudioWorkletNode | undefined;
  vuWorklet: AudioWorkletNode | undefined;

  private starting: Promise<void> | null = null;

  constructor(public sampleRate = 16000) {}

  async start() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('Could not request user media');
    }

    this.starting = new Promise(async (resolve, reject) => {
      const devices = await navigator.mediaDevices.enumerateDevices();

      const candidateDevice = devices.find(
        device => device.kind === 'audioinput' && device.deviceId !== 'default'
      );
      const defaultMic = devices.find(
        device => device.kind === 'audioinput' && device.deviceId === 'default'
      );

      const preferredDeviceId = candidateDevice?.deviceId ?? defaultMic?.deviceId;

      const requestStream = async () => {
        if (preferredDeviceId && preferredDeviceId !== 'default') {
          return navigator.mediaDevices.getUserMedia({
            audio: { deviceId: { exact: preferredDeviceId } },
          });
        }
        if (preferredDeviceId === 'default') {
          return navigator.mediaDevices.getUserMedia({
            audio: { deviceId: preferredDeviceId },
          });
        }
        return navigator.mediaDevices.getUserMedia({ audio: true });
      };

      try {
        this.stream = await requestStream();
      } catch (err) {
        // Some browsers reject exact device constraints when permission has not been granted yet.
        this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      }

      const isNativeMediaStream =
        typeof MediaStream !== 'undefined' &&
        this.stream instanceof MediaStream;

      if (!isNativeMediaStream) {
        const rawStream = this.stream as MediaStream | undefined;
        const tracks =
          rawStream && typeof rawStream.getAudioTracks === 'function'
            ? rawStream.getAudioTracks()
            : [];

        if (typeof MediaStream === 'undefined') {
          throw new Error('MediaStream API not available in this environment');
        }

        this.stream = new MediaStream(tracks);
      }

      if (!this.stream?.getAudioTracks().length) {
        throw new Error('No audio tracks available from the selected microphone');
      }

      this.audioContext = await audioContext({ sampleRate: this.sampleRate });
      this.source = this.audioContext.createMediaStreamSource(this.stream);

      const workletName = 'audio-recorder-worklet';
      const src = createWorketFromSrc(workletName, AudioRecordingWorklet);

      await this.audioContext.audioWorklet.addModule(src);
      this.recordingWorklet = new AudioWorkletNode(
        this.audioContext,
        workletName
      );

      this.recordingWorklet.port.onmessage = async (ev: MessageEvent) => {
        // Worklet processes recording floats and messages converted buffer
        const arrayBuffer = ev.data.data.int16arrayBuffer;

        if (arrayBuffer) {
          const arrayBufferString = arrayBufferToBase64(arrayBuffer);
          this.emitter.emit('data', arrayBufferString);
        }
      };
      this.source.connect(this.recordingWorklet);

      // vu meter worklet
      const vuWorkletName = 'vu-meter';
      await this.audioContext.audioWorklet.addModule(
        createWorketFromSrc(vuWorkletName, VolMeterWorket)
      );
      this.vuWorklet = new AudioWorkletNode(this.audioContext, vuWorkletName);
      this.vuWorklet.port.onmessage = (ev: MessageEvent) => {
        this.emitter.emit('volume', ev.data.volume);
      };

      this.source.connect(this.vuWorklet);
      this.recording = true;
      resolve();
      this.starting = null;
    });
  }

  stop() {
    // It is plausible that stop would be called before start completes,
    // such as if the Websocket immediately hangs up
    const handleStop = () => {
      this.source?.disconnect();
      this.stream?.getTracks().forEach(track => track.stop());
      this.stream = undefined;
      this.recordingWorklet = undefined;
      this.vuWorklet = undefined;
    };
    if (this.starting) {
      this.starting.then(handleStop);
      return;
    }
    handleStop();
  }
}
