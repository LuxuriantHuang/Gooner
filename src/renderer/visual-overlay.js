const { ipcRenderer } = require('electron');
const { calculateWallpaperStyle, normalizeWallpaperPosition } = require('../shared/wallpaper-layout');
const { toMediaUrl, isVideoMedia } = require('../shared/visual-media-url');

const ambientLayer = document.getElementById('ambient-layer');
const xrayLayer = document.getElementById('xray-layer');
const waterfallLayer = document.getElementById('waterfall-layer');
const flashLayer = document.getElementById('flash-layer');

let currentConfig = null;
let waterfallAnimationFrame = null;
let waterfallItems = [];
let ambientInterval = null;
let xrayInterval = null;
let synchronizedGhostUpdate = 0;

// Handle mouse movement for X-ray
window.addEventListener('mousemove', (e) => {
  if (currentConfig && currentConfig.xrayEnabled) {
    const x = e.clientX;
    const y = e.clientY;
    const r = currentConfig.xrayRadius || 200;
    const opacity = currentConfig.xrayOpacity !== undefined ? currentConfig.xrayOpacity / 100 : 0.6;
    
    // X-ray: image inside the circle, transparent outside. 
    // Opacity applied via the mask or the layer itself.
    // If the mask uses 'black', the area is 100% visible according to the mask, 
    // but the layer opacity itself will clamp it.
    const gradient = `radial-gradient(circle at ${x}px ${y}px, black ${r}px, transparent ${r + 50}px)`;
    xrayLayer.style.webkitMaskImage = gradient;
    xrayLayer.style.maskImage = gradient;
    xrayLayer.style.opacity = opacity;
  }
});

function getRandomMedia() {
  if (!currentConfig || !currentConfig.mediaFiles || currentConfig.mediaFiles.length === 0) return null;
  const files = currentConfig.mediaFiles;
  return files[Math.floor(Math.random() * files.length)];
}

function getRandomUnfilteredMedia() {
  if (!currentConfig) return null;
  const files = currentConfig.allMediaFiles && currentConfig.allMediaFiles.length > 0 ? currentConfig.allMediaFiles : currentConfig.mediaFiles;
  if (!files || files.length === 0) return null;
  return files[Math.floor(Math.random() * files.length)];
}

function updateGhost() {
  if (ambientInterval) clearInterval(ambientInterval);
  ambientLayer.style.display = 'none';
  
  if (!currentConfig || !currentConfig.ghostEnabled) return;

  ambientLayer.style.display = 'block';
  ambientLayer.style.opacity = (currentConfig.ghostOpacity || 5) / 100;
  if (currentConfig.ghostSyncWithWallpaper) {
    updateSynchronizedGhost(currentConfig.synchronizedWallpaper).catch(error => {
      console.error('[VisualOverlayRenderer] Failed to apply synchronized wallpaper:', error);
    });
  } else {
    resetGhostLayout();
    const media = getRandomMedia();
    if (media) ambientLayer.style.backgroundImage = toBackgroundImage(media);
    else ambientLayer.style.backgroundImage = 'none';
  }
  
  // Change ghost image based on interval
  const updateGhostInterval = () => {
    if (ambientInterval) clearInterval(ambientInterval);
    const mins = currentConfig.ghostIntervalMinutes ?? 5;
    const secs = currentConfig.ghostIntervalSeconds ?? 0;
    let ms = (mins * 60 + secs) * 1000;
    if (ms < 1000) ms = 1000; // minimum 1 second
    
    ambientInterval = setInterval(() => {
      const newMedia = getRandomMedia();
      if (newMedia) ambientLayer.style.backgroundImage = toBackgroundImage(newMedia);
    }, ms);
  };
  
  if (!currentConfig.ghostSyncWithWallpaper) {
    updateGhostInterval();
  }
}

