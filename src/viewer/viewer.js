const stage = document.querySelector('#stage');
const message = document.querySelector('#message');
const closeButton = document.querySelector('#closeButton');
const params = new URLSearchParams(window.location.search);
const viewerId = params.get('id');
let mediaConfig = {};
let currentMediaElement = null;
let currentLocale = (window.appI18n && window.appI18n.resolveLanguage('system', navigator.language)) || 'zh-CN';
let detachCloseButtonListener = null;
let isClosing = false;
let audioNormalizer = null;

function clampAudioValue(value, min, max, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(min, Math.min(max, number)) : fallback;
}

function stopAudioNormalization() {
  if (!audioNormalizer) {
    return;
  }

  if (audioNormalizer.timer) {
    window.clearInterval(audioNormalizer.timer);
  }
  try {
    audioNormalizer.source.disconnect();
    audioNormalizer.analyser.disconnect();
    audioNormalizer.gain.disconnect();
    audioNormalizer.context.close();
  } catch (_error) {
    // Audio resources may already be released while the window is closing.
  }
  audioNormalizer = null;
}

function startAudioNormalization(video, config) {
  stopAudioNormalization();
  if (!video || video.muted || !config.videoVolumeNormalizationEnabled) {
    return;
  }

  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) {
    return;
  }

  try {
    const context = new AudioContextClass();
    const source = context.createMediaElementSource(video);
    const analyser = context.createAnalyser();
    const gain = context.createGain();
    const data = new Float32Array(analyser.fftSize);
    const targetVolume = clampAudioValue(config.videoVolumeNormalizationTarget, 0.1, 1, 0.7);

    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.65;
    source.connect(analyser);
    analyser.connect(gain);
    gain.connect(context.destination);
    gain.gain.value = 1;

    audioNormalizer = { context, source, analyser, gain, data, targetVolume, userVolume: video.volume, timer: null };
    audioNormalizer.timer = window.setInterval(() => {
      if (!audioNormalizer || video.paused || video.readyState < 2) {
        return;
      }

      analyser.getFloatTimeDomainData(data);
      let sumSquares = 0;
      for (let index = 0; index < data.length; index += 1) {
        sumSquares += data[index] * data[index];
      }
      const rms = Math.sqrt(sumSquares / data.length);
      if (rms < 0.008) {
        gain.gain.setTargetAtTime(1, context.currentTime, 0.2);
        return;
      }

      const referenceRms = 0.12 * (targetVolume / 0.7) * audioNormalizer.userVolume;
      const desiredGain = clampAudioValue(referenceRms / rms, 0.35, 3, 1);
      gain.gain.setTargetAtTime(desiredGain, context.currentTime, 0.18);
    }, 120);

    video.addEventListener('play', () => {
      if (audioNormalizer && context.state === 'suspended') {
        context.resume().catch(() => {});
      }
    });
  } catch (_error) {
    stopAudioNormalization();
  }
}

const { resolveLanguage, translate } = window.appI18n || {
  resolveLanguage: (value, fallback) => value || fallback || 'zh-CN',
  translate: (_locale, key) => key
};

function t(key, params) {
  return translate(currentLocale, key, params);
}

function applyLanguage(locale) {
  currentLocale = resolveLanguage(locale, navigator.language);
  document.documentElement.lang = currentLocale;
  document.title = t('app.title');
  applyCloseButtonAppearance();

  if (message.isConnected) {
    message.textContent = t('viewer.loading');
  }
}

function syncCloseButtonVisibility() {
  const hideCloseButton = Boolean(mediaConfig.clickToClose) || Boolean(mediaConfig.disableManualClose);
  closeButton.hidden = hideCloseButton;
}

function randomizeCloseButton() {
  const buttonRect = closeButton.getBoundingClientRect();
  const buttonWidth = Math.max(64, Math.ceil(buttonRect.width));
  const buttonHeight = Math.max(32, Math.ceil(buttonRect.height));
  const safeOffsetX = Number(mediaConfig.closeButtonOffsetX) || 10;
  const safeOffsetY = Number(mediaConfig.closeButtonOffsetY) || 10;
  const leftRange = Math.max(0, window.innerWidth - buttonWidth - (safeOffsetX * 2));
  const topRange = Math.max(0, window.innerHeight - buttonHeight - (safeOffsetY * 2));
  closeButton.style.left = `${safeOffsetX + Math.floor(Math.random() * (leftRange + 1))}px`;
  closeButton.style.top = `${safeOffsetY + Math.floor(Math.random() * (topRange + 1))}px`;
  closeButton.style.right = 'auto';
}

