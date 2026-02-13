/**
 * Audio Recording Utilities
 *
 * Client-side audio recording using MediaRecorder API
 * Records in WebM/Opus format with compression
 */

/**
 * Audio Recorder class
 */
export class AudioRecorder {
  constructor() {
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.stream = null;
    this.startTime = null;
    this.duration = 0;
  }

  /**
   * Start recording audio
   * @returns {Promise<void>}
   */
  async start() {
    try {
      // Request microphone access
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1, // Mono
          sampleRate: 24000, // 24 kHz
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      // Determine supported MIME type
      const mimeType = this.getSupportedMimeType();

      if (!mimeType) {
        throw new Error('No supported audio format found');
      }

      // Create MediaRecorder
      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType: mimeType,
        audioBitsPerSecond: 32000 // 32 kbps
      });

      this.audioChunks = [];

      // Collect audio data
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      // Start recording
      this.mediaRecorder.start();
      this.startTime = Date.now();

      console.log('✅ Recording started:', mimeType);
    } catch (error) {
      console.error('Failed to start recording:', error);
      this.cleanup();
      throw error;
    }
  }

  /**
   * Stop recording and return audio blob
   * @returns {Promise<Blob>}
   */
  async stop() {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
        reject(new Error('No active recording'));
        return;
      }

      this.mediaRecorder.onstop = () => {
        try {
          this.duration = Date.now() - this.startTime;

          // Create blob from chunks
          const mimeType = this.mediaRecorder.mimeType;
          const blob = new Blob(this.audioChunks, { type: mimeType });

          console.log(`✅ Recording stopped: ${(blob.size / 1024).toFixed(1)}KB, ${(this.duration / 1000).toFixed(1)}s`);

          // Cleanup
          this.cleanup();

          resolve(blob);
        } catch (error) {
          reject(error);
        }
      };

      this.mediaRecorder.onerror = (error) => {
        console.error('MediaRecorder error:', error);
        this.cleanup();
        reject(error);
      };

      this.mediaRecorder.stop();
    });
  }

  /**
   * Get the currently supported MIME type
   * @returns {string|null}
   */
  getSupportedMimeType() {
    const types = [
      'audio/mp4',                // Safari (iOS + macOS) — must be first
      'audio/webm;codecs=opus',   // Chrome, Firefox, Edge
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/mpeg'
    ];

    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }

    return null;
  }

  /**
   * Check if recording is in progress
   * @returns {boolean}
   */
  isRecording() {
    return this.mediaRecorder && this.mediaRecorder.state === 'recording';
  }

  /**
   * Get recording duration in milliseconds
   * @returns {number}
   */
  getDuration() {
    if (this.isRecording()) {
      return Date.now() - this.startTime;
    }
    return this.duration;
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    this.mediaRecorder = null;
    this.audioChunks = [];
  }
}

/**
 * Check if browser supports audio recording
 * @returns {boolean}
 */
export function isAudioRecordingSupported() {
  return !!(
    navigator.mediaDevices &&
    navigator.mediaDevices.getUserMedia &&
    typeof MediaRecorder !== 'undefined'
  );
}

/**
 * Request microphone permission
 * @returns {Promise<boolean>}
 */
export async function requestMicrophonePermission() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach(track => track.stop());
    return true;
  } catch (error) {
    console.error('Microphone permission denied:', error);
    return false;
  }
}

/**
 * Format duration to MM:SS
 * @param {number} ms - Duration in milliseconds
 * @returns {string}
 */
export function formatDuration(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

/**
 * Create audio URL from blob
 * @param {Blob} blob - Audio blob
 * @returns {string}
 */
export function createAudioURL(blob) {
  return URL.createObjectURL(blob);
}

/**
 * Revoke audio URL
 * @param {string} url - Audio URL
 */
export function revokeAudioURL(url) {
  URL.revokeObjectURL(url);
}
