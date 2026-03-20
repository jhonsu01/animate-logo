// ============================================================
// AnimateLogo - Main Application
// ============================================================

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

// State
let currentFile = null;
let currentSvgContent = null;
let currentAnimation = null;
let vivusInstance = null;
let selectedAnim = 'none';

// ============================================================
// 1. FILE UPLOAD
// ============================================================

const dropZone = $('#drop-zone');
const fileInput = $('#file-input');
const previewImg = $('#preview-img');
const imagePreview = $('#image-preview');
const convertSection = $('#convert-section');

dropZone.addEventListener('click', () => fileInput.click());

dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropZone.classList.add('dragover');
});

dropZone.addEventListener('dragleave', () => {
  dropZone.classList.remove('dragover');
});

dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZone.classList.remove('dragover');
  const file = e.dataTransfer.files[0];
  if (file && file.type.startsWith('image/')) handleFile(file);
});

fileInput.addEventListener('change', () => {
  if (fileInput.files[0]) handleFile(fileInput.files[0]);
});

$('#btn-clear').addEventListener('click', () => {
  currentFile = null;
  currentSvgContent = null;
  imagePreview.hidden = true;
  dropZone.style.display = '';
  convertSection.hidden = true;
  $('#animate-section').hidden = true;
  $('#download-section').hidden = true;
});

function handleFile(file) {
  currentFile = file;
  const reader = new FileReader();
  reader.onload = (e) => {
    previewImg.src = e.target.result;
    imagePreview.hidden = false;
    dropZone.style.display = 'none';
    convertSection.hidden = false;
  };
  reader.readAsDataURL(file);
}

// ============================================================
// 2. CONVERSION CONTROLS
// ============================================================

// Slider value displays
const sliderMap = {
  'color_precision': 'val-cp',
  'filter_speckle': 'val-fs',
  'gradient_step': 'val-gs',
  'corner_threshold': 'val-ct',
  'segment_length': 'val-sl',
  'anim-duration': 'val-dur',
  'anim-delay': 'val-del',
};

Object.entries(sliderMap).forEach(([sliderId, valId]) => {
  const slider = $(`#${sliderId}`);
  const valEl = $(`#${valId}`);
  if (slider && valEl) {
    slider.addEventListener('input', () => { valEl.textContent = slider.value; });
  }
});

// Preset handling
$('#preset').addEventListener('change', (e) => {
  const presets = {
    bw:     { colormode: 'bw', color_precision: 6, gradient_step: 16, corner_threshold: 60, filter_speckle: 4 },
    poster: { colormode: 'color', color_precision: 8, gradient_step: 16, corner_threshold: 60, filter_speckle: 4 },
    photo:  { colormode: 'color', color_precision: 8, gradient_step: 48, corner_threshold: 180, filter_speckle: 10 },
  };
  const p = presets[e.target.value];
  if (!p) return;
  Object.entries(p).forEach(([key, val]) => {
    const el = $(`#${key}`);
    if (el) {
      el.value = val;
      el.dispatchEvent(new Event('input'));
    }
  });
});

// Convert button
$('#btn-convert').addEventListener('click', convertImage);

async function convertImage() {
  if (!currentFile) return;

  const btn = $('#btn-convert');
  const progress = $('#convert-progress');
  btn.disabled = true;
  progress.hidden = false;

  const formData = new FormData();
  formData.append('image', currentFile);

  const params = {
    colormode: $('#colormode').value,
    mode: $('#mode').value,
    color_precision: $('#color_precision').value,
    filter_speckle: $('#filter_speckle').value,
    gradient_step: $('#gradient_step').value,
    corner_threshold: $('#corner_threshold').value,
    segment_length: $('#segment_length').value,
    hierarchical: $('#hierarchical').value,
  };

  const preset = $('#preset').value;
  if (preset) params.preset = preset;

  formData.append('params', JSON.stringify(params));

  try {
    const res = await fetch('/api/convert', {
      method: 'POST',
      body: formData,
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.error || 'Error de conversión');

    currentSvgContent = data.svg;
    displaySvg(data.svg);
    $('#animate-section').hidden = false;
    $('#download-section').hidden = false;
    showToast('SVG generado exitosamente', 'success');
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    btn.disabled = false;
    progress.hidden = true;
  }
}

function displaySvg(svgContent) {
  const container = $('#svg-container');
  container.innerHTML = svgContent;
  const svg = container.querySelector('svg');
  if (svg) {
    // Ensure viewBox exists before removing dimensions
    if (!svg.getAttribute('viewBox')) {
      const w = parseFloat(svg.getAttribute('width')) || 400;
      const h = parseFloat(svg.getAttribute('height')) || 400;
      svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    }
    // Remove fixed dimensions so it scales to container
    svg.removeAttribute('width');
    svg.removeAttribute('height');
    svg.style.width = '100%';
    svg.style.height = 'auto';
    svg.style.maxHeight = '70vh';
    svg.style.display = 'block';
  }
}

// ============================================================
// 3. ANIMATION SYSTEM
// ============================================================

// Animation button selection
$$('.anim-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    $$('.anim-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    selectedAnim = btn.dataset.anim;
    playAnimation();
  });
});

