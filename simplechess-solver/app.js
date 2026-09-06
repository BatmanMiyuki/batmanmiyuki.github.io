import { Chess } from './lib/chess/chess.js';
import { SIMPLECHESS_TEMPLATES } from './lib/simplechess-templates.js';

const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const pieceSymbols = {
  wK: '♔', wQ: '♕', wR: '♖', wB: '♗', wN: '♘', wP: '♙',
  bK: '♚', bQ: '♛', bR: '♜', bB: '♝', bN: '♞', bP: '♟︎',
};
const pieceNames = {
  wK: 'roi blanc', wQ: 'dame blanche', wR: 'tour blanche', wB: 'fou blanc', wN: 'cavalier blanc', wP: 'pion blanc',
  bK: 'roi noir', bQ: 'dame noire', bR: 'tour noire', bB: 'fou noir', bN: 'cavalier noir', bP: 'pion noir',
};
const pieceOrder = ['wK', 'wQ', 'wR', 'wB', 'wN', 'wP', 'bK', 'bQ', 'bR', 'bB', 'bN', 'bP'];
const pieceToFen = {
  wK: 'K', wQ: 'Q', wR: 'R', wB: 'B', wN: 'N', wP: 'P',
  bK: 'k', bQ: 'q', bR: 'r', bB: 'b', bN: 'n', bP: 'p',
};
const fenToPiece = Object.fromEntries(Object.entries(pieceToFen).map(([key, value]) => [value, key]));
const templateMasks = Object.fromEntries(
  Object.entries(SIMPLECHESS_TEMPLATES).map(([label, bits]) => [label, Uint8Array.from(bits, (char) => Number(char))]),
);

const boardEl = document.getElementById('board');
const piecePaletteEl = document.getElementById('piecePalette');
const fenOutput = document.getElementById('fenOutput');
const sideToMoveEl = document.getElementById('sideToMove');
const epSquareEl = document.getElementById('epSquare');
const statusBox = document.getElementById('statusBox');
const detectionBox = document.getElementById('detectionBox');
const bestMoveText = document.getElementById('bestMoveText');
const sanMoveText = document.getElementById('sanMoveText');
const evalText = document.getElementById('evalText');
const pvText = document.getElementById('pvText');
const previewImage = document.getElementById('previewImage');
const imagePlaceholder = document.getElementById('imagePlaceholder');
const zoomRange = document.getElementById('zoomRange');

const boardState = Array.from({ length: 8 }, () => Array(8).fill(null));
const reviewSquares = new Set();
let orientation = 'white';
let selectedTool = 'wP';
let imageRotation = 0;
let imageZoom = 1;
let engineWorker = null;
let engineReady = false;
let engineReadyResolver = null;
let currentSearch = null;
let uploadedImage = null;
let uploadedImageUrl = '';

function setStatus(message, kind = 'info') {
  statusBox.textContent = message;
  statusBox.className = `status ${kind}`;
}

function setDetection(message, kind = 'subtle') {
  detectionBox.textContent = message;
  detectionBox.className = `status ${kind}`;
}

function squareName(row, col) {
  return `${files[col]}${8 - row}`;
}

function visualToActual(vRow, vCol) {
  return orientation === 'white'
    ? [vRow, vCol]
    : [7 - vRow, 7 - vCol];
}

function screenshotVisualToActual(vRow, vCol) {
  return sideToMoveEl.value === 'w'
    ? [vRow, vCol]
    : [7 - vRow, 7 - vCol];
}

function renderPieceMarkup(piece) {
  if (!piece) return '';
  const colorClass = piece.startsWith('w') ? 'piece-white' : 'piece-black';
  return `<span class="piece ${colorClass}" aria-hidden="true">${pieceSymbols[piece]}</span>`;
}

function createPalette() {
  piecePaletteEl.innerHTML = '';
  for (const piece of pieceOrder) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'piece-btn';
    button.dataset.piece = piece;
    button.innerHTML = renderPieceMarkup(piece);
    button.title = pieceNames[piece];
    button.setAttribute('aria-label', pieceNames[piece]);
    button.addEventListener('click', () => {
      selectedTool = piece;
      renderPalette();
    });
    piecePaletteEl.appendChild(button);
  }
}

