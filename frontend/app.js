let provider, signer, contract;

// Minimum gas policy (EIP-1559). Adjust if needed.
const MIN_FEE_GWEI = 2n;           // maxFeePerGas floor (gwei)
const MIN_PRIORITY_GWEI = 1n;      // maxPriorityFeePerGas floor (gwei)

async function feeOverrides() {
  if (!provider) return {};
  try {
    await ensureEthers();
    const fd = await provider.getFeeData();
    const MIN_FEE_GWEI = 2n;
    const MIN_PRIORITY_GWEI = 1n;// ethers v6: values may be null on some networks; fallback to floors
    const maxFee = fd.maxFeePerGas ?? (window.ethers && ethers.parseUnits(String(MIN_FEE_GWEI), 'gwei'));
    const maxPrio = fd.maxPriorityFeePerGas ?? (window.ethers && ethers.parseUnits(String(MIN_PRIORITY_GWEI), 'gwei'));
    const floorFee = ethers.parseUnits(String(MIN_FEE_GWEI), 'gwei');
    const floorPrio = ethers.parseUnits(String(MIN_PRIORITY_GWEI), 'gwei');
    return {
      maxFeePerGas: maxFee && maxFee < floorFee ? floorFee : maxFee,
      maxPriorityFeePerGas: maxPrio && maxPrio < floorPrio ? floorPrio : maxPrio
    };
  } catch { return {}; }
}

async function init() {
  try { lucide && lucide.createIcons(); } catch {}

  // Prefill productId from URL if present
  try {
    const url = new URL(window.location.href);
    const pid = url.searchParams.get('productId');
    if (pid && document.getElementById('tpId')) document.getElementById('tpId').value = pid;
  } catch {}

  // Theme
  const themeBtn = document.getElementById('themeBtn');
  if (themeBtn) themeBtn.addEventListener('click', toggleTheme);

  // Web3 wiring
  const connectBtn = document.getElementById('connectBtn');
  if (connectBtn) connectBtn.addEventListener('click', connect);

  const createBtn = document.getElementById('createBtn');
  if (createBtn) createBtn.addEventListener('click', createProduct);

  const shipBtn = document.getElementById('shipBtn');
  if (shipBtn) shipBtn.addEventListener('click', shipProduct);

  const receiveBtn = document.getElementById('receiveBtn');
  if (receiveBtn) receiveBtn.addEventListener('click', receiveProduct);

  const trackBtn = document.getElementById('trackBtn');
  if (trackBtn) trackBtn.addEventListener('click', trackProduct);

  const qrBtn = document.getElementById('qrBtn');
  if (qrBtn) qrBtn.addEventListener('click', generateQR);

  // Metadata handlers
  const uploadBtn = document.getElementById('uploadBtn');
  if (uploadBtn) uploadBtn.addEventListener('click', uploadToWeb3Storage);
  const setCidBtn = document.getElementById('setCidBtn');
  if (setCidBtn) setCidBtn.addEventListener('click', setMetadataCid);

  // Init 3D background
  initThree();
}

function toggleTheme() {
  try {
    const html = document.documentElement;
    const nowDark = html.classList.toggle('dark');
    document.body.classList.toggle('light');
    const themeIcon = document.getElementById('themeIcon');
    if (themeIcon) {
      themeIcon.setAttribute('data-lucide', nowDark ? 'moon' : 'sun');
      try { lucide && lucide.createIcons(); } catch {}
    }
  } catch {}
}

// ---------- Dynamic ethers loader ----------
function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src;
    s.async = true;
    s.onload = () => resolve(true);
    s.onerror = () => reject(new Error('Failed to load ' + src));
    document.head.appendChild(s);
  });
}

async function ensureEthers() {
  if (window.ethers) return;
  const candidates = [
    'https://cdn.jsdelivr.net/npm/ethers@6.11.1/dist/ethers.umd.min.js',
    'https://cdn.jsdelivr.net/npm/ethers@6.11.1/dist/ethers.min.js',
    'https://unpkg.com/ethers@6.11.1/dist/ethers.umd.min.js'
  ];
  let lastErr;
  for (const url of candidates) {
    try { await loadScript(url); if (window.ethers) return; } catch (e) { lastErr = e; }
  }
  throw lastErr || new Error('ethers.js failed to load');
}

// ---------- Provider detection & network helpers ----------
async function waitForEthereum(timeoutMs = 3500) {
  if (window.ethereum) return window.ethereum;
  return new Promise((resolve, reject) => {
    let done = false;
    function cleanup() { window.removeEventListener('ethereum#initialized', onInit); }
    function onInit() { if (done) return; done = true; cleanup(); resolve(window.ethereum); }
    window.addEventListener('ethereum#initialized', onInit, { once: true });
    setTimeout(() => {
      if (done) return; done = true; cleanup();
      if (window.ethereum) resolve(window.ethereum);
      else reject(new Error('MetaMask not injected yet. Open in a browser with MetaMask and reload.'));
    }, timeoutMs);
  });
}