$('#btn-play').addEventListener('click', playAnimation);
$('#btn-reset').addEventListener('click', resetAnimation);

function getAnimOptions() {
  return {
    duration: parseInt($('#anim-duration').value),
    delay: parseInt($('#anim-delay').value),
    easing: $('#anim-easing').value,
    loop: (() => {
      const v = $('#anim-loop').value;
      if (v === 'true') return true;
      if (v === 'false') return false;
      return parseInt(v);
    })(),
  };
}

function resetAnimation() {
  // Cleanup previous animations
  if (currentAnimation) {
    if (typeof currentAnimation.pause === 'function') currentAnimation.pause();
    currentAnimation = null;
  }
  if (vivusInstance) {
    try { vivusInstance.destroy(); } catch (_) {}
    vivusInstance = null;
  }

  // Restore SVG
  if (currentSvgContent) {
    displaySvg(currentSvgContent);
  }
}

function playAnimation() {
  resetAnimation();
  if (!currentSvgContent || selectedAnim === 'none') return;

  const container = $('#svg-container');
  const svg = container.querySelector('svg');
  if (!svg) return;

  const opts = getAnimOptions();
  const paths = svg.querySelectorAll('path, circle, rect, ellipse, polygon, polyline, line');

  // Choose animation
  switch (selectedAnim) {
    case 'draw':
    case 'draw-reverse':
    case 'draw-sync':
      playDrawAnimation(svg, opts);
      break;
    case 'fade-in':
      playFadeIn(svg, paths, opts);
      break;
    case 'fade-in-up':
      playFadeInUp(svg, paths, opts);
      break;
    case 'fade-in-scale':
      playFadeInScale(svg, paths, opts);
      break;
    case 'scale-bounce':
      playScaleBounce(svg, opts);
      break;
    case 'rotate-in':
      playRotateIn(svg, opts);
      break;
    case 'rotate-scale':
      playRotateScale(svg, opts);
      break;
    case 'slide-left':
      playSlide(svg, opts, 'left');
      break;
    case 'slide-right':
      playSlide(svg, opts, 'right');
      break;
    case 'stagger-fade':
      playStaggerFade(paths, opts);
      break;
    case 'stagger-scale':
      playStaggerScale(paths, opts);
      break;
    case 'stagger-rotate':
      playStaggerRotate(paths, opts);
      break;
    case 'elastic-in':
      playElasticIn(svg, opts);
      break;
    case 'bounce-in':
      playBounceIn(svg, opts);
      break;
    case 'flip-x':
      playFlip(svg, opts, 'X');
      break;
    case 'flip-y':
      playFlip(svg, opts, 'Y');
      break;
    case 'typewriter':
      playTypewriter(paths, opts);
      break;
  }
}

// --- Draw Animations (Vivus) ---
function playDrawAnimation(svg, opts) {
  // Vivus needs strokes. Clone SVG and add strokes for paths that only have fill
  prepareSvgForDrawing(svg);

  const typeMap = {
    'draw': 'delayed',
    'draw-reverse': 'oneByOne',
    'draw-sync': 'sync',
  };

  // Set ID for vivus
  svg.id = 'vivus-svg';

  vivusInstance = new Vivus('vivus-svg', {
    type: typeMap[selectedAnim] || 'delayed',
    duration: Math.round(opts.duration / 16), // frames at ~60fps
    start: 'manual',
    animTimingFunction: Vivus.EASE_OUT,
    reverseStack: selectedAnim === 'draw-reverse',
  });

  vivusInstance.reset().play(1);
}

