// ==========================================================================
// VERCEL SPEED INSIGHTS
// ==========================================================================
import { inject } from '@vercel/speed-insights';

// Initialize Speed Insights for performance tracking
inject();

// ==========================================================================
// CONSTANTS & STATE VARIABLES
// ==========================================================================
const TOTAL_FRAMES = 106;
const images = [];
let loadedImagesCount = 0;

// Scroll & Lerp progress tracking
let targetProgress = 0;
let currentProgress = 0;
const LERP_FACTOR = 0.08; // Control scrubbing smoothness (lower is smoother)

// Element References
const canvas = document.getElementById('scroll-canvas');
const ctx = canvas.getContext('2d');

const container = document.getElementById('hero-scroll-container');
const scrollHint = document.getElementById('scroll-hint');
const navbar = document.getElementById('navbar');
const mockupOverlay = document.getElementById('mockup-overlay');

// Audio & Visualizer elements
const musicToggle = document.getElementById('music-toggle');
const bgMusic = document.getElementById('bg-music');
const musicIcon = document.getElementById('music-icon');
const vizPlayBtn = document.getElementById('visualizer-play-btn');
const vizPlayIcon = document.getElementById('viz-play-icon');
const vizPlayText = document.getElementById('viz-play-text');
const vizStatus = document.getElementById('visualizer-status');
const lyricStanzas = document.querySelectorAll('.lyric-stanza');

let isAudioPlaying = false;
let audioCtx;
let analyser;
let source;

// ==========================================================================
// DYNAMIC FILE PATHS GENERATION
// ==========================================================================
// Generates array: ['./ezgif-frame-001.jpg', './ezgif-frame-002.jpg', ...]
const imagePaths = Array.from({ length: TOTAL_FRAMES }, (_, i) => {
  const frameNumber = String(i + 1).padStart(3, '0');
  return `./ezgif-frame-${frameNumber}.jpg`;
});

// ==========================================================================
// IMAGE LOADER (silent background loading)
// ==========================================================================
function loadImages() {
  imagePaths.forEach((path, index) => {
    const img = new Image();
    img.src = path;
    img.onload = () => { images[index] = img; };
    img.onerror = () => {
      console.warn(`Failed to load frame: ${path}. Creating fallback placeholder.`);
      images[index] = createFallbackPlaceholder(path);
    };
  });
}

// Fallback image in case of load failures
function createFallbackPlaceholder(name) {
  const placeholderCanvas = document.createElement('canvas');
  placeholderCanvas.width = 1920;
  placeholderCanvas.height = 1080;
  const pCtx = placeholderCanvas.getContext('2d');
  
  // Draw beautiful sunset sky fallback
  const gradient = pCtx.createLinearGradient(0, 0, 0, 1080);
  gradient.addColorStop(0, '#09203f');
  gradient.addColorStop(0.5, '#537895');
  gradient.addColorStop(1, '#f27280');
  pCtx.fillStyle = gradient;
  pCtx.fillRect(0, 0, 1920, 1080);
  
  pCtx.font = 'bold 36px Outfit';
  pCtx.fillStyle = '#ffffff';
  pCtx.textAlign = 'center';
  pCtx.fillText(`[Missing Visual Asset: ${name}]`, 960, 540);
  
  const imgFallback = new Image();
  imgFallback.src = placeholderCanvas.toDataURL();
  return imgFallback;
}

// ==========================================================================
// CANVAS ASPECT RATIO Math (Object-Fit: Cover)
// ==========================================================================
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  // Redraw current interpolated progress instantly on resize
  const currentFrameIdx = Math.round(currentProgress * (TOTAL_FRAMES - 1));
  drawFrame(currentFrameIdx);
}

