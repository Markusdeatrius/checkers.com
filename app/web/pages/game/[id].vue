<template>
  <div>
    <h1>Game {{ $route.params.id }}</h1>
    <div v-if="winner">Winner: Player {{ winner }}</div>
    <div>Turn: Player {{ currentTurn }}</div>
    <div class="board">
      <div
        v-for="(row, rowIndex) in board"
        :key="rowIndex"
        class="row"
      >
        <div
          v-for="(cell, colIndex) in row"
          :key="colIndex"
          class="cell"
          :class="{
            black: (rowIndex + colIndex) % 2 === 1,
            selected: selectedPiece && selectedPiece[0] === rowIndex && selectedPiece[1] === colIndex,
            validTarget: validTargets.some(([r, c]) => r === rowIndex && c === colIndex)
          }"
          @click="handleCellClick(rowIndex, colIndex)"
        >
          <div
            v-if="cell !== 0"
            class="piece"
            :class="{
              player1: cell === 1 || cell === 3,
              player2: cell === 2 || cell === 4,
              king: cell === 3 || cell === 4
            }"
          >
            {{ cell === 3 ? '♔' : cell === 4 ? '♚' : '' }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { io } from 'socket.io-client'

const route = useRoute()
const gameId = Number(route.params.id)

const board = ref<number[][]>(Array(8).fill(null).map(() => Array(8).fill(0)))
const selectedPiece = ref<[number, number] | null>(null)
const validTargets = ref<[number, number][]>([])
const currentTurn = ref<number>(1)
const winner = ref<number | null>(null)
const gameStatus = ref<string>('waiting')

let socket: any

onMounted(() => {
  socket = io('http://localhost:3002') // Adjust if needed

  socket.on('boardUpdate', (newBoard: number[][]) => {
    board.value = newBoard
  })

  socket.on('turnUpdate', (turn: number) => {
    currentTurn.value = turn
  })

  socket.on('gameFinished', (win: number) => {
    winner.value = win
    gameStatus.value = 'finished'
  })

  socket.on('error', (msg: string) => {
    alert(msg)
  })

  // Join game
  socket.emit('joinGame', { gameId, userId: 1 }) // Hardcode userId for now, assume player 1
})

onUnmounted(() => {
  if (socket) socket.disconnect()
})

const handleCellClick = (row: number, col: number) => {
  if (winner.value) return
  if (currentTurn.value !== 1) return // Hardcode for player 1

  const cell = board.value[row][col]

  if (selectedPiece.value) {
    // If clicking on selected piece, deselect
    if (selectedPiece.value[0] === row && selectedPiece.value[1] === col) {
      selectedPiece.value = null
      validTargets.value = []
      return
    }

    // If clicking on valid target, make move
    if (validTargets.value.some(([r, c]) => r === row && c === col)) {
      socket.emit('makeMove', {
        gameId,
        userId: 1, // Hardcode
        from: selectedPiece.value,
        to: [row, col]
      })
      selectedPiece.value = null
      validTargets.value = []
      return
    }

    // If clicking on own piece, select it
    if (cell === 1 || cell === 3) {
      selectPiece(row, col)
    }
  } else {
    // Select piece
    if (cell === 1 || cell === 3) {
      selectPiece(row, col)
    }
  }
}

const selectPiece = (row: number, col: number) => {
  selectedPiece.value = [row, col]
  // Calculate valid targets - for simplicity, assume all adjacent or jump spots
  validTargets.value = []
  const directions = [[-1, -1], [-1, 1], [1, -1], [1, 1]]
  for (const [dr, dc] of directions) {
    const nr = row + dr
    const nc = col + dc
    if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8 && board.value[nr][nc] === 0) {
      validTargets.value.push([nr, nc])
    }
    // Jumps
    const jr = row + dr * 2
    const jc = col + dc * 2
    const er = row + dr
    const ec = col + dc
    if (jr >= 0 && jr < 8 && jc >= 0 && jc < 8 && er >= 0 && er < 8 && ec >= 0 && ec < 8 &&
        board.value[jr][jc] === 0 && (board.value[er][ec] === 2 || board.value[er][ec] === 4)) {
      validTargets.value.push([jr, jc])
    }
  }
}
</script>

<style scoped>
.board {
  display: grid;
  grid-template-rows: repeat(8, 50px);
  grid-template-columns: repeat(8, 50px);
  border: 1px solid black;
}

.cell {
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.black {
  background-color: #8B4513;
}

.selected {
  background-color: yellow;
}

.validTarget {
  background-color: lightgreen;
}

.piece {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.player1 {
  background-color: red;
}

.player2 {
  background-color: blue;
}

.king {
  font-size: 24px;
}
</style>