function renderPalette() {
  piecePaletteEl.querySelectorAll('.piece-btn').forEach((button) => {
    button.classList.toggle('active', button.dataset.piece === selectedTool);
  });
  document.getElementById('eraserBtn').classList.toggle('active', selectedTool === 'erase');
}

function renderBoard() {
  boardEl.innerHTML = '';
  for (let vRow = 0; vRow < 8; vRow += 1) {
    for (let vCol = 0; vCol < 8; vCol += 1) {
      const [row, col] = visualToActual(vRow, vCol);
      const coord = squareName(row, col);
      const piece = boardState[row][col];
      const square = document.createElement('button');
      square.type = 'button';
      square.className = `square ${(vRow + vCol) % 2 === 0 ? 'light' : 'dark'}${reviewSquares.has(coord) ? ' review' : ''}`;
      square.dataset.coord = coord;
      square.title = piece ? `${coord} · ${pieceNames[piece]}` : coord;
      square.innerHTML = renderPieceMarkup(piece);
      square.addEventListener('click', () => {
        boardState[row][col] = selectedTool === 'erase' ? null : selectedTool;
        reviewSquares.delete(coord);
        renderBoard();
        syncFen();
      });
      square.addEventListener('contextmenu', (event) => {
        event.preventDefault();
        boardState[row][col] = null;
        reviewSquares.delete(coord);
        renderBoard();
        syncFen();
      });
      boardEl.appendChild(square);
    }
  }
}

function clearReviewSquares() {
  reviewSquares.clear();
}

function clearBoard(clearReviews = true) {
  for (let row = 0; row < 8; row += 1) {
    for (let col = 0; col < 8; col += 1) {
      boardState[row][col] = null;
    }
  }
  if (clearReviews) clearReviewSquares();
}

function clearCastlingAndEp() {
  document.getElementById('castleK').checked = false;
  document.getElementById('castleQ').checked = false;
  document.getElementById('castlek').checked = false;
  document.getElementById('castleq').checked = false;
  epSquareEl.value = '';
}

function loadStartPosition() {
  loadFenToBoard('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', true);
}

function parseFenParts(fen) {
  const parts = fen.trim().split(/\s+/);
  if (!parts[0]) throw new Error('FEN vide.');
  return {
    boardPart: parts[0],
    side: parts[1] || 'w',
    castling: parts[2] || '-',
    ep: parts[3] || '-',
  };
}

function generateFen() {
  const fenRows = [];
  for (let row = 0; row < 8; row += 1) {
    let rowFen = '';
    let empty = 0;
    for (let col = 0; col < 8; col += 1) {
      const piece = boardState[row][col];
      if (!piece) {
        empty += 1;
        continue;
      }
      if (empty > 0) {
        rowFen += empty;
        empty = 0;
      }
      rowFen += pieceToFen[piece];
    }
    if (empty > 0) rowFen += empty;
    fenRows.push(rowFen || '8');
  }

  const castling = [
    document.getElementById('castleK').checked ? 'K' : '',
    document.getElementById('castleQ').checked ? 'Q' : '',
    document.getElementById('castlek').checked ? 'k' : '',
    document.getElementById('castleq').checked ? 'q' : '',
  ].join('') || '-';

  const side = sideToMoveEl.value;
  const ep = (epSquareEl.value.trim().toLowerCase() || '-');
  return `${fenRows.join('/')} ${side} ${castling} ${ep} 0 1`;
}

function syncFen() {
  fenOutput.value = generateFen();
  saveState();
}