async function updateSynchronizedGhost(sync) {
  if (!currentConfig || !currentConfig.ghostEnabled || !currentConfig.ghostSyncWithWallpaper) return;
  const updateId = ++synchronizedGhostUpdate;
  if (!sync || !sync.media) {
    ambientLayer.style.backgroundImage = 'none';
    return;
  }

  console.info('[VisualOverlayRenderer] Applying synchronized ghost media:', sync.media, sync.position);
  const position = normalizeWallpaperPosition(sync.position);
  let imageSize = null;
  if (position === 'center' || position === 'tile' || position === 'span') {
    imageSize = await loadImageSize(sync.media);
    if (updateId !== synchronizedGhostUpdate) return;
  }
  const style = calculateWallpaperStyle({
    position,
    imageWidth: imageSize?.width,
    imageHeight: imageSize?.height,
    monitorBounds: sync.monitorBounds,
    virtualBounds: sync.virtualBounds,
    scaleFactor: sync.scaleFactor || window.devicePixelRatio
  });
  Object.assign(ambientLayer.style, style);
  ambientLayer.style.backgroundImage = toBackgroundImage(sync.media);
}

function resetGhostLayout() {
  synchronizedGhostUpdate += 1;
  ambientLayer.style.backgroundPosition = 'center center';
  ambientLayer.style.backgroundRepeat = 'no-repeat';
  ambientLayer.style.backgroundSize = 'cover';
}

function toBackgroundImage(media) {
  return `url('${toMediaUrl(media)}')`;
}

function loadImageSize(media) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
    image.onerror = () => reject(new Error(`Unable to load synchronized wallpaper: ${media}`));
    image.src = toMediaUrl(media);
  });
}

function updateXray() {
  if (xrayInterval) clearInterval(xrayInterval);
  xrayLayer.style.display = 'none';
  xrayLayer.style.webkitMaskImage = 'none';
  xrayLayer.style.maskImage = 'none';
  
  if (!currentConfig || !currentConfig.xrayEnabled) return;

  xrayLayer.style.display = 'block';
  const opacity = currentConfig.xrayOpacity !== undefined ? currentConfig.xrayOpacity / 100 : 0.6;
  xrayLayer.style.opacity = opacity;
  
  // Initialize mask offscreen or centered before first mousemove
  const r = currentConfig.xrayRadius || 200;
  const gradient = `radial-gradient(circle at -1000px -1000px, black ${r}px, transparent ${r + 50}px)`;
  xrayLayer.style.webkitMaskImage = gradient;
  xrayLayer.style.maskImage = gradient;
  
  const media = getRandomMedia();
  if (media) xrayLayer.style.backgroundImage = toBackgroundImage(media);
  
  xrayInterval = setInterval(() => {
    const newMedia = getRandomMedia();
    if (newMedia) xrayLayer.style.backgroundImage = toBackgroundImage(newMedia);
  }, 5 * 60 * 1000);
}

function updateWaterfall() {
  if (waterfallAnimationFrame) cancelAnimationFrame(waterfallAnimationFrame);
  waterfallLayer.innerHTML = '';
  waterfallItems = [];
  
  if (!currentConfig || !currentConfig.waterfallEnabled) {
    waterfallLayer.style.display = 'none';
    return;
  }
  
  waterfallLayer.style.display = 'block';
  
  // Create waterfall items
  const count = currentConfig.waterfallCount || 15;
  for (let i = 0; i < count; i++) {
    spawnWaterfallItem(true);
  }
  
  let lastTime = performance.now();
  
  function animate(time) {
    const dt = (time - lastTime) / 1000;
    lastTime = time;
    
    const speedMultiplier = (currentConfig.waterfallSpeed || 50) * 2;
    
    waterfallItems.forEach((item, index) => {
      item.y += speedMultiplier * item.speedScale * dt;
      if (item.y > window.innerHeight) {
        item.el.remove();
        waterfallItems.splice(index, 1);
        spawnWaterfallItem(false);
      } else {
        item.el.style.transform = `translate3d(${item.x}px, ${item.y}px, 0) rotate(${item.rotation}deg)`;
      }
    });
    
    waterfallAnimationFrame = requestAnimationFrame(animate);
  }
  
  waterfallAnimationFrame = requestAnimationFrame(animate);
}

