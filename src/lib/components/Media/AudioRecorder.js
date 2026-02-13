/**
 * AudioRecorder — record/playback component.
 */

import { AudioRecorder as Recorder, formatDuration, createAudioURL, isAudioRecordingSupported } from '../../utils/audioRecording.js';

export function createAudioRecorderUI(container, { audioBlob = null, disabled = false, onChange }) {
  const el = document.createElement('div');
  container.appendChild(el);

  const supported = isAudioRecordingSupported();
  let recorder = null;
  let isRecording = false;
  let recordingDuration = 0;
  let durationInterval = null;
  let audioUrl = null;
  let error = null;
  let audioElement = null;
  let isPlaying = false;

  function syncAudioUrl() {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    audioUrl = audioBlob ? createAudioURL(audioBlob) : null;
  }

  syncAudioUrl();

  function render() {
    el.innerHTML = `<div style="display:flex;flex-direction:column;gap:var(--sp-3)"></div>`;
    const wrap = el.firstElementChild;

    if (!supported) {
      wrap.innerHTML = `
        <div class="warning-box">
          <p style="font-weight:500;margin-bottom:var(--sp-1)">音声録音非対応</p>
          <p>お使いのブラウザは音声録音に対応していません。Chrome、Firefox、Safariなどの最新ブラウザをお使いください。</p>
        </div>
      `;
    } else if (audioUrl) {
      // Player preview
      wrap.innerHTML = `
        <div class="audio-preview">
          <div class="audio-preview__header">
            <div class="audio-preview__label">
              <svg fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clip-rule="evenodd"/></svg>
              <span style="font-weight:500">音声録音済み</span>
            </div>
            <button type="button" data-action="remove" style="color:var(--red-600);font-size:var(--text-sm);font-weight:500;cursor:pointer;border:none;background:none" ${disabled ? 'disabled' : ''}>削除</button>
          </div>
          <div class="flex items-center gap-3">
            <button type="button" class="audio-play-btn" data-action="toggle-play" ${disabled ? 'disabled' : ''}>
              ${isPlaying
                ? `<svg fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd"/></svg>`
                : `<svg fill="currentColor" viewBox="0 0 20 20" style="margin-left:2px"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd"/></svg>`}
            </button>
            <div style="flex:1;font-size:var(--text-sm);color:var(--gray-600)">
              <p>再生ボタンをクリックして録音を確認</p>
            </div>
          </div>
        </div>
      `;

      // Create hidden audio element
      audioElement = document.createElement('audio');
      audioElement.src = audioUrl;
      audioElement.addEventListener('play', () => { isPlaying = true; updatePlayBtn(); });
      audioElement.addEventListener('pause', () => { isPlaying = false; updatePlayBtn(); });
      audioElement.addEventListener('ended', () => { isPlaying = false; updatePlayBtn(); });
      wrap.appendChild(audioElement);
    } else if (isRecording) {
      wrap.innerHTML = `
        <div class="recording-state">
          <div class="recording-state__mic">
            <svg fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clip-rule="evenodd"/></svg>
          </div>
          <div class="recording-state__timer">${formatDuration(recordingDuration)}</div>
          <p style="font-size:var(--text-sm);color:var(--red-700);margin-bottom:var(--sp-4)">録音中...</p>
          <button type="button" class="btn btn--danger" data-action="stop-recording">録音を停止</button>
        </div>
      `;
    } else {
      wrap.innerHTML = `
        <button type="button" class="upload-area upload-area--purple" data-action="start-recording" ${disabled ? 'disabled' : ''}>
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/></svg>
          <p style="font-size:var(--text-sm);font-weight:500;color:var(--gray-700);margin-bottom:var(--sp-1)">音声を録音</p>
          <p style="font-size:var(--text-xs);color:var(--gray-500)">クリックして録音を開始</p>
        </button>
      `;
    }

    if (error) {
      wrap.insertAdjacentHTML('beforeend', `
        <div class="error-box">
          <svg fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/></svg>
          <span>${escapeHtml(error)}</span>
        </div>
      `);
    }

    bindEvents();
  }

  function updatePlayBtn() {
    const btn = el.querySelector('[data-action="toggle-play"]');
    if (!btn) return;
    btn.innerHTML = isPlaying
      ? `<svg fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd"/></svg>`
      : `<svg fill="currentColor" viewBox="0 0 20 20" style="margin-left:2px"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd"/></svg>`;
  }

  function bindEvents() {
    el.querySelector('[data-action="start-recording"]')?.addEventListener('click', startRecording);
    el.querySelector('[data-action="stop-recording"]')?.addEventListener('click', stopRecording);
    el.querySelector('[data-action="toggle-play"]')?.addEventListener('click', togglePlayback);
    el.querySelector('[data-action="remove"]')?.addEventListener('click', handleRemove);
  }

  async function startRecording() {
    error = null;
    if (!supported) { error = 'このブラウザでは音声録音がサポートされていません'; render(); return; }

    try {
      recorder = new Recorder();
      await recorder.start();
      isRecording = true;
      recordingDuration = 0;

      durationInterval = setInterval(() => {
        if (recorder) { recordingDuration = recorder.getDuration(); }
        // Update timer only
        const timerEl = el.querySelector('.recording-state__timer');
        if (timerEl) timerEl.textContent = formatDuration(recordingDuration);
      }, 100);

      render();
    } catch (err) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        error = 'マイクへのアクセスが拒否されました。マイクへのアクセスを許可して、もう一度お試しください。';
      } else if (err.name === 'NotFoundError') {
        error = 'マイクが見つかりません。マイクを接続して、もう一度お試しください。';
      } else {
        error = '録音の開始に失敗しました。もう一度お試しください。';
      }
      isRecording = false;
      if (recorder) { recorder.cleanup(); recorder = null; }
      render();
    }
  }

  async function stopRecording() {
    if (!recorder) return;
    try {
      const blob = await recorder.stop();
      clearInterval(durationInterval);
      durationInterval = null;
      isRecording = false;
      audioBlob = blob;
      syncAudioUrl();
      if (onChange) onChange(blob);
      render();
    } catch {
      error = '録音の保存に失敗しました。もう一度お試しください。';
      isRecording = false;
      render();
    }
    recorder = null;
  }

  function togglePlayback() {
    if (!audioElement) return;
    if (isPlaying) audioElement.pause();
    else audioElement.play();
  }

  function handleRemove() {
    if (audioUrl) { URL.revokeObjectURL(audioUrl); audioUrl = null; }
    audioBlob = null;
    error = null;
    isPlaying = false;
    if (onChange) onChange(null);
    render();
  }

  render();

  return {
    destroy() {
      stopRecording();
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      clearInterval(durationInterval);
      el.remove();
    },
    setBlob(blob) {
      audioBlob = blob;
      syncAudioUrl();
      render();
    }
  };
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