function loadFenToBoard(fen, updateControls = false, strict = false) {
  let normalizedFen = fen;
  if (strict) {
    try {
      normalizedFen = new Chess(fen).fen();
    } catch (error) {
      throw new Error(`FEN invalide : ${error.message}`);
    }
  }

  const { boardPart, side, castling, ep } = parseFenParts(normalizedFen);
  const ranks = boardPart.split('/');
  if (ranks.length !== 8) throw new Error('FEN invalide : il faut 8 rangées.');

  clearBoard();
  ranks.forEach((rank, row) => {
    let col = 0;
    for (const char of rank) {
      if (/\d/.test(char)) {
        col += Number(char);
      } else {
        if (!fenToPiece[char]) throw new Error(`FEN invalide : pièce inconnue '${char}'.`);
        boardState[row][col] = fenToPiece[char];
        col += 1;
      }
    }
    if (col !== 8) throw new Error(`FEN invalide : la rangée ${8 - row} ne fait pas 8 cases.`);
  });

  if (updateControls) {
    sideToMoveEl.value = side === 'b' ? 'b' : 'w';
    document.getElementById('castleK').checked = castling.includes('K');
    document.getElementById('castleQ').checked = castling.includes('Q');
    document.getElementById('castlek').checked = castling.includes('k');
    document.getElementById('castleq').checked = castling.includes('q');
    epSquareEl.value = ep === '-' ? '' : ep;
  }

  renderBoard();
  syncFen();
}

function applyImageTransform() {
  previewImage.style.transform = `rotate(${imageRotation}deg) scale(${imageZoom})`;
}

function copyFen() {
  navigator.clipboard.writeText(fenOutput.value).then(() => {
    setStatus('FEN copiée dans le presse-papiers.', 'success');
  }).catch(() => {
    setStatus('Impossible de copier automatiquement. Tu peux copier la FEN à la main.', 'error');
  });
}

function formatScore(infoLine) {
  if (!infoLine) return '—';
  const mateMatch = infoLine.match(/score mate (-?\d+)/);
  if (mateMatch) {
    const mate = Number(mateMatch[1]);
    return mate > 0 ? `Mat en ${mate}` : `Mat subi en ${Math.abs(mate)}`;
  }
  const cpMatch = infoLine.match(/score cp (-?\d+)/);
  if (cpMatch) return `${(Number(cpMatch[1]) / 100).toFixed(2)}`;
  return '—';
}

function uciToMove(uci) {
  return {
    from: uci.slice(0, 2),
    to: uci.slice(2, 4),
    ...(uci[4] ? { promotion: uci[4] } : {}),
  };
}

function pvUciToSan(fen, pvUci) {
  if (!pvUci) return '—';
  const chess = new Chess(fen);
  const moves = [];
  for (const uci of pvUci.trim().split(/\s+/).slice(0, 12)) {
    if (!uci || uci === '(none)') break;
    const played = chess.move(uciToMove(uci));
    if (!played) break;
    moves.push(played.san);
  }
  return moves.length ? moves.join(' ') : '—';
}

function parseInfoForPv(infoLine) {
  const pvMatch = infoLine.match(/\spv\s(.+)$/);
  return pvMatch ? pvMatch[1].trim() : '';
}

function ensureEngine() {
  if (engineReady && engineWorker) return Promise.resolve();

  if (engineWorker && !engineReady) {
    return new Promise((resolve) => {
      const check = setInterval(() => {
        if (engineReady) {
          clearInterval(check);
          resolve();
        }
      }, 50);
    });
  }

  return new Promise((resolve, reject) => {
    engineReadyResolver = resolve;
    try {
      engineWorker = new Worker('./lib/stockfish/stockfish-18-lite-single.js');
    } catch (error) {
      reject(error);
      return;
    }

    engineWorker.onmessage = (event) => {
      const line = String(event.data || '').trim();
      if (!line) return;

      if (line === 'readyok') {
        engineReady = true;
        engineReadyResolver?.();
        return;
      }

      if (currentSearch && line.startsWith('info depth')) {
        currentSearch.lastInfo = line;
        const pv = parseInfoForPv(line);
        if (pv) currentSearch.lastPv = pv;
      }

      if (currentSearch && line.startsWith('bestmove')) {
        const match = line.match(/^bestmove\s(\S+)/);
        const bestmove = match?.[1] ?? '(none)';
        currentSearch.resolve({
          bestmove,
          infoLine: currentSearch.lastInfo,
          pvUci: currentSearch.lastPv,
        });
        currentSearch = null;
      }
    };

    engineWorker.onerror = (error) => reject(error);
    engineWorker.postMessage('uci');
    engineWorker.postMessage('isready');
  });
}

