export const createInitialBoard = () => {
  const board: number[][] = []

  for (let y = 0; y < 8; y++) {
    const row: number[] = []

    for (let x = 0; x < 8; x++) {
      row.push(0)
    }

    board.push(row)
  }

  for (let y = 0; y < 3; y++) {
    for (let x = 0; x < 8; x++) {
      if ((x + y) % 2 === 1) board[y][x] = 2
    }
  }

  for (let y = 5; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      if ((x + y) % 2 === 1) board[y][x] = 1
    }
  }

  return board
}