function drawFrame(frameIndex) {
  // Clamp index to array bounds
  const idx = Math.min(TOTAL_FRAMES - 1, Math.max(0, frameIndex));
  const img = images[idx];
  if (!img) return;

  const canvasWidth = canvas.width;
  const canvasHeight = canvas.height;
  const imgWidth = img.width;
  const imgHeight = img.height;

  // Aspect ratio calculations
  const canvasRatio = canvasWidth / canvasHeight;
  const imgRatio = imgWidth / imgHeight;

  let sx = 0;
  let sy = 0;
  let sWidth = imgWidth;
  let sHeight = imgHeight;

  if (canvasRatio > imgRatio) {
    // Screen is wider than image, crop top/bottom of image
    sHeight = imgWidth / canvasRatio;
    sy = (imgHeight - sHeight) / 2;
  } else {
    // Screen is taller than image, crop left/right of image
    sWidth = imgHeight * canvasRatio;
    sx = (imgWidth - sWidth) / 2;
  }

  // Draw scaled and cropped frame onto canvas
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  ctx.drawImage(
    img, 
    sx, sy, sWidth, sHeight,        // Source rectangle
    0, 0, canvasWidth, canvasHeight  // Destination rectangle
  );
}

// ==========================================================================
// SCROLL PROGRESS CALCULATION
// ==========================================================================
function getScrollProgress() {
  const rect = container.getBoundingClientRect();
  const containerHeight = rect.height;
  
  // How many pixels the container's top has scrolled past the viewport top
  const scrolled = -rect.top;
  const scrollableHeight = containerHeight - window.innerHeight;
  
  if (scrolled < 0) return 0;
  if (scrolled > scrollableHeight) return 1;
  
  return scrolled / scrollableHeight;
}

// Update scroll target values on scroll events
function handleScroll() {
  targetProgress = getScrollProgress();
  
  // Add class for blurred glass navbar when user scrolls down
  if (window.scrollY > 60) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }
  
  // Hide scroll indicator mouse prompt after scrolling past first few frames
  if (targetProgress > 0.05) {
    scrollHint.classList.add('hidden');
  } else {
    scrollHint.classList.remove('hidden');
  }
}

// ==========================================================================
// MAIN RENDER LOOP (Lerp interpolation)
// ==========================================================================
function animationLoop() {
  // Smoothly blend current progress towards target progress
  currentProgress += (targetProgress - currentProgress) * LERP_FACTOR;
  
  // Map progress [0.0 - 1.0] to frame indices [0 - 105]
  const currentFrameIdx = Math.round(currentProgress * (TOTAL_FRAMES - 1));
  
  // Render frame
  drawFrame(currentFrameIdx);
  
  // Toggle mockup overlay details at the end of the scroll animation
  if (currentProgress > 0.82) {
    mockupOverlay.classList.add('active');
  } else {
    mockupOverlay.classList.remove('active');
  }
  
  // Loop continuously
  requestAnimationFrame(animationLoop);
}

// ==========================================================================
// AUDIO & SYNCED LYRICS PLAYER CONTROLS
// ==========================================================================
function setupAudio() {
  // 1. Navbar Sound toggle
  musicToggle.addEventListener('click', () => {
    toggleAudioPlayback();
  });

  // 2. Visualizer Large Play button
  vizPlayBtn.addEventListener('click', () => {
    toggleAudioPlayback();
  });

  // 3. Sync stanzas on timeupdate
  bgMusic.addEventListener('timeupdate', () => {
    syncLyricsTime();
  });
}

function toggleAudioPlayback() {
  if (isAudioPlaying) {
    bgMusic.pause();
    isAudioPlaying = false;
    updateAudioUI(false);
  } else {
    bgMusic.play()
      .then(() => {
        isAudioPlaying = true;
        updateAudioUI(true);
        initAudioVisualizer();
      })
      .catch(err => {
        console.warn('Playback blocked by browser policy:', err);
        // Visual cue to alert user clicking is required
        musicToggle.style.animation = 'none';
        setTimeout(() => {
          musicToggle.style.animation = 'pulse 1s 2';
        }, 50);
      });
  }
}