function showMessage(text) {
  stopAudioNormalization();
  stage.replaceChildren(message);
  message.textContent = text;
  currentMediaElement = null;
}

function closeViewer(useFade = false) {
  if (isClosing) {
    return;
  }

  if (!useFade) {
    window.viewerPopup.close();
    return;
  }

  isClosing = true;
  document.body.classList.add('is-closing');
  window.setTimeout(() => {
    window.viewerPopup.close();
  }, 1200);
}

async function fitWindowToMedia(mediaWidth, mediaHeight) {
  if (!window.viewerPopup || !window.viewerPopup.fitWindow) {
    return;
  }

  try {
    await window.viewerPopup.fitWindow(mediaWidth, mediaHeight);
  } catch (_error) {
    // Ignore window fit failures and keep normal rendering.
  }
}

function applyScaledFit(element, mediaWidth, mediaHeight) {
  if (!element || !mediaWidth || !mediaHeight) {
    return;
  }

  const stageWidth = Math.max(1, stage.clientWidth);
  const stageHeight = Math.max(1, stage.clientHeight);
  const scale = Math.min(stageWidth / mediaWidth, stageHeight / mediaHeight);
  const clampedScale = Number.isFinite(scale) && scale > 0 ? scale : 1;
  element.style.width = `${Math.max(1, Math.floor(mediaWidth * clampedScale))}px`;
  element.style.height = `${Math.max(1, Math.floor(mediaHeight * clampedScale))}px`;
}

function refreshCurrentMediaFit() {
  if (!currentMediaElement) {
    return;
  }

  if (currentMediaElement.tagName === 'VIDEO') {
    applyScaledFit(currentMediaElement, currentMediaElement.videoWidth, currentMediaElement.videoHeight);
    return;
  }

  applyScaledFit(currentMediaElement, currentMediaElement.naturalWidth, currentMediaElement.naturalHeight);
}

function renderMedia(media) {
  if (!media) {
    showMessage(t('viewer.mediaMissing'));
    return;
  }

  const element = document.createElement(media.type === 'video' ? 'video' : 'img');
  element.className = 'media-element';
  element.src = media.url;
  element.title = media.name;

  if (media.type === 'video') {
    element.autoplay = true;
    element.loop = !Boolean(media.closeVideoOnEnded) && !Boolean(media.chaosVideo);
    element.controls = true;
    element.muted = Boolean(media.muted);
    element.playsInline = true;
    element.addEventListener('loadedmetadata', async () => {
      await fitWindowToMedia(element.videoWidth, element.videoHeight);
      refreshCurrentMediaFit();

      startAudioNormalization(element, media);

      if (window.viewerPopup && window.viewerPopup.mediaLoaded) {
        window.viewerPopup.mediaLoaded();
      }

      if (media.chaosVideo && element.duration > 0) {
        const safeDuration = Math.max(0, element.duration - 5);
        if (safeDuration > 0) {
          element.currentTime = Math.random() * safeDuration;
        }
      }
    });
    if (media.closeVideoOnEnded || media.chaosVideo) {
      element.addEventListener('ended', () => closeViewer(true));
    }
  } else {
    element.draggable = false;
    element.addEventListener('load', async () => {
      await fitWindowToMedia(element.naturalWidth, element.naturalHeight);
      refreshCurrentMediaFit();
      if (window.viewerPopup && window.viewerPopup.mediaLoaded) {
        window.viewerPopup.mediaLoaded();
      }
    });
  }

  element.addEventListener('error', () => {
    showMessage(t('viewer.loadFailed'));
    if (window.viewerPopup && window.viewerPopup.mediaLoaded) {
      window.viewerPopup.mediaLoaded();
    }
  });
  currentMediaElement = element;
  stage.replaceChildren(element);
}

