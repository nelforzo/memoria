<script>
  import { onDestroy } from 'svelte';
  import { createEventDispatcher } from 'svelte';
  import { AudioRecorder as Recorder, formatDuration, createAudioURL, isAudioRecordingSupported } from '../../utils/audioRecording.js';

  export let audioBlob = null;
  export let disabled = false;

  const dispatch = createEventDispatcher();

  let recorder = null;
  let isRecording = false;
  let recordingDuration = 0;
  let durationInterval = null;
  let audioUrl = null;
  let error = null;
  let audioElement;
  let isPlaying = false;

  const supported = isAudioRecordingSupported();

  // Create audio URL when audioBlob changes
  $: if (audioBlob) {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    audioUrl = createAudioURL(audioBlob);
  }

  onDestroy(() => {
    stopRecording();
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
  });

  async function startRecording() {
    error = null;

    if (!supported) {
      error = 'Audio recording is not supported in this browser';
      return;
    }

    try {
      recorder = new Recorder();
      await recorder.start();

      isRecording = true;
      recordingDuration = 0;

      // Update duration every 100ms
      durationInterval = setInterval(() => {
        if (recorder) {
          recordingDuration = recorder.getDuration();
        }
      }, 100);
    } catch (err) {
      console.error('Failed to start recording:', err);

      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        error = 'Microphone permission denied. Please allow microphone access and try again.';
      } else if (err.name === 'NotFoundError') {
        error = 'No microphone found. Please connect a microphone and try again.';
      } else {
        error = 'Failed to start recording. Please try again.';
      }

      isRecording = false;
      if (recorder) {
        recorder.cleanup();
        recorder = null;
      }
    }
  }

  async function stopRecording() {
    if (!recorder) return;

    try {
      const blob = await recorder.stop();

      // Clear interval
      if (durationInterval) {
        clearInterval(durationInterval);
        durationInterval = null;
      }

      isRecording = false;

      // Dispatch change event with audio blob
      dispatch('change', blob);
    } catch (err) {
      console.error('Failed to stop recording:', err);
      error = 'Failed to save recording. Please try again.';
      isRecording = false;
    }

    recorder = null;
  }

  function handleRemove() {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      audioUrl = null;
    }
    dispatch('change', null);
    error = null;
    isPlaying = false;
  }

  function togglePlayback() {
    if (!audioElement) return;

    if (isPlaying) {
      audioElement.pause();
    } else {
      audioElement.play();
    }
  }

  function handleAudioPlay() {
    isPlaying = true;
  }

  function handleAudioPause() {
    isPlaying = false;
  }

  function handleAudioEnded() {
    isPlaying = false;
  }
</script>

<div class="space-y-3">
  {#if !supported}
    <!-- Not Supported Message -->
    <div class="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-sm">
      <p class="font-medium mb-1">Audio recording not supported</p>
      <p>Your browser doesn't support audio recording. Please use a modern browser like Chrome, Firefox, or Safari.</p>
    </div>
  {:else if audioUrl}
    <!-- Audio Player (Preview) -->
    <div class="p-4 bg-gray-50 rounded-lg border border-gray-300">
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center text-sm text-gray-700">
          <svg class="w-5 h-5 text-purple-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clip-rule="evenodd"/>
          </svg>
          <span class="font-medium">Audio recorded</span>
        </div>

        <!-- Remove Button -->
        <button
          type="button"
          on:click={handleRemove}
          disabled={disabled}
          class="text-red-600 hover:text-red-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Remove
        </button>
      </div>

      <!-- Audio Element -->
      <audio
        bind:this={audioElement}
        src={audioUrl}
        on:play={handleAudioPlay}
        on:pause={handleAudioPause}
        on:ended={handleAudioEnded}
        class="hidden"
      ></audio>

      <!-- Custom Controls -->
      <div class="flex items-center gap-3">
        <button
          type="button"
          on:click={togglePlayback}
          disabled={disabled}
          class="flex-shrink-0 w-10 h-10 bg-purple-600 hover:bg-purple-700 text-white rounded-full flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {#if isPlaying}
            <!-- Pause Icon -->
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd"/>
            </svg>
          {:else}
            <!-- Play Icon -->
            <svg class="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd"/>
            </svg>
          {/if}
        </button>

        <div class="flex-1 text-sm text-gray-600">
          <p>Click play to preview your recording</p>
        </div>
      </div>
    </div>
  {:else if isRecording}
    <!-- Recording In Progress -->
    <div class="p-6 bg-red-50 border-2 border-red-300 rounded-lg">
      <div class="flex flex-col items-center">
        <!-- Recording Animation -->
        <div class="relative mb-4">
          <div class="w-16 h-16 bg-red-600 rounded-full animate-pulse flex items-center justify-center">
            <svg class="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clip-rule="evenodd"/>
            </svg>
          </div>
        </div>

        <!-- Duration Timer -->
        <div class="text-3xl font-bold text-red-900 mb-2 font-mono">
          {formatDuration(recordingDuration)}
        </div>

        <p class="text-sm text-red-700 mb-4">Recording...</p>

        <!-- Stop Button -->
        <button
          type="button"
          on:click={stopRecording}
          class="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
        >
          Stop Recording
        </button>
      </div>
    </div>
  {:else}
    <!-- Record Button -->
    <button
      type="button"
      on:click={startRecording}
      disabled={disabled}
      class="w-full flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <svg class="w-12 h-12 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/>
      </svg>
      <p class="text-sm font-medium text-gray-700 mb-1">Record audio</p>
      <p class="text-xs text-gray-500">Click to start recording</p>
    </button>
  {/if}

  <!-- Error Message -->
  {#if error}
    <div class="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-start">
      <svg class="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
      </svg>
      <span>{error}</span>
    </div>
  {/if}
</div>