function prepareSvgForDrawing(svg) {
  const paths = svg.querySelectorAll('path, circle, rect, ellipse, polygon, polyline, line');
  paths.forEach(el => {
    const fill = el.getAttribute('fill') || window.getComputedStyle(el).fill;
    const stroke = el.getAttribute('stroke');

    if (!stroke || stroke === 'none') {
      // Copy fill color to stroke for drawing effect
      el.setAttribute('stroke', fill && fill !== 'none' ? fill : '#000');
      el.setAttribute('stroke-width', '1.5');
    }

    // Temporarily hide fill during draw (reveal after)
    el.dataset.originalFill = el.getAttribute('fill') || '';
    el.setAttribute('fill', 'transparent');
  });

  // Reveal fills after animation
  if (vivusInstance) {
    // Will be set by vivus callback
  }
  setTimeout(() => {
    paths.forEach(el => {
      if (el.dataset.originalFill) {
        el.style.transition = 'fill 0.5s ease';
        el.setAttribute('fill', el.dataset.originalFill);
      }
    });
  }, getAnimOptions().duration + 200);
}

// --- Anime.js Animations ---
function playFadeIn(svg, paths, opts) {
  svg.style.opacity = '0';
  currentAnimation = anime.animate(svg, {
    opacity: [0, 1],
    duration: opts.duration,
    delay: opts.delay,
    ease: opts.easing,
    loop: opts.loop,
  });
}

function playFadeInUp(svg, paths, opts) {
  svg.style.opacity = '0';
  currentAnimation = anime.animate(svg, {
    opacity: [0, 1],
    translateY: [40, 0],
    duration: opts.duration,
    delay: opts.delay,
    ease: opts.easing,
    loop: opts.loop,
  });
}

function playFadeInScale(svg, paths, opts) {
  svg.style.opacity = '0';
  currentAnimation = anime.animate(svg, {
    opacity: [0, 1],
    scale: [0.5, 1],
    duration: opts.duration,
    delay: opts.delay,
    ease: opts.easing,
    loop: opts.loop,
  });
}

function playScaleBounce(svg, opts) {
  currentAnimation = anime.animate(svg, {
    scale: [0, 1],
    duration: opts.duration,
    delay: opts.delay,
    ease: 'outElastic(1, 0.5)',
    loop: opts.loop,
  });
}

function playRotateIn(svg, opts) {
  svg.style.opacity = '0';
  currentAnimation = anime.animate(svg, {
    rotate: [-180, 0],
    opacity: [0, 1],
    duration: opts.duration,
    delay: opts.delay,
    ease: opts.easing,
    loop: opts.loop,
  });
}

function playRotateScale(svg, opts) {
  currentAnimation = anime.animate(svg, {
    rotate: [360, 0],
    scale: [0, 1],
    duration: opts.duration,
    delay: opts.delay,
    ease: 'outBack(1.7)',
    loop: opts.loop,
  });
}

function playSlide(svg, opts, direction) {
  const from = direction === 'left' ? -200 : 200;
  svg.style.opacity = '0';
  currentAnimation = anime.animate(svg, {
    translateX: [from, 0],
    opacity: [0, 1],
    duration: opts.duration,
    delay: opts.delay,
    ease: opts.easing,
    loop: opts.loop,
  });
}

function playStaggerFade(paths, opts) {
  if (paths.length === 0) return;
  paths.forEach(p => p.style.opacity = '0');
  currentAnimation = anime.animate(paths, {
    opacity: [0, 1],
    duration: opts.duration,
    delay: anime.stagger(Math.min(50, opts.duration / paths.length), { start: opts.delay }),
    ease: opts.easing,
    loop: opts.loop,
  });
}

