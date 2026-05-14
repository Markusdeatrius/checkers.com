export const createInitialBoard = (): number[][] => {
  const board: number[][] = Array.from({ length: 8 }, () => Array(8).fill(0));

  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 8; col++) {
      if ((row + col) % 2 === 1) board[row][col] = 2;
    }
  }

  for (let row = 5; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      if ((row + col) % 2 === 1) board[row][col] = 1;
    }
  }

  return board;
};

export type Move = {
  from: [number, number];
  to: [number, number];
  playerId: number;
  isKing?: boolean;
};

const inBounds = (x: number, y: number) => x >= 0 && x < 8 && y >= 0 && y < 8;

const getOwner = (piece: number) => {
  if (piece === 1 || piece === 3) return 1;
  if (piece === 2 || piece === 4) return 2;
  return 0;
};

const isKingPiece = (piece: number) => Math.abs(piece) > 2;

const forwardDir = (playerId: number) => (playerId === 1 ? -1 : 1);

const isOpponentPiece = (piece: number, playerId: number) => {
  const owner = getOwner(piece);
  return owner !== 0 && owner !== playerId;
};

export const getCaptureMovesForPiece = (
  board: number[][],
  from: [number, number],
  playerId: number
): Array<{ to: [number, number]; captured: [number, number] }> => {
  const [fx, fy] = from;
  if (!inBounds(fx, fy)) return [];
  const piece = board[fx][fy];
  if (!piece || getOwner(piece) !== playerId) return [];

  const moves: Array<{ to: [number, number]; captured: [number, number] }> = [];
  const king = isKingPiece(piece);
  const forward = forwardDir(playerId);
  const directions: Array<[number, number]> = king
    ? ([ [1, 1], [1, -1], [-1, 1], [-1, -1] ] as const)
    : ([ [forward * 2, 2], [forward * 2, -2] ] as const);

  if (!king) {
    for (const [dx, dy] of directions) {
      const mx = fx + dx / 2;
      const my = fy + dy / 2;
      const tx = fx + dx;
      const ty = fy + dy;

      if (!inBounds(mx, my) || !inBounds(tx, ty)) continue;
      if (board[tx][ty] !== 0) continue;
      if (isOpponentPiece(board[mx][my], playerId)) {
        moves.push({ to: [tx, ty], captured: [mx, my] });
      }
    }

    return moves;
  }

  for (const [dx, dy] of directions) {
    let x = fx + dx;
    let y = fy + dy;
    let opponentFound: [number, number] | null = null;

    while (inBounds(x, y)) {
      const current = board[x][y];
      if (current === 0) {
        if (opponentFound) {
          moves.push({ to: [x, y], captured: opponentFound });
        }
        x += dx;
        y += dy;
        continue;
      }

      if (isOpponentPiece(current, playerId) && !opponentFound) {
        opponentFound = [x, y];
        x += dx;
        y += dy;
        continue;
      }

      break;
    }
  }

  return moves;
};

export const getAllCaptureMoves = (
  board: number[][],
  playerId: number
): Array<{ from: [number, number]; to: [number, number]; captured: [number, number] }> => {
  const moves: Array<{ from: [number, number]; to: [number, number]; captured: [number, number] }> = [];

  for (let x = 0; x < 8; x++) {
    for (let y = 0; y < 8; y++) {
      if (getOwner(board[x][y]) !== playerId) continue;
      const captures = getCaptureMovesForPiece(board, [x, y], playerId);
      for (const move of captures) {
        moves.push({ from: [x, y], to: move.to, captured: move.captured });
      }
    }
  }

  return moves;
};

export const hasAnyCapture = (board: number[][], playerId: number): boolean => {
  return getAllCaptureMoves(board, playerId).length > 0;
};

// NOVÁ FUNKCE: Pro vygenerování běžných (neskákacích) tahů pro frontend.
// Dáma (king) nyní správně projde celou diagonálu jako střelec v šachách.
export const getNormalMovesForPiece = (
  board: number[][],
  from: [number, number],
  playerId: number
): Array<{ to: [number, number] }> => {
  const [fx, fy] = from;
  if (!inBounds(fx, fy)) return [];
  const piece = board[fx][fy];
  if (!piece || getOwner(piece) !== playerId) return [];

  const moves: Array<{ to: [number, number] }> = [];
  const king = isKingPiece(piece);
  const forward = forwardDir(playerId);
  const directions: Array<[number, number]> = king
    ? [[1, 1], [1, -1], [-1, 1], [-1, -1]]
    : [[forward, 1], [forward, -1]];

  if (king) {
    for (const [dx, dy] of directions) {
      let x = fx + dx;
      let y = fy + dy;
      while (inBounds(x, y)) {
        if (board[x][y] === 0) {
          moves.push({ to: [x, y] });
          x += dx;
          y += dy;
        } else {
          break; // Zablokováno jinou figurkou
        }
      }
    }
  } else {
    for (const [dx, dy] of directions) {
      const x = fx + dx;
      const y = fy + dy;
      if (inBounds(x, y) && board[x][y] === 0) {
        moves.push({ to: [x, y] });
      }
    }
  }

  return moves;
};