function updateAudioUI(playing) {
  if (playing) {
    // Navbar
    musicIcon.className = 'fas fa-volume-up';
    musicToggle.classList.add('playing');
    
    // Lyrics viz controls
    vizPlayIcon.className = 'fa-solid fa-pause';
    vizPlayText.textContent = 'Pause the Memory';
    vizStatus.textContent = 'Playing track. Feeling the beat...';
  } else {
    // Navbar
    musicIcon.className = 'fas fa-volume-mute';
    musicToggle.classList.remove('playing');
    
    // Lyrics viz controls
    vizPlayIcon.className = 'fa-solid fa-play';
    vizPlayText.textContent = 'Bring the Song to Life';
    vizStatus.textContent = 'Memory paused.';
  }
}

function syncLyricsTime() {
  const time = bgMusic.currentTime;
  let activeIndex = 0;
  
  for (let i = 0; i < lyricStanzas.length; i++) {
    const stanzaTime = parseFloat(lyricStanzas[i].getAttribute('data-time'));
    if (time >= stanzaTime) {
      activeIndex = i;
    } else {
      break;
    }
  }
  
  lyricStanzas.forEach((stanza, index) => {
    if (index === activeIndex) {
      stanza.classList.add('active');
    } else {
      stanza.classList.remove('active');
      // Reset custom inline text shadow styles when inactive
      stanza.style.textShadow = '';
    }
  });
}

function initAudioVisualizer() {
  if (audioCtx) return; // already running
  
  try {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioCtx.createAnalyser();
    source = audioCtx.createMediaElementSource(bgMusic);
    source.connect(analyser);
    analyser.connect(audioCtx.destination);
    
    analyser.fftSize = 64;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    const vizCanvas = document.getElementById('lyrics-visualizer');
    const vizCtx = vizCanvas.getContext('2d');
    
    // Size relative to container width
    const setVizCanvasSize = () => {
      if (vizCanvas.parentElement) {
        vizCanvas.width = vizCanvas.parentElement.clientWidth;
        vizCanvas.height = 100;
      }
    };
    setVizCanvasSize();
    window.addEventListener('resize', setVizCanvasSize);
    
    function drawVisuals() {
      requestAnimationFrame(drawVisuals);
      
      if (!isAudioPlaying) {
        // If paused, slowly decay the canvas visualizer values
        vizCtx.clearRect(0, 0, vizCanvas.width, vizCanvas.height);
        return;
      }
      
      analyser.getByteFrequencyData(dataArray);
      vizCtx.clearRect(0, 0, vizCanvas.width, vizCanvas.height);
      
      const barWidth = (vizCanvas.width / bufferLength);
      let barHeight;
      let x = 0;
      let totalFreqSum = 0;
      
      for (let i = 0; i < bufferLength; i++) {
        barHeight = (dataArray[i] / 255) * vizCanvas.height * 0.85;
        totalFreqSum += dataArray[i];
        
        // Glassy white/cyan-purple gradient frequency bars
        const gradient = vizCtx.createLinearGradient(0, vizCanvas.height, 0, 0);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.05)');
        gradient.addColorStop(0.5, 'rgba(52, 152, 219, 0.25)'); // soft cyan
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0.75)'); // white glow
        
        vizCtx.fillStyle = gradient;
        vizCtx.fillRect(x, vizCanvas.height - barHeight, barWidth - 3, barHeight);
        
        x += barWidth;
      }
      
      // Compute average volume to dynamically pulse active stanza's textShadow!
      const avgVolume = totalFreqSum / bufferLength;
      const glowAmt = (avgVolume / 255) * 16; // Up to 16px glow
      const activeStanza = document.querySelector('.lyric-stanza.active');
      if (activeStanza) {
        activeStanza.style.textShadow = `0 0 ${4 + glowAmt}px rgba(255, 255, 255, ${0.5 + (avgVolume / 255) * 0.5})`;
      }
    }
    
    drawVisuals();
  } catch (e) {
    console.error('Web Audio API Visualizer failed to initialize:', e);
  }
}

// ==========================================================================
// ENTRY POINT / INITIALIZATION
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
  loadImages();
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  window.addEventListener('scroll', handleScroll);
  handleScroll();
  setupAudio();
  requestAnimationFrame(animationLoop);
});