function pickInjectedProvider(eth) {
  try {
    if (eth?.providers?.length) {
      const mm = eth.providers.find(p => p.isMetaMask);
      if (mm) return mm;
      return eth.providers[0];
    }
  } catch {}
  return eth;
}

async function ensureLocalhostNetwork(eth) {
  const LOCAL_CHAIN_ID = '0x7a69';
  const current = await eth.request({ method: 'eth_chainId' });
  if (current === LOCAL_CHAIN_ID) return;
  try {
    await eth.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: LOCAL_CHAIN_ID }] });
  } catch (switchErr) {
    if (switchErr && switchErr.code === 4902) {
      await eth.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: LOCAL_CHAIN_ID,
          chainName: 'Hardhat Localhost 8545',
          nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
          rpcUrls: ['http://127.0.0.1:8545/'],
          blockExplorerUrls: []
        }]
      });
    } else {
      throw switchErr;
    }
  }
}

function attachProviderEvents(eth) {
  try { eth.removeAllListeners?.('accountsChanged'); eth.removeAllListeners?.('chainChanged'); } catch {}
  try {
    eth.on('accountsChanged', async (accounts) => {
      if (accounts && accounts.length > 0) {
        const account = accounts[0];
        const btn = document.getElementById('connectBtn');
        if (btn) btn.textContent = account.slice(0,6) + '...' + account.slice(-4);
      }
    });
    eth.on('chainChanged', () => { window.location.reload(); });
  } catch {}
}

async function connect() {
  try {
    const btn = document.getElementById('connectBtn');
    btn && (btn.disabled = true, btn.textContent = 'Connecting...');

    await ensureEthers();
    const ethRaw = await waitForEthereum();
    const eth = pickInjectedProvider(ethRaw);
    if (!eth) throw new Error('No injected provider found. Install MetaMask.');

    await ensureLocalhostNetwork(eth);

    provider = new ethers.BrowserProvider(eth);
    await provider.send('eth_requestAccounts', []);
    signer = await provider.getSigner();

    const res = await fetch('abi.json', { cache: 'no-cache' });
    if (!res.ok) throw new Error('abi.json not found. Did you run the deploy script?');
    const { address, abi } = await res.json();
    if (!address || !abi) throw new Error('Invalid abi.json format');

    contract = new ethers.Contract(address, abi, signer);

    const account = await signer.getAddress();
    if (btn) btn.textContent = account.slice(0,6) + '...' + account.slice(-4);
    attachProviderEvents(eth);
  } catch (e) {
    alert(parseError(e));
    const btn = document.getElementById('connectBtn');
    if (btn) btn.textContent = 'Connect Wallet';
  } finally {
    const btn = document.getElementById('connectBtn');
    if (btn) btn.disabled = false;
  }
}

async function createProduct() {
  try {
    if (!contract) return alert('Connect wallet first');
    const idRaw = document.getElementById('cpId').value;
    if (!idRaw) return alert('Enter product ID');
    const id = BigInt(idRaw);
    const name = document.getElementById('cpName').value.trim();
    const origin = document.getElementById('cpOrigin').value.trim();
    const overrides = await feeOverrides();
    const tx = await contract.createProduct(id, name, origin, overrides);
    await tx.wait();
    toast('Product created');
  } catch (e) { alert(parseError(e)); }
}

async function shipProduct() {
  try {
    if (!contract) return alert('Connect wallet first');
    const idRaw = document.getElementById('spId').value;
    if (!idRaw) return alert('Enter product ID');
    const id = BigInt(idRaw);
    const overrides = await feeOverrides();
    const tx = await contract.shipProduct(id, overrides);
    await tx.wait();
    toast('Product shipped');
  } catch (e) { alert(parseError(e)); }
}

async function receiveProduct() {
  try {
    if (!contract) return alert('Connect wallet first');
    const idRaw = document.getElementById('rpId').value;
    if (!idRaw) return alert('Enter product ID');
    const id = BigInt(idRaw);
    const overrides = await feeOverrides();
    const tx = await contract.receiveProduct(id, overrides);
    await tx.wait();
    toast('Product received');
  } catch (e) { alert(parseError(e)); }
}