function playStaggerScale(paths, opts) {
  if (paths.length === 0) return;
  paths.forEach(p => {
    p.style.transformOrigin = 'center';
    p.style.transformBox = 'fill-box';
  });
  currentAnimation = anime.animate(paths, {
    scale: [0, 1],
    opacity: [0, 1],
    duration: opts.duration,
    delay: anime.stagger(Math.min(30, opts.duration / paths.length), { start: opts.delay }),
    ease: opts.easing,
    loop: opts.loop,
  });
}

function playStaggerRotate(paths, opts) {
  if (paths.length === 0) return;
  paths.forEach(p => {
    p.style.transformOrigin = 'center';
    p.style.transformBox = 'fill-box';
  });
  currentAnimation = anime.animate(paths, {
    rotate: [-90, 0],
    opacity: [0, 1],
    duration: opts.duration,
    delay: anime.stagger(Math.min(40, opts.duration / paths.length), { start: opts.delay }),
    ease: opts.easing,
    loop: opts.loop,
  });
}

function playElasticIn(svg, opts) {
  currentAnimation = anime.animate(svg, {
    scale: [0, 1],
    duration: opts.duration,
    delay: opts.delay,
    ease: 'outElastic(1, 0.3)',
    loop: opts.loop,
  });
}

function playBounceIn(svg, opts) {
  svg.style.opacity = '0';
  currentAnimation = anime.animate(svg, {
    scale: [0.3, 1],
    opacity: [0, 1],
    translateY: [-50, 0],
    duration: opts.duration,
    delay: opts.delay,
    ease: 'outBounce',
    loop: opts.loop,
  });
}

function playFlip(svg, opts, axis) {
  const prop = axis === 'X' ? 'rotateX' : 'rotateY';
  svg.parentElement.style.perspective = '800px';
  currentAnimation = anime.animate(svg, {
    [prop]: [-90, 0],
    opacity: [0, 1],
    duration: opts.duration,
    delay: opts.delay,
    ease: opts.easing,
    loop: opts.loop,
  });
}

function playTypewriter(paths, opts) {
  if (paths.length === 0) return;
  paths.forEach(p => p.style.opacity = '0');

  const perPath = Math.max(30, opts.duration / paths.length);

  paths.forEach((p, i) => {
    setTimeout(() => {
      p.style.transition = `opacity ${perPath}ms ease`;
      p.style.opacity = '1';
    }, opts.delay + i * perPath);
  });

  // Store reference for reset
  currentAnimation = {
    pause: () => {
      paths.forEach(p => {
        p.style.transition = '';
        p.style.opacity = '';
      });
    }
  };
}

// ============================================================
// 4. DOWNLOAD / EXPORT
// ============================================================

$('#btn-download-svg').addEventListener('click', downloadAnimatedSvg);
$('#btn-download-svg-static').addEventListener('click', downloadStaticSvg);
$('#btn-download-gif').addEventListener('click', downloadGif);

function getScaledSvg(svgContent, scale) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgContent, 'image/svg+xml');
  const svg = doc.querySelector('svg');
  if (!svg) return svgContent;

  const vb = svg.getAttribute('viewBox');
  if (vb) {
    const [, , w, h] = vb.split(/\s+/).map(Number);
    svg.setAttribute('width', Math.round(w * scale));
    svg.setAttribute('height', Math.round(h * scale));
  }

  return new XMLSerializer().serializeToString(svg);
}