closeButton.addEventListener('click', () => closeViewer(false));

document.body.addEventListener('contextmenu', (event) => {
  if (mediaConfig && mediaConfig.developerMode && mediaConfig.path) {
    event.preventDefault();
    if (window.viewerPopup && window.viewerPopup.showInFolder) {
      window.viewerPopup.showInFolder(mediaConfig.path);
    }
  }
});

window.addEventListener('resize', () => {
  if (!mediaConfig.clickToClose && mediaConfig.randomCloseButton) {
    randomizeCloseButton();
  }
  refreshCurrentMediaFit();
});

window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !mediaConfig.disableManualClose) {
    closeViewer(false);
  }
});

applyLanguage('system');

if (window.viewerPopup?.onCloseButtonTextUpdate) {
  detachCloseButtonListener = window.viewerPopup.onCloseButtonTextUpdate((payload) => {
    if (!payload || typeof payload.text !== 'string') {
      return;
    }

    mediaConfig = {
      ...mediaConfig,
      closeButtonText: payload.text
    };
    applyCloseButtonAppearance();
  });
}

let detachOpacityListener = null;
if (window.viewerPopup?.onOpacityUpdate) {
  detachOpacityListener = window.viewerPopup.onOpacityUpdate((opacity) => {
    if (currentMediaElement && currentMediaElement.tagName === 'VIDEO' && !mediaConfig.muted) {
      const userVolume = Math.max(0, Math.min(1, opacity));
      currentMediaElement.volume = userVolume;
      if (audioNormalizer) {
        audioNormalizer.userVolume = userVolume;
      }
    }
  });
}

window.viewerPopup.getMedia(viewerId).then((media) => {
  mediaConfig = media;
  applyLanguage(media?.language || 'system');
  syncCloseButtonVisibility();
  renderMedia(media);
  if (mediaConfig.clickToClose && !mediaConfig.disableManualClose) {
    document.addEventListener('click', () => closeViewer(false));
  }
  if (!mediaConfig.clickToClose && mediaConfig.randomCloseButton) {
    randomizeCloseButton();
  }
}).catch(() => {
  showMessage(t('viewer.readFailed'));
});

function getCloseButtonLabel() {
  const customText = typeof mediaConfig.closeButtonText === 'string' ? mediaConfig.closeButtonText.trim() : '';
  return customText || t('viewer.close');
}

function applyCloseButtonAppearance() {
  const label = getCloseButtonLabel();
  closeButton.textContent = label;
  closeButton.title = label;
  closeButton.style.setProperty('--close-button-font-size', `${mediaConfig.closeButtonFontSize || 14}px`);
  closeButton.style.setProperty('--close-button-radius', `${mediaConfig.closeButtonBorderRadius || 6}px`);
  closeButton.style.setProperty('--close-button-padding-x', `${mediaConfig.closeButtonPaddingX || 16}px`);
  closeButton.style.setProperty('--close-button-padding-y', `${mediaConfig.closeButtonPaddingY || 8}px`);
  closeButton.style.setProperty('--close-button-offset-x', `${mediaConfig.closeButtonOffsetX || 10}px`);
  closeButton.style.setProperty('--close-button-offset-y', `${mediaConfig.closeButtonOffsetY || 10}px`);
  closeButton.style.setProperty('--close-button-background', mediaConfig.closeButtonBackgroundColor || '#000000');
  closeButton.style.setProperty('--close-button-text-color', mediaConfig.closeButtonTextColor || '#ffffff');
  closeButton.style.setProperty('--close-button-border-color', mediaConfig.closeButtonBorderColor || '#ffffff');
  closeButton.style.setProperty('--close-button-hover-background', mediaConfig.closeButtonHoverBackgroundColor || '#2f3b45');
  closeButton.style.setProperty('--close-button-hover-text-color', mediaConfig.closeButtonHoverTextColor || '#ffffff');
}

window.addEventListener('beforeunload', () => {
  stopAudioNormalization();
  if (typeof detachCloseButtonListener === 'function') {
    detachCloseButtonListener();
  }
  if (typeof detachOpacityListener === 'function') {
    detachOpacityListener();
  }
});