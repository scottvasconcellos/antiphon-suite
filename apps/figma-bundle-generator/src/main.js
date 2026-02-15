import { buildHandoffBundle } from './bundleBuilder.js';

const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('file');
const label = document.getElementById('label');
const status = document.getElementById('status');

function setStatus(message, type = '') {
  status.textContent = message;
  status.className = 'status ' + type;
}

function setBusy(busy) {
  dropzone.classList.toggle('busy', busy);
}

function downloadBlob(blob, filename) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

async function processFile(file) {
  if (!file || !file.name.toLowerCase().endsWith('.zip')) {
    setStatus('Please choose a .zip file.', 'error');
    return;
  }

  setBusy(true);
  setStatus('Building bundle…');

  try {
    const blob = await buildHandoffBundle(file);
    const baseName = file.name.replace(/\.zip$/i, '');
    const outName = `Figma-Bundle-${baseName}-${Date.now()}.zip`;
    downloadBlob(blob, outName);
    setStatus('Downloaded ' + outName, 'success');
    label.textContent = 'Drop another ZIP or click to choose';
  } catch (err) {
    setStatus(err.message || 'Something went wrong.', 'error');
  } finally {
    setBusy(false);
  }
}

// Double-click or click: open file picker
dropzone.addEventListener('dblclick', (e) => {
  e.preventDefault();
  fileInput.click();
});

dropzone.addEventListener('click', (e) => {
  if (e.target === fileInput) return;
  e.preventDefault();
  fileInput.click();
});

fileInput.addEventListener('change', () => {
  const file = fileInput.files?.[0];
  if (file) processFile(file);
  fileInput.value = '';
});

// Drag and drop
dropzone.addEventListener('dragover', (e) => {
  e.preventDefault();
  e.stopPropagation();
  dropzone.classList.add('dragover');
});

dropzone.addEventListener('dragleave', (e) => {
  e.preventDefault();
  e.stopPropagation();
  dropzone.classList.remove('dragover');
});

dropzone.addEventListener('drop', (e) => {
  e.preventDefault();
  e.stopPropagation();
  dropzone.classList.remove('dragover');
  const file = e.dataTransfer?.files?.[0];
  if (file) processFile(file);
});

// Keyboard: Enter/Space to activate
dropzone.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    fileInput.click();
  }
});