function buildAnimatedSvg() {
  if (!currentSvgContent) return null;

  const scale = parseFloat($('#export-resolution').value);
  const opts = getAnimOptions();
  const parser = new DOMParser();
  const doc = parser.parseFromString(currentSvgContent, 'image/svg+xml');
  const svg = doc.querySelector('svg');
  if (!svg) return null;

  // Scale dimensions
  const vb = svg.getAttribute('viewBox');
  if (vb) {
    const [, , w, h] = vb.split(/\s+/).map(Number);
    svg.setAttribute('width', Math.round(w * scale));
    svg.setAttribute('height', Math.round(h * scale));
  }

  // Add CSS animation based on selected type
  const style = doc.createElementNS('http://www.w3.org/2000/svg', 'style');
  const dur = opts.duration + 'ms';
  const easingCss = cssEasing(opts.easing);
  const loopCss = opts.loop === true ? 'infinite' : (opts.loop || 1);
  const delayCss = opts.delay + 'ms';

  let css = '';

  switch (selectedAnim) {
    case 'draw':
    case 'draw-reverse':
    case 'draw-sync': {
      const paths = svg.querySelectorAll('path, circle, rect, ellipse, polygon, polyline, line');
      paths.forEach((p, i) => {
        const fill = p.getAttribute('fill') || '#000';
        const len = estimatePathLength(p);
        p.setAttribute('stroke', fill !== 'none' ? fill : '#000');
        p.setAttribute('stroke-width', '1.5');
        p.setAttribute('stroke-dasharray', len);
        p.setAttribute('stroke-dashoffset', len);
        p.setAttribute('fill', 'transparent');
        p.classList.add('draw-path');
        p.style.animation = `draw ${dur} ${easingCss} ${selectedAnim === 'draw-sync' ? '0ms' : (i * 50) + 'ms'} forwards`;
      });
      css = `
        @keyframes draw {
          to { stroke-dashoffset: 0; }
        }
        @keyframes revealFill {
          to { fill: var(--orig-fill); }
        }
      `;
      break;
    }
    case 'fade-in':
      css = `svg { opacity: 0; animation: fadeIn ${dur} ${easingCss} ${delayCss} ${loopCss} forwards; }
        @keyframes fadeIn { to { opacity: 1; } }`;
      break;
    case 'fade-in-up':
      css = `svg { opacity: 0; transform: translateY(40px); animation: fadeInUp ${dur} ${easingCss} ${delayCss} ${loopCss} forwards; }
        @keyframes fadeInUp { to { opacity: 1; transform: translateY(0); } }`;
      break;
    case 'fade-in-scale':
      css = `svg { opacity: 0; transform: scale(0.5); transform-origin: center; animation: fadeInScale ${dur} ${easingCss} ${delayCss} ${loopCss} forwards; }
        @keyframes fadeInScale { to { opacity: 1; transform: scale(1); } }`;
      break;
    case 'scale-bounce':
      css = `svg { transform: scale(0); transform-origin: center; animation: scaleBounce ${dur} cubic-bezier(0.34, 1.56, 0.64, 1) ${delayCss} ${loopCss} forwards; }
        @keyframes scaleBounce { to { transform: scale(1); } }`;
      break;
    case 'rotate-in':
      css = `svg { opacity: 0; transform: rotate(-180deg); transform-origin: center; animation: rotateIn ${dur} ${easingCss} ${delayCss} ${loopCss} forwards; }
        @keyframes rotateIn { to { opacity: 1; transform: rotate(0); } }`;
      break;
    case 'rotate-scale':
      css = `svg { transform: rotate(360deg) scale(0); transform-origin: center; animation: rotateScale ${dur} cubic-bezier(0.34, 1.56, 0.64, 1) ${delayCss} ${loopCss} forwards; }
        @keyframes rotateScale { to { transform: rotate(0) scale(1); } }`;
      break;
    case 'slide-left':
      css = `svg { opacity: 0; transform: translateX(-200px); animation: slideLeft ${dur} ${easingCss} ${delayCss} ${loopCss} forwards; }
        @keyframes slideLeft { to { opacity: 1; transform: translateX(0); } }`;
      break;
    case 'slide-right':
      css = `svg { opacity: 0; transform: translateX(200px); animation: slideRight ${dur} ${easingCss} ${delayCss} ${loopCss} forwards; }
        @keyframes slideRight { to { opacity: 1; transform: translateX(0); } }`;
      break;
    case 'elastic-in':
      css = `svg { transform: scale(0); transform-origin: center; animation: elasticIn ${dur} cubic-bezier(0.68, -0.55, 0.265, 1.55) ${delayCss} ${loopCss} forwards; }
        @keyframes elasticIn { 0% { transform: scale(0); } 60% { transform: scale(1.1); } 80% { transform: scale(0.95); } 100% { transform: scale(1); } }`;
      break;
    case 'bounce-in':
      css = `svg { opacity: 0; transform: scale(0.3) translateY(-50px); transform-origin: center; animation: bounceIn ${dur} ${easingCss} ${delayCss} ${loopCss} forwards; }
        @keyframes bounceIn { 40% { transform: scale(1.1) translateY(0); opacity: 1; } 60% { transform: scale(0.95) translateY(5px); } 100% { transform: scale(1) translateY(0); opacity: 1; } }`;
      break;
    case 'flip-x':
      css = `svg { opacity: 0; transform: perspective(800px) rotateX(-90deg); transform-origin: center; animation: flipX ${dur} ${easingCss} ${delayCss} ${loopCss} forwards; }
        @keyframes flipX { to { opacity: 1; transform: perspective(800px) rotateX(0); } }`;
      break;
    case 'flip-y':
      css = `svg { opacity: 0; transform: perspective(800px) rotateY(-90deg); transform-origin: center; animation: flipY ${dur} ${easingCss} ${delayCss} ${loopCss} forwards; }
        @keyframes flipY { to { opacity: 1; transform: perspective(800px) rotateY(0); } }`;
      break;
    case 'stagger-fade':
    case 'stagger-scale':
    case 'stagger-rotate':
    case 'typewriter': {
      const paths = svg.querySelectorAll('path, circle, rect, ellipse, polygon, polyline, line');
      const staggerDelay = Math.min(50, opts.duration / Math.max(paths.length, 1));
      let animName = 'staggerFade';
      let from = 'opacity: 0;';
      let to = 'opacity: 1;';

      if (selectedAnim === 'stagger-scale') {
        animName = 'staggerScale';
        from = 'opacity: 0; transform: scale(0); transform-origin: center; transform-box: fill-box;';
        to = 'opacity: 1; transform: scale(1);';
      } else if (selectedAnim === 'stagger-rotate') {
        animName = 'staggerRotate';
        from = 'opacity: 0; transform: rotate(-90deg); transform-origin: center; transform-box: fill-box;';
        to = 'opacity: 1; transform: rotate(0);';
      }

      paths.forEach((p, i) => {
        p.style.opacity = '0';
        p.style.animation = `${animName} ${dur} ${easingCss} ${opts.delay + i * staggerDelay}ms forwards`;
      });

      css = `@keyframes ${animName} { from { ${from} } to { ${to} } }`;
      break;
    }
    default:
      break;
  }

  style.textContent = css;
  svg.insertBefore(style, svg.firstChild);

  return new XMLSerializer().serializeToString(svg);
}

