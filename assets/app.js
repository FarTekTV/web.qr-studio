let currentTab = 'url';
let currentData = '';

function switchTab(tab, el) {
  currentTab = tab;
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.getElementById('panel-' + tab).classList.add('active');
  document.getElementById('result').classList.remove('show');
  hideError();
}

function showError(msg) {
  const el = document.getElementById('error-msg');
  el.textContent = '⚠ ' + msg;
  el.style.display = 'block';
}

function hideError() {
  document.getElementById('error-msg').style.display = 'none';
}

function escapeWifi(s) {
  return s
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/"/g, '\\"');
}

function getData() {
  hideError();

  if (currentTab === 'url') {
    let v = document.getElementById('url-input').value.trim();
    if (!v) { showError('Please enter a URL.'); return null; }
    if (!/^https?:\/\//i.test(v)) v = 'https://' + v;
    return v;
  }

  if (currentTab === 'wifi') {
    const ssid = document.getElementById('wifi-ssid').value.trim();
    const pass = document.getElementById('wifi-pass').value;
    const sec  = document.getElementById('wifi-sec').value;
    if (!ssid) { showError('Please enter the network name.'); return null; }
    if (sec === 'nopass') return `WIFI:T:nopass;S:${escapeWifi(ssid)};;`;
    return `WIFI:T:${sec};S:${escapeWifi(ssid)};P:${escapeWifi(pass)};;`;
  }

  if (currentTab === 'text') {
    const v = document.getElementById('text-input').value.trim();
    if (!v) { showError('Please enter some text.'); return null; }
    return v;
  }
}

function generate() {
  const data = getData();
  if (!data) return;
  currentData = data;

  const outputSize = parseInt(document.getElementById('qr-size').value);

  try {
    // qrcode-generator (kazuhikoarase)
    // Type 0 = auto-detect version, correction level M = good balance density/readability
    const qr = qrcode(0, 'M');
    qr.addData(data);
    qr.make();

    const moduleCount = qr.getModuleCount();
    const margin = 4; // quiet zone required by ISO standard
    const totalModules = moduleCount + margin * 2;
    const cellSize = Math.max(4, Math.floor(outputSize / totalModules));
    const canvasSize = totalModules * cellSize;

    const canvas = document.getElementById('qrcanvas');
    canvas.width = canvasSize;
    canvas.height = canvasSize;
    canvas.style.width = canvasSize + 'px';
    canvas.style.height = canvasSize + 'px';

    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    // Pure white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvasSize, canvasSize);

    // Pure black modules — maximum contrast for all readers
    ctx.fillStyle = '#000000';
    for (let row = 0; row < moduleCount; row++) {
      for (let col = 0; col < moduleCount; col++) {
        if (qr.isDark(row, col)) {
          ctx.fillRect(
            (col + margin) * cellSize,
            (row + margin) * cellSize,
            cellSize,
            cellSize
          );
        }
      }
    }

    const result = document.getElementById('result');
    result.classList.remove('show');
    void result.offsetWidth; // force reflow to restart animation
    result.classList.add('show');

  } catch (e) {
    showError('Data too long. Shorten the content or use a URL shortener.');
  }
}

function downloadQR() {
  const canvas = document.getElementById('qrcanvas');
  const a = document.createElement('a');
  a.download = 'qrcode.png';
  a.href = canvas.toDataURL('image/png');
  a.click();
}

function copyData() {
  if (!currentData) return;
  navigator.clipboard.writeText(currentData).then(() => {
    const btn = document.getElementById('copy-btn');
    btn.textContent = '✅ Copied!';
    setTimeout(() => btn.textContent = '📋 Copy data', 2000);
  });
}
