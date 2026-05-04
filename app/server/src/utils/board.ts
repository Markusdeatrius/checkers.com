export const createInitialBoard = (): number[][] => {
  const board: number[][] = Array(8).fill(null).map(() => Array(8).fill(0));

  for (let row = 0; row < 3; row++)
    for (let col = 0; col < 8; col++)
      if ((row + col) % 2 === 1) board[row][col] = 2;

  for (let row = 5; row < 8; row++)
    for (let col = 0; col < 8; col++)
      if ((row + col) % 2 === 1) board[row][col] = 1;

  return board;
};

export type Move = {
  from: [number, number];
  to: [number, number];
  playerId: number;
  isKing?: boolean;
};

export const validateMove = (
  board: number[][],
  move: Move,
  playerId: number
): { valid: boolean; captured?: [number, number][]; mustJump: boolean } => {
  const [fx, fy] = move.from;
  const [tx, ty] = move.to;
  const piece = board[fx][fy];
  if (!piece || Math.abs(piece) !== playerId && Math.abs(piece) <= 2) return { valid: false, mustJump: false };

  const dx = tx - fx;
  const dy = ty - fy;
  const opponent = playerId === 1 ? 2 : 1;
  const captures: [number, number][] = [];
  let mustJump = false;

  // Najdi všechny povinné skoky na desce
  for (let x = 0; x < 8; x++) {
    for (let y = 0; y < 8; y++) {
      if (Math.abs(board[x][y]) === playerId) {
        const dirs = [[2, 2], [2, -2], [-2, 2], [-2, -2]];
        for (const [dxDir, dyDir] of dirs) {
          const nx = x + dxDir;
          const ny = y + dyDir;
          const mx = x + dxDir / 2;
          const my = y + dyDir / 2;
          if (
            nx >= 0 &&
            nx < 8 &&
            ny >= 0 &&
            ny < 8 &&
            board[nx][ny] === 0 &&
            (Math.abs(board[mx][my]) === opponent || Math.abs(board[mx][my]) === opponent + 2)
          ) {
            mustJump = true;
          }
        }
      }
    }
  }

  // Tah pro královnu
  if (move.isKing || Math.abs(piece) > 2) {
    const steps = Math.abs(dx);
    if (Math.abs(dx) !== Math.abs(dy)) return { valid: false, mustJump };
    let capturedPiece: [number, number] | null = null;
    const stepX = dx / steps;
    const stepY = dy / steps;
    for (let i = 1; i <= steps; i++) {
      const cx = fx + stepX * i;
      const cy = fy + stepY * i;
      const current = board[cx][cy];
      if (current !== 0) {
        if (Math.abs(current) === playerId) return { valid: false, mustJump };
        if (capturedPiece) return { valid: false, mustJump }; // více soupeřů na cestě
        capturedPiece = [cx, cy];
      }
    }
    if (capturedPiece) captures.push(capturedPiece);
    return { valid: true, captured: captures, mustJump };
  }

  // Jednoduchý tah
  if (Math.abs(dx) === 1 && Math.abs(dy) === 1 && !mustJump) return { valid: true, mustJump };

  // Skok přes soupeře
  if (Math.abs(dx) === 2 && Math.abs(dy) === 2) {
    const mx = fx + dx / 2;
    const my = fy + dy / 2;
    if (Math.abs(board[mx][my]) === opponent || Math.abs(board[mx][my]) === opponent + 2) {
      captures.push([mx, my]);
      return { valid: true, captured: captures, mustJump };
    }
  }

  return { valid: false, mustJump };
};

export const applyMove = (
  board: number[][],
  from: [number, number],
  to: [number, number],
  captured?: [number, number][]
): number[][] => {
  const newBoard = board.map((row) => [...row]);
  const [fx, fy] = from;
  const [tx, ty] = to;
  const piece = newBoard[fx][fy];
  newBoard[fx][fy] = 0;
  newBoard[tx][ty] = piece;

  if (captured) {
    captured.forEach(([x, y]) => (newBoard[x][y] = 0));
  }

  // Promotion na královnu
  if (piece === 1 && tx === 0) newBoard[tx][ty] = 3;
  if (piece === 2 && tx === 7) newBoard[tx][ty] = 4;

  return newBoard;
};

export const hasPiecesLeft = (board: number[][], playerId: number): boolean => {
  for (const row of board) {
    for (const cell of row) {
      if (
        cell === playerId ||
        cell === playerId + 2
      ) {
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
  for (let x = 0; x < 8; x++) {
    for (let y = 0; y < 8; y++) {
      const piece = board[x][y];

      if (
        piece !== playerId &&
        piece !== playerId + 2
      ) {
        continue;
      }

      const directions = [
        [-1, -1],
        [-1, 1],
        [1, -1],
        [1, 1],
      ];

      for (const [dx, dy] of directions) {
        const nx = x + dx;
        const ny = y + dy;

        if (
          nx >= 0 &&
          nx < 8 &&
          ny >= 0 &&
          ny < 8 &&
          board[nx][ny] === 0
        ) {
          return true;
        }

        const jumpX = x + dx * 2;
        const jumpY = y + dy * 2;
        const enemyX = x + dx;
        const enemyY = y + dy;
        const enemyPlayer = playerId === 1 ? 2 : 1;

        if (
          jumpX >= 0 &&
          jumpX < 8 &&
          jumpY >= 0 &&
          jumpY < 8 &&
          enemyX >= 0 &&
          enemyX < 8 &&
          enemyY >= 0 &&
          enemyY < 8 &&
          board[jumpX][jumpY] === 0 &&
          (
            board[enemyX][enemyY] === enemyPlayer ||
            board[enemyX][enemyY] === enemyPlayer + 2
          )
        ) {
          return true;
        }
      }
    }
  }

  return false;
};