async function analyzePosition() {
  const fen = generateFen();
  let chess;
  try {
    chess = new Chess(fen);
  } catch (error) {
    setStatus(`Position invalide : ${error.message}`, 'error');
    return;
  }

  try {
    setStatus('Chargement du moteur…', 'info');
    await ensureEngine();
    setStatus('Analyse en cours…', 'info');

    const result = await new Promise((resolve) => {
      currentSearch = { resolve, lastInfo: '', lastPv: '' };
      engineWorker.postMessage('stop');
      engineWorker.postMessage('ucinewgame');
      engineWorker.postMessage(`position fen ${chess.fen()}`);
      engineWorker.postMessage('setoption name MultiPV value 1');
      engineWorker.postMessage('go depth 14');
    });

    if (!result.bestmove || result.bestmove === '(none)') {
      setStatus('Aucun coup trouvé. Vérifie la position.', 'error');
      return;
    }

    const played = chess.move(uciToMove(result.bestmove));
    if (!played) {
      setStatus('Le moteur a renvoyé un coup illégal pour cette position. Vérifie le trait et les roques.', 'error');
      return;
    }

    bestMoveText.textContent = result.bestmove;
    sanMoveText.textContent = played.san;
    evalText.textContent = formatScore(result.infoLine);
    pvText.textContent = pvUciToSan(generateFen(), result.pvUci);
    setStatus(`Analyse terminée. Coup conseillé : ${played.san}`, 'success');
  } catch (error) {
    console.error(error);
    setStatus('Impossible de lancer le moteur dans cet aperçu. Essaie de recharger la page.', 'error');
  }
}

function saveState() {
  const payload = {
    fen: generateFen(),
    orientation,
    selectedTool,
    imageRotation,
    imageZoom,
  };
  localStorage.setItem('chess-photo-solver-state', JSON.stringify(payload));
}

function restoreState() {
  const raw = localStorage.getItem('chess-photo-solver-state');
  if (!raw) {
    loadFenToBoard('8/8/8/8/8/8/8/8 w - - 0 1', true);
    return;
  }
  try {
    const payload = JSON.parse(raw);
    orientation = payload.orientation || 'white';
    selectedTool = payload.selectedTool || 'wP';
    imageRotation = Number(payload.imageRotation || 0);
    imageZoom = Number(payload.imageZoom || 1);
    zoomRange.value = String(imageZoom);
    loadFenToBoard(payload.fen || '8/8/8/8/8/8/8/8 w - - 0 1', true);
    applyImageTransform();
    renderPalette();
  } catch {
    loadFenToBoard('8/8/8/8/8/8/8/8 w - - 0 1', true);
  }
}

function buildProcessingCanvas() {
  if (!uploadedImage) return null;
  const rotation = ((imageRotation % 360) + 360) % 360;
  const sourceWidth = uploadedImage.naturalWidth || uploadedImage.width;
  const sourceHeight = uploadedImage.naturalHeight || uploadedImage.height;
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d', { willReadFrequently: true });

  if (rotation === 90 || rotation === 270) {
    canvas.width = sourceHeight;
    canvas.height = sourceWidth;
  } else {
    canvas.width = sourceWidth;
    canvas.height = sourceHeight;
  }

  context.save();
  if (rotation === 90) {
    context.translate(canvas.width, 0);
    context.rotate(Math.PI / 2);
  } else if (rotation === 180) {
    context.translate(canvas.width, canvas.height);
    context.rotate(Math.PI);
  } else if (rotation === 270) {
    context.translate(0, canvas.height);
    context.rotate(-Math.PI / 2);
  }
  context.drawImage(uploadedImage, 0, 0);
  context.restore();

  return { context, width: canvas.width, height: canvas.height };
}