function estimatePathLength(el) {
  try {
    if (typeof el.getTotalLength === 'function') return Math.ceil(el.getTotalLength());
  } catch (_) {}
  return 1000; // fallback
}

function cssEasing(animejsEasing) {
  const map = {
    'easeInOutQuad': 'cubic-bezier(0.455, 0.03, 0.515, 0.955)',
    'easeOutElastic': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    'easeOutBounce': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    'easeInOutCubic': 'cubic-bezier(0.645, 0.045, 0.355, 1)',
    'easeInOutExpo': 'cubic-bezier(0.87, 0, 0.13, 1)',
    'easeOutBack': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    'linear': 'linear',
  };
  return map[animejsEasing] || 'ease';
}

function downloadAnimatedSvg() {
  const svgStr = buildAnimatedSvg();
  if (!svgStr) return showToast('No hay SVG para descargar', 'error');
  downloadFile(svgStr, 'logo-animado.svg', 'image/svg+xml');
  showToast('SVG animado descargado', 'success');
}

function downloadStaticSvg() {
  if (!currentSvgContent) return showToast('No hay SVG para descargar', 'error');
  const scale = parseFloat($('#export-resolution').value);
  const scaled = getScaledSvg(currentSvgContent, scale);
  downloadFile(scaled, 'logo.svg', 'image/svg+xml');
  showToast('SVG estático descargado', 'success');
}