async function trackProduct() {
  try {
    if (!contract) return alert('Connect wallet first');
    const idRaw = document.getElementById('tpId').value;
    if (!idRaw) return alert('Enter product ID');
    const id = BigInt(idRaw);
    const p = await contract.getProduct(id);
    const stateMap = ['Created', 'Shipped', 'Received'];
    const result = {
      id: p[0].toString(),
      name: p[1],
      originFarm: p[2],
      metadataCid: p[3],
      farmer: p[4],
      shipper: p[5],
      receiver: p[6],
      currentOwner: p[7],
      state: stateMap[Number(p[8])],
      createdAt: Number(p[9]),
      shippedAt: Number(p[10]),
      receivedAt: Number(p[11])
    };
    document.getElementById('trackResult').textContent = JSON.stringify(result, null, 2);
  } catch (e) { alert(parseError(e)); }
}

async function generateQR() {
  try {
    const input = document.getElementById('tpId');
    if (!input) { alert('Track input not found'); return; }
    const id = input.value.trim();
    if (!id) { alert('Enter Product ID first'); return; }

    // Ensure QRCode library is available
    if (!window.QRCode) {
      await loadScript('https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js');
      if (!window.QRCode) throw new Error('QR library failed to load');
    }

    const url = `${location.origin}${location.pathname}?productId=${encodeURIComponent(id)}`;
    const qrDiv = document.getElementById('qr');
    if (!qrDiv) { alert('QR container not found'); return; }
    qrDiv.innerHTML = '';
    window.QRCode.toCanvas(url, { width: 180 }, function (err, canvas) {
      if (err) return alert('QR error');
      qrDiv.appendChild(canvas);
    });
  } catch (e) {
    alert(parseError(e));
  }
}

function parseError(e) {
  try { return e?.shortMessage || e?.reason || e?.message || String(e); }
  catch { return 'Transaction failed'; }
}

function toast(message) { console.log(message); }

// ---------- IPFS / Web3.Storage helpers ----------
async function uploadToWeb3Storage() {
  try {
    const token = document.getElementById('w3sToken').value.trim();
    const fileInput = document.getElementById('mdFile');
    if (!token) return alert('Enter Web3.Storage token');
    if (!fileInput || !fileInput.files || fileInput.files.length === 0) return alert('Select a file');
    const file = fileInput.files[0];
    const form = new FormData();
    form.append('file', file);
    const res = await fetch('https://api.web3.storage/upload', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: file
    });
    if (!res.ok) throw new Error('Upload failed');
    const data = await res.json();
    const cid = data?.cid || data?.cid || data?.value?.cid;
    if (!cid) throw new Error('CID not returned');
    document.getElementById('mdCid').value = cid;
    toast('Uploaded. CID set in input.');
  } catch (e) { alert(parseError(e)); }
}

async function setMetadataCid() {
  try {
    if (!contract) return alert('Connect wallet first');
    const idRaw = document.getElementById('mdId').value;
    const cid = document.getElementById('mdCid').value.trim();
    if (!idRaw) return alert('Enter product ID');
    if (!cid) return alert('Enter metadata CID');
    const id = BigInt(idRaw);
    const overrides = await feeOverrides();
    const tx = await contract.setProductMetadataCid(id, cid, overrides);
    await tx.wait();
    toast('Metadata CID set');
  } catch (e) { alert(parseError(e)); }
}

// ---------- Three.js background ----------
let scene, camera, renderer, stars;
function initThree() {
  const canvas = document.getElementById('bg3d');
  if (!canvas || !window.THREE) return;
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 6;

  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const geometry = new THREE.IcosahedronGeometry(2.2, 1);
  const material = new THREE.MeshStandardMaterial({ color: 0x7c3aed, metalness: 0.3, roughness: 0.35, wireframe: true, transparent: true, opacity: 0.35 });
  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  const ambient = new THREE.AmbientLight(0xffffff, 0.6);
  const dir = new THREE.DirectionalLight(0x8b5cf6, 1.2);
  dir.position.set(5,5,5);
  scene.add(ambient, dir);

  const starGeo = new THREE.BufferGeometry();
  const starCount = 600;
  const positions = new Float32Array(starCount * 3);
  for (let i=0;i<starCount;i++) {
    positions[i*3] = (Math.random()-0.5) * 50;
    positions[i*3+1] = (Math.random()-0.5) * 50;
    positions[i*3+2] = (Math.random()-0.5) * 50;
  }
  starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.03 });
  stars = new THREE.Points(starGeo, starMat);
  scene.add(stars);

  function animate() {
    requestAnimationFrame(animate);
    mesh.rotation.y += 0.0025;
    mesh.rotation.x += 0.0015;
    stars.rotation.y += 0.0008;
    renderer.render(scene, camera);
  }
  animate();

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}

window.addEventListener('DOMContentLoaded', init);