function isSimpleChessRed(r, g, b) {
  return r > 230 && g < 80 && b < 110 && (r - g) > 140;
}

function isGreenArrow(r, g, b) {
  return g > 80 && g > r + 20 && g > b + 20;
}

function detectBoardBounds(imageData, width, height) {
  const startX = Math.floor(width * 0.04);
  const endX = Math.floor(width * 0.62);
  const startY = Math.floor(height * 0.12);
  const endY = Math.floor(height * 0.93);

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -1;
  let maxY = -1;

  for (let y = startY; y < endY; y += 1) {
    for (let x = startX; x < endX; x += 1) {
      const index = (y * width + x) * 4;
      const r = imageData[index];
      const g = imageData[index + 1];
      const b = imageData[index + 2];
      if (!isSimpleChessRed(r, g, b)) continue;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }

  if (!Number.isFinite(minX)) return null;

  const rawWidth = maxX - minX + 1;
  const rawHeight = maxY - minY + 1;
  const side = Math.round((rawWidth + rawHeight) / 2);
  if (side < 300) return null;

  return { x: minX, y: minY, w: side, h: side };
}

function getSquareBounds(bounds, vRow, vCol) {
  const cellWidth = bounds.w / 8;
  const cellHeight = bounds.h / 8;
  const marginX = Math.max(2, Math.round(cellWidth * 0.035));
  const marginY = Math.max(2, Math.round(cellHeight * 0.035));
  const x0 = Math.round(bounds.x + vCol * cellWidth + marginX);
  const x1 = Math.round(bounds.x + (vCol + 1) * cellWidth - marginX);
  const y0 = Math.round(bounds.y + vRow * cellHeight + marginY);
  const y1 = Math.round(bounds.y + (vRow + 1) * cellHeight - marginY);
  return { x0, x1, y0, y1, width: x1 - x0, height: y1 - y0 };
}

function getExpectedSquareColor(vRow, vCol) {
  return (vRow + vCol) % 2 === 0 ? [255, 255, 255] : [255, 0, 33];
}

function sampleSquare(imageData, boardWidth, bounds, vRow, vCol) {
  const { x0, x1, y0, y1, width, height } = getSquareBounds(bounds, vRow, vCol);
  const pixels = new Uint8ClampedArray(width * height * 4);
  let pointer = 0;

  for (let y = y0; y < y1; y += 1) {
    for (let x = x0; x < x1; x += 1) {
      const src = (y * boardWidth + x) * 4;
      pixels[pointer] = imageData[src];
      pixels[pointer + 1] = imageData[src + 1];
      pixels[pointer + 2] = imageData[src + 2];
      pixels[pointer + 3] = imageData[src + 3];
      pointer += 4;
    }
  }

  return { pixels, width, height };
}

function normalizeMask(mask, width, height, targetSize = 32) {
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (!mask[y * width + x]) continue;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }

  const output = new Uint8Array(targetSize * targetSize);
  if (maxX < minX || maxY < minY) return output;

  const cropWidth = maxX - minX + 1;
  const cropHeight = maxY - minY + 1;
  const scale = Math.min((targetSize - 4) / cropWidth, (targetSize - 4) / cropHeight);
  const placedWidth = Math.max(1, Math.round(cropWidth * scale));
  const placedHeight = Math.max(1, Math.round(cropHeight * scale));
  const offsetX = Math.floor((targetSize - placedWidth) / 2);
  const offsetY = Math.floor((targetSize - placedHeight) / 2);

  for (let dy = 0; dy < placedHeight; dy += 1) {
    const sy = Math.min(cropHeight - 1, Math.floor(dy / scale));
    for (let dx = 0; dx < placedWidth; dx += 1) {
      const sx = Math.min(cropWidth - 1, Math.floor(dx / scale));
      const sourceIndex = (minY + sy) * width + (minX + sx);
      if (!mask[sourceIndex]) continue;
      output[(offsetY + dy) * targetSize + (offsetX + dx)] = 1;
    }
  }

  return output;
}