async function downloadGif() {
  const container = $('#svg-container');
  const svg = container.querySelector('svg');
  if (!svg) return showToast('No hay SVG para exportar', 'error');
  if (selectedAnim === 'none') return showToast('Selecciona una animación primero', 'error');

  const btn = $('#btn-download-gif');
  btn.disabled = true;
  btn.textContent = 'Capturando frames...';

  const opts = getAnimOptions();
  const scale = parseFloat($('#export-resolution').value);
  const fps = 20;
  const totalFrames = Math.round((opts.duration / 1000) * fps);
  const frameInterval = opts.duration / totalFrames;

  // Get SVG dimensions
  const vb = svg.getAttribute('viewBox');
  let width = 400, height = 400;
  if (vb) {
    const parts = vb.split(/\s+/).map(Number);
    width = Math.round(parts[2] * scale);
    height = Math.round(parts[3] * scale);
  }

  // Cap dimensions for performance
  const maxDim = 800;
  if (width > maxDim || height > maxDim) {
    const ratio = maxDim / Math.max(width, height);
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  // Create GIF encoder
  const gif = new GIF({
    workers: 2,
    quality: 10,
    width: width,
    height: height,
    workerScript: 'libs/gif.worker.js',
    transparent: null,
  });

  try {
    // Reset and replay animation, capturing frames at intervals
    resetAnimation();
    if (currentSvgContent) displaySvg(currentSvgContent);

    // Wait a tick for DOM to settle
    await sleep(50);

    // Start the animation
    playAnimation();
    await sleep(50);

    // Capture frames over the animation duration
    for (let i = 0; i <= totalFrames; i++) {
      btn.textContent = `Frame ${i + 1}/${totalFrames + 1}...`;

      // Serialize current SVG state to canvas
      const svgEl = container.querySelector('svg');
      if (!svgEl) break;

      const svgClone = svgEl.cloneNode(true);
      // Capture computed styles into inline styles for proper rendering
      copyComputedStyles(svgEl, svgClone);
      svgClone.setAttribute('width', width);
      svgClone.setAttribute('height', height);
      svgClone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

      const svgStr = new XMLSerializer().serializeToString(svgClone);
      const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);

      try {
        const img = await loadImage(url);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        gif.addFrame(ctx, { copy: true, delay: Math.round(1000 / fps) });
      } catch (e) {
        console.warn('Frame capture error:', e);
      } finally {
        URL.revokeObjectURL(url);
      }

      // Wait for next frame
      if (i < totalFrames) await sleep(frameInterval);
    }

    btn.textContent = 'Generando GIF...';

    // Render GIF
    const gifBlob = await new Promise((resolve, reject) => {
      gif.on('finished', (blob) => resolve(blob));
      gif.on('error', (err) => reject(err));
      gif.render();
    });

    // Download
    const url = URL.createObjectURL(gifBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'logo-animado.gif';
    a.click();
    URL.revokeObjectURL(url);
    showToast('GIF descargado exitosamente', 'success');

  } catch (err) {
    console.error('GIF error:', err);
    showToast('Error generando GIF: ' + err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Descargar GIF';
  }
}

function copyComputedStyles(source, target) {
  // Copy inline styles and key computed properties from animated SVG elements
  const sourceEls = source.querySelectorAll('*');
  const targetEls = target.querySelectorAll('*');

  sourceEls.forEach((srcEl, i) => {
    if (!targetEls[i]) return;
    const computed = window.getComputedStyle(srcEl);

    // Copy transform and opacity (the animated properties)
    const transform = computed.transform;
    const opacity = computed.opacity;
    const strokeDashoffset = computed.strokeDashoffset;
    const fill = computed.fill;

    if (transform && transform !== 'none') targetEls[i].setAttribute('transform', svgTransformFromCss(transform));
    if (opacity && opacity !== '1') targetEls[i].setAttribute('opacity', opacity);
    if (strokeDashoffset && strokeDashoffset !== '0') targetEls[i].style.strokeDashoffset = strokeDashoffset;
    if (srcEl.style.fill) targetEls[i].setAttribute('fill', srcEl.style.fill || fill);
    if (srcEl.style.opacity) targetEls[i].setAttribute('opacity', srcEl.style.opacity);
  });
}

function svgTransformFromCss(cssTransform) {
  // CSS matrix to SVG transform attribute
  if (cssTransform === 'none' || !cssTransform) return '';
  // matrix(a,b,c,d,e,f) format works in SVG too
  return cssTransform;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ============================================================
// UTILITIES
// ============================================================

function showToast(message, type = 'success') {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}