export const validateMove = (
  board: number[][],
  move: Move,
  playerId: number
): { valid: boolean; captured?: [number, number][]; huffed?: [number, number][]; mustJump: boolean } => {
  const [fx, fy] = move.from;
  const [tx, ty] = move.to;
  if (!inBounds(fx, fy) || !inBounds(tx, ty)) return { valid: false, mustJump: false };

  const piece = board[fx][fy];
  if (!piece || getOwner(piece) !== playerId) return { valid: false, mustJump: false };
  if (board[tx][ty] !== 0) return { valid: false, mustJump: false };

  const king = move.isKing ?? isKingPiece(piece);
  const dx = tx - fx;
  const dy = ty - fy;
  if (Math.abs(dx) !== Math.abs(dy) || dx === 0) return { valid: false, mustJump: false };

  const captureMoves = getAllCaptureMoves(board, playerId);
  const mustJump = captureMoves.length > 0;
  const huffed: [number, number][] = [];
  if (mustJump) {
    const seen = new Set<string>();
    for (const capture of captureMoves) {
      const key = `${capture.from[0]}_${capture.from[1]}`;
      if (!seen.has(key)) {
        seen.add(key);
        huffed.push(capture.from);
      }
    }
  }

  const forward = forwardDir(playerId);

  if (king) {
    let capturedPiece: [number, number] | null = null;
    let x = fx + Math.sign(dx);
    let y = fy + Math.sign(dy);

    while (x !== tx && y !== ty) {
      const current = board[x][y];
      if (current === 0) {
        x += Math.sign(dx);
        y += Math.sign(dy);
        continue;
      }

      if (isOpponentPiece(current, playerId) && !capturedPiece) {
        capturedPiece = [x, y];
        x += Math.sign(dx);
        y += Math.sign(dy);
        continue;
      }

      return { valid: false, mustJump };
    }

    if (capturedPiece) {
      return { valid: true, captured: [capturedPiece], mustJump };
    }

    return { valid: true, huffed: mustJump ? huffed : undefined, mustJump };
  }

  const absDx = Math.abs(dx);
  if (absDx === 1 && Math.abs(dy) === 1) {
    if (dx !== forward) return { valid: false, mustJump };
    return { valid: true, huffed: mustJump ? huffed : undefined, mustJump };
  }

  if (absDx === 2 && Math.abs(dy) === 2) {
    if (dx !== forward * 2) return { valid: false, mustJump };
    const mx = fx + Math.sign(dx);
    const my = fy + Math.sign(dy);
    if (!inBounds(mx, my)) return { valid: false, mustJump };
    if (isOpponentPiece(board[mx][my], playerId)) {
      return { valid: true, captured: [[mx, my]], mustJump };
    }
  }

  return { valid: false, mustJump };
};

export const applyMove = (
  board: number[][],
  from: [number, number],
  to: [number, number],
  captured?: [number, number][],
  huffed?: [number, number][]
): number[][] => {
  const newBoard = board.map((row) => [...row]);
  const [fx, fy] = from;
  const [tx, ty] = to;
  const piece = newBoard[fx][fy];
  newBoard[fx][fy] = 0;
  newBoard[tx][ty] = piece;

  if (captured) {
    captured.forEach(([x, y]) => {
      if (inBounds(x, y)) newBoard[x][y] = 0;
    });
  }

  let movedPieceHuffed = false;
  if (huffed) {
    for (const [x, y] of huffed) {
      if (!inBounds(x, y)) continue;
      if (x === fx && y === fy) {
        movedPieceHuffed = true;
      }
      newBoard[x][y] = 0;
    }
  }

  if (movedPieceHuffed) {
    newBoard[tx][ty] = 0;
  } else {
    if (piece === 1 && tx === 0) newBoard[tx][ty] = 3;
    if (piece === 2 && tx === 7) newBoard[tx][ty] = 4;
  }

  return newBoard;
};

export const hasPiecesLeft = (board: number[][], playerId: number): boolean => {
  for (const row of board) {
    for (const cell of row) {
      if (cell === playerId || cell === playerId + 2) {
        return true;
      }
    }
  }

  return false;
};

export const hasValidMoves = (
  board: number[][],
  playerId: number
): boolean => {
  const ownerPieces = board.flatMap((row, x) =>
    row
      .map((cell, y) => ({ cell, x, y }))
      .filter(({ cell }) => getOwner(cell) === playerId)
  );

  for (const { cell, x, y } of ownerPieces) {
    const king = isKingPiece(cell);
    const simpleDirections: Array<[number, number]> = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
    const forward = forwardDir(playerId);

    for (const [dx, dy] of simpleDirections) {
      const nx = x + dx;
      const ny = y + dy;
      if (inBounds(nx, ny)) {
        if (board[nx][ny] === 0) {
          if (king || dx === forward) return true;
        }
      }

      const jumpX = x + dx * 2;
      const jumpY = y + dy * 2;
      if (!inBounds(jumpX, jumpY)) continue;
      const enemyX = x + dx;
      const enemyY = y + dy;
      if (!inBounds(enemyX, enemyY)) continue;

      if (
        board[jumpX][jumpY] === 0 &&
        isOpponentPiece(board[enemyX][enemyY], playerId) &&
        (king || dx === forward) // Opraveno z forward * 2
      ) {
        return true;
      }
    }

    if (king) {
      for (const [dx, dy] of simpleDirections) {
        let nx = x + dx;
        let ny = y + dy;
        let opponentFound = false;

        while (inBounds(nx, ny)) {
          const current = board[nx][ny];
          if (current === 0) {
            if (opponentFound) return true;
            nx += dx;
            ny += dy;
            continue;
          }

          if (!opponentFound && isOpponentPiece(current, playerId)) {
            opponentFound = true;
            nx += dx;
            ny += dy;
            continue;
          }

          break;
        }
      }
    }
  }

  return false;
};