function computeIoU(maskA, maskB) {
  let intersection = 0;
  let union = 0;
  for (let index = 0; index < maskA.length; index += 1) {
    const a = maskA[index];
    const b = maskB[index];
    if (a || b) union += 1;
    if (a && b) intersection += 1;
  }
  return union ? intersection / union : 0;
}

function classifySquare(sample, vRow, vCol) {
  const [bgR, bgG, bgB] = getExpectedSquareColor(vRow, vCol);
  const mask = new Uint8Array(sample.width * sample.height);
  let activeCount = 0;
  let graySum = 0;

  for (let index = 0, pixel = 0; pixel < sample.pixels.length; pixel += 4, index += 1) {
    const r = sample.pixels[pixel];
    const g = sample.pixels[pixel + 1];
    const b = sample.pixels[pixel + 2];
    if (isGreenArrow(r, g, b)) continue;
    const diff = Math.hypot(r - bgR, g - bgG, b - bgB);
    if (diff <= 35) continue;
    mask[index] = 1;
    activeCount += 1;
    graySum += (0.299 * r) + (0.587 * g) + (0.114 * b);
  }

  const occupancyThreshold = sample.width * sample.height * 0.05;
  if (activeCount < occupancyThreshold) return null;

  const colorPrefix = (graySum / activeCount) > 100 ? 'w' : 'b';
  const normalized = normalizeMask(mask, sample.width, sample.height, 32);

  const ranked = Object.entries(templateMasks)
    .filter(([label]) => label.startsWith(colorPrefix))
    .map(([label, template]) => ({ label, score: computeIoU(normalized, template) }))
    .sort((left, right) => right.score - left.score);

  const best = ranked[0];
  const second = ranked[1];
  if (!best) return null;

  const needsReview = best.score < 0.88 || (second && (best.score - second.score) < 0.045);
  return {
    label: best.label,
    confidence: best.score,
    needsReview,
  };
}

function summarizeDetectedPieces(counts) {
  return Object.entries(counts)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([label, count]) => `${label}×${count}`)
    .join(' · ');
}

async function autoDetectSimpleChessPosition() {
  if (!uploadedImage) {
    setStatus('Ajoute d’abord une image.', 'error');
    return;
  }

  try {
    setStatus('Détection SimpleChess en cours…', 'info');
    const rendered = buildProcessingCanvas();
    if (!rendered) throw new Error('Image introuvable.');
    const imageData = rendered.context.getImageData(0, 0, rendered.width, rendered.height).data;
    const bounds = detectBoardBounds(imageData, rendered.width, rendered.height);

    if (!bounds) {
      throw new Error('Plateau introuvable. Essaie avec une capture SimpleChess plus nette.');
    }

    clearBoard();
    clearCastlingAndEp();
    clearReviewSquares();
    orientation = sideToMoveEl.value === 'b' ? 'black' : 'white';

    let detectedPieces = 0;
    let confidenceSum = 0;
    const reviewList = [];
    const pieceCounts = {};

    for (let vRow = 0; vRow < 8; vRow += 1) {
      for (let vCol = 0; vCol < 8; vCol += 1) {
        const sample = sampleSquare(imageData, rendered.width, bounds, vRow, vCol);
        const result = classifySquare(sample, vRow, vCol);
        if (!result) continue;

        const [row, col] = screenshotVisualToActual(vRow, vCol);
        const coord = squareName(row, col);
        boardState[row][col] = result.label;
        detectedPieces += 1;
        confidenceSum += result.confidence;
        pieceCounts[result.label] = (pieceCounts[result.label] || 0) + 1;

        if (result.needsReview) {
          reviewSquares.add(coord);
          reviewList.push(coord);
        }
      }
    }

    renderBoard();
    syncFen();

    const averageConfidence = detectedPieces ? Math.round((confidenceSum / detectedPieces) * 100) : 0;
    const reviewText = reviewList.length ? ` Vérifie surtout : ${reviewList.join(', ')}.` : '';
    const breakdown = summarizeDetectedPieces(pieceCounts);

    setStatus(`Détection terminée : ${detectedPieces} pièces placées · confiance moyenne ${averageConfidence}%.`, 'success');
    setDetection(`Templates SimpleChess : ${Object.keys(templateMasks).length} types de pièces couverts. ${breakdown || 'Aucune pièce détectée.'}.${reviewText}`, reviewList.length ? 'info' : 'success');
  } catch (error) {
    console.error(error);
    setStatus(error.message || 'Erreur pendant la détection automatique.', 'error');
    setDetection('Détection automatique non aboutie.', 'error');
  }
}