function spawnWaterfallItem(initial = false) {
  if (!currentConfig) return;
  const media = getRandomUnfilteredMedia();
  if (!media) return;
  
  const isVideo = isVideoMedia(media);
  
  const el = document.createElement(isVideo ? 'video' : 'img');
  el.className = 'waterfall-item';
  
  const baseSize = currentConfig.waterfallSize || 150;
  const size = baseSize + Math.random() * (baseSize * 2);
  el.style.width = `${size}px`;
  el.style.height = 'auto';
  
  if (isVideo) {
    el.src = toMediaUrl(media);
    el.autoplay = true;
    el.loop = true;
    el.muted = true;
    // Hide controls
    el.controls = false;
  } else {
    el.src = toMediaUrl(media);
  }
  
  const baseOpacity = currentConfig.waterfallOpacity !== undefined ? currentConfig.waterfallOpacity / 100 : 0.6;
  el.style.opacity = (baseOpacity * 0.5) + Math.random() * (baseOpacity * 0.8);
  
  const x = Math.random() * (window.innerWidth - size);
  
  // To create a continuous, staggered stream of images:
  // Initial spawn: distribute them wildly from high above the screen down to the bottom
  // Respawn: place them just above the screen with some random offset to maintain stagger
  const y = initial 
    ? (Math.random() * window.innerHeight * 3) - (window.innerHeight * 2)
    : -size - (Math.random() * window.innerHeight * 1.5);
  
  const item = {
    el,
    x,
    y,
    speedScale: 0.5 + Math.random(),
    rotation: (Math.random() - 0.5) * 45
  };
  
  waterfallLayer.appendChild(el);
  waterfallItems.push(item);
}

ipcRenderer.on('visual:update-config', (event, config) => {
  currentConfig = config;
  updateGhost();
  updateXray();
  updateWaterfall();
});

ipcRenderer.on('visual:wallpaper-sync', (event, sync) => {
  if (currentConfig) currentConfig.synchronizedWallpaper = sync;
  updateSynchronizedGhost(sync).catch(error => {
    console.error('[VisualOverlayRenderer] Failed to apply synchronized wallpaper:', error);
  });
});

ipcRenderer.on('visual:trigger-flash', (event, explicitlyProvidedMedia) => {
  if (flashLayer.style.display === 'block') return;
  
  const media = explicitlyProvidedMedia || getRandomMedia();
  if (!media) return;
  
  const isVideo = isVideoMedia(media);
  const el = document.createElement(isVideo ? 'video' : 'img');
  
  el.style.width = '100%';
  el.style.height = '100%';
  el.style.objectFit = 'contain';
  
  const showFlash = () => {
    if (flashLayer.style.display === 'block') return; // in case another triggered
    flashLayer.innerHTML = ''; // clear old
    flashLayer.appendChild(el);
    flashLayer.style.backgroundColor = 'rgba(0, 0, 0, 0.85)';
    flashLayer.style.display = 'block';
    
    if (isVideo) el.play().catch(()=>{});
    
    setTimeout(() => {
      flashLayer.style.display = 'none';
      flashLayer.style.backgroundColor = 'transparent';
      flashLayer.innerHTML = ''; // clean up
    }, 200);
  };
  
  if (isVideo) {
    el.src = toMediaUrl(media);
    el.muted = true;
    el.controls = false;
    el.addEventListener('loadeddata', showFlash);
    el.addEventListener('error', () => { /* ignore */ });
  } else {
    el.src = toMediaUrl(media);
    el.addEventListener('load', showFlash);
    el.addEventListener('error', () => { /* ignore */ });
  }
});