async function loadSelectedImage(file) {
  if (uploadedImageUrl) URL.revokeObjectURL(uploadedImageUrl);
  uploadedImageUrl = URL.createObjectURL(file);
  const image = new Image();
  image.src = uploadedImageUrl;
  await image.decode();
  uploadedImage = image;
  previewImage.src = uploadedImageUrl;
  previewImage.hidden = false;
  imagePlaceholder.hidden = true;
  setStatus(`Image chargée : ${file.name}`, 'success');
  setDetection('Image prête. Tu peux lancer l’auto-remplissage SimpleChess.', 'info');
}

function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch((error) => {
      console.error('Service worker non enregistré', error);
    });
  });
}

function attachEvents() {
  document.getElementById('flipBoardBtn').addEventListener('click', () => {
    orientation = orientation === 'white' ? 'black' : 'white';
    renderBoard();
    saveState();
  });

  document.getElementById('eraserBtn').addEventListener('click', () => {
    selectedTool = 'erase';
    renderPalette();
  });

  document.getElementById('clearBoardBtn').addEventListener('click', () => {
    clearBoard();
    renderBoard();
    syncFen();
    setStatus('Échiquier vidé.', 'info');
    setDetection('Plateau vidé. Les cases à vérifier ont été effacées.', 'subtle');
  });

  document.getElementById('startPosBtn').addEventListener('click', () => {
    loadStartPosition();
    setStatus('Position de départ chargée.', 'success');
    setDetection('Mode manuel actif.', 'subtle');
  });

  document.getElementById('copyFenBtn').addEventListener('click', copyFen);

  document.getElementById('loadFenBtn').addEventListener('click', () => {
    try {
      loadFenToBoard(fenOutput.value.trim(), true, true);
      setStatus('FEN chargée.', 'success');
      setDetection('FEN importée. Vérification automatique réinitialisée.', 'subtle');
    } catch (error) {
      setStatus(error.message, 'error');
    }
  });

  document.getElementById('analyzeBtn').addEventListener('click', analyzePosition);
  document.getElementById('autoDetectBtn').addEventListener('click', autoDetectSimpleChessPosition);

  [
    sideToMoveEl,
    epSquareEl,
    document.getElementById('castleK'),
    document.getElementById('castleQ'),
    document.getElementById('castlek'),
    document.getElementById('castleq'),
  ].forEach((element) => element.addEventListener('input', syncFen));

  document.getElementById('imageInput').addEventListener('change', async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      await loadSelectedImage(file);
    } catch (error) {
      console.error(error);
      setStatus('Impossible de lire cette image.', 'error');
      setDetection('Aucune image exploitable pour le moment.', 'error');
    }
  });

  document.getElementById('rotateLeftBtn').addEventListener('click', () => {
    imageRotation -= 90;
    applyImageTransform();
    saveState();
  });

  document.getElementById('rotateRightBtn').addEventListener('click', () => {
    imageRotation += 90;
    applyImageTransform();
    saveState();
  });

  zoomRange.addEventListener('input', () => {
    imageZoom = Number(zoomRange.value);
    applyImageTransform();
    saveState();
  });

  fenOutput.addEventListener('change', saveState);
}

createPalette();
restoreState();
renderPalette();
renderBoard();
attachEvents();
applyImageTransform();
syncFen();
registerServiceWorker();
setStatus('Prêt. Charge une capture puis teste “Auto-remplir depuis screenshot SimpleChess”.', 'info');
setDetection(`Pack de templates chargé : ${Object.keys(templateMasks).length} types de pièces SimpleChess.`, 'subtle');
