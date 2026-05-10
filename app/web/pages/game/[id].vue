<template>
  <div class="game-shell">
    <div class="room-panel">
      <div class="room-header">
        <h1>Checkers Playroom</h1>
        <div class="turn-label">Turn: {{ turnLabel }}</div>
      </div>
      <div class="room-meta">
        <div class="status-card">
          <div><strong>You:</strong> {{ playerLabel }}</div>
          <div class="timer-row">
            <span>White: {{ formatDuration(whiteTime) }}</span>
            <span>Black: {{ formatDuration(blackTime) }}</span>
          </div>
          <div v-if="winner" class="winner">Winner: {{ winnerLabel }}</div>
        </div>
        <div class="players-card">
          <h2>Players</h2>
          <div v-for="player in players" :key="player.userId" class="player-row">
            <div class="player-name">{{ player.name }} <span>({{ player.color }})</span></div>
            <div class="player-stats">{{ player.stats.wins }}W / {{ player.stats.losses }}L / {{ player.stats.draws }}D</div>
          </div>
        </div>
        <div class="chat-card">
          <h2>Game Chat</h2>
          <div class="chat-messages">
            <div v-for="message in chatMessages" :key="message.createdAt + message.userId" class="chat-message">
              <span class="chat-user">{{ message.userName || playerNameMap[message.userId] || ('Player ' + message.userId) }}:</span>
              <span class="chat-text">{{ message.text }}</span>
            </div>
            <div v-if="chatMessages.length === 0" class="chat-empty">No messages yet</div>
          </div>
          <form class="chat-form" @submit.prevent="sendChat">
            <input v-model="chatInput" placeholder="Type a message" />
            <button type="submit">Send</button>
          </form>
        </div>
      </div>
    </div>
    <div class="board-shell">
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
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { io } from 'socket.io-client'

const route = useRoute()
const gameId = Number(route.params.id)
const userId = Number(route.query.userId ?? 1)

const board = ref<number[][]>(Array.from({ length: 8 }, () => Array(8).fill(0)))
const selectedPiece = ref<[number, number] | null>(null)
const validTargets = ref<[number, number][]>([])
const currentTurn = ref<number>(1)
const winner = ref<number | null>(null)
const playerSlot = ref<number | null>(null)
const playerClocks = ref<Record<number, number>>({ 1: 0, 2: 0 })
const players = ref<Array<{ slot: number; userId: number; name: string; color: 'white' | 'black'; stats: { wins: number; losses: number; draws: number } }>>([])
const chatInput = ref('')
const chatMessages = ref<Array<{ userId: number; userName: string; text: string; createdAt: string }>>([])
const gameStatus = ref<string>('waiting')

const playerLabel = computed(() => {
  const me = players.value.find((player) => player.userId === userId)
  return me ? `${me.name} (${me.color})` : 'Connecting...'
})

const turnLabel = computed(() => {
  const current = players.value.find((player) => player.slot === currentTurn.value)
  return current ? `${current.name} (${current.color})` : 'Waiting to start'
})

const winnerLabel = computed(() => {
  if (!winner.value) return ''
  const winnerPlayer = players.value.find((player) => player.slot === winner.value)
  return winnerPlayer ? winnerPlayer.name : `Player ${winner.value}`
})

const whiteTime = computed(() => playerClocks.value[1] ?? 0)
const blackTime = computed(() => playerClocks.value[2] ?? 0)

const isMyTurn = computed(() => playerSlot.value !== null && currentTurn.value === playerSlot.value)

const playerNameMap = computed(() => Object.fromEntries(players.value.map((player) => [player.userId, player.name])))

const ownsPiece = (cell: number) => {
  return playerSlot.value !== null && (cell === playerSlot.value || cell === playerSlot.value + 2)
}

const getBoardCell = (row: number, col: number) => board.value[row]?.[col] ?? 0

const inBounds = (row: number, col: number) => row >= 0 && row < 8 && col >= 0 && col < 8

const isOpponentCell = (cell: number) => {
  if (!playerSlot.value) return false
  if (cell === 0) return false
  const owner = Math.abs(cell) === 1 || Math.abs(cell) === 3 ? 1 : 2
  return owner !== playerSlot.value
}

const hasAnyCapture = () => {
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const cell = getBoardCell(row, col)
      if (ownsPiece(cell)) {
        if (getCaptureTargets(row, col).length > 0) return true
      }
    }
  }
  return false
}

const getCaptureTargets = (row: number, col: number) => {
  const cell = getBoardCell(row, col)
  if (!ownsPiece(cell)) return []
  const king = Math.abs(cell) > 2
  const forward = playerSlot.value === 1 ? -1 : 1
  const directions: Array<[number, number]> = [[1, 1], [1, -1], [-1, 1], [-1, -1]]
  const targets: [number, number][] = []
  const captureDirections: Array<[number, number]> = king
    ? directions
    : ([ [forward * 2, 2], [forward * 2, -2] ] as const)

  for (const [dr, dc] of captureDirections) {
    const midRow = row + dr / 2
    const midCol = col + dc / 2
    const targetRow = row + dr
    const targetCol = col + dc

    if (!inBounds(targetRow, targetCol) || !inBounds(midRow, midCol)) continue
    if (getBoardCell(targetRow, targetCol) !== 0) continue
    if (isOpponentCell(getBoardCell(midRow, midCol))) {
      targets.push([targetRow, targetCol])
    }
  }

  if (king) {
    targets.length = 0
    for (const [dr, dc] of directions) {
      let x = row + dr
      let y = col + dc
      let opponentFound = false

      while (inBounds(x, y)) {
        const current = getBoardCell(x, y)
        if (current === 0) {
          if (opponentFound) targets.push([x, y])
          x += dr
          y += dc
          continue
        }

        if (!opponentFound && isOpponentCell(current)) {
          opponentFound = true
          x += dr
          y += dc
          continue
        }

        break
      }
    }
  }

  return targets
}

const getSimpleTargets = (row: number, col: number) => {
  const cell = getBoardCell(row, col)
  if (!ownsPiece(cell)) return []
  const king = Math.abs(cell) > 2
  const forward = playerSlot.value === 1 ? -1 : 1
  const directions: Array<[number, number]> = [[1, 1], [1, -1], [-1, 1], [-1, -1]]
  const targets: [number, number][] = []

  for (const [dr, dc] of directions) {
    if (!king && dr !== forward) continue

    let targetRow = row + dr
    let targetCol = col + dc

    while (inBounds(targetRow, targetCol) && getBoardCell(targetRow, targetCol) === 0) {
      targets.push([targetRow, targetCol])
      if (!king) break
      targetRow += dr
      targetCol += dc
    }
  }

  return targets
}

const getValidTargetsForPiece = (row: number, col: number) => {
  const captureTargets = getCaptureTargets(row, col)
  const simpleTargets = getSimpleTargets(row, col)

  if (captureTargets.length > 0) {
    const uniqueTargets = [...captureTargets]
    for (const target of simpleTargets) {
      if (!uniqueTargets.some(([r, c]) => r === target[0] && c === target[1])) {
        uniqueTargets.push(target)
      }
    }
    return uniqueTargets
  }

  return simpleTargets
}

const setSelectedPiece = (row: number, col: number) => {
  selectedPiece.value = [row, col]
  validTargets.value = getValidTargetsForPiece(row, col)
}

let socket: any

const formatDuration = (ms: number) => {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000))
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0')
  const seconds = String(totalSeconds % 60).padStart(2, '0')
  return `${minutes}:${seconds}`
}

onMounted(() => {
  socket = io('http://localhost:3002')

  socket.on('gameState', (state: any) => {
    board.value = state.board
    currentTurn.value = state.turn
    gameStatus.value = state.status
    winner.value = state.status === 'FINISHED' ? state.players.find((player: any) => player.userId === state.winnerId)?.slot ?? null : null
    playerClocks.value = state.clocks
    players.value = state.players
    playerSlot.value = state.players.find((player: any) => player.userId === userId)?.slot ?? null
  })

  socket.on('boardUpdate', (newBoard: number[][]) => {
    board.value = newBoard
  })

  socket.on('turnUpdate', (turn: number) => {
    currentTurn.value = turn
  })

  socket.on('timerUpdate', (payload: { clocks: Record<number, number>; activeSlot: number }) => {
    playerClocks.value = payload.clocks
    currentTurn.value = payload.activeSlot
  })

  socket.on('gameFinished', (win: number) => {
    winner.value = win
    gameStatus.value = 'finished'
  })

  socket.on('chatMessage', (payload: { userId: number; userName: string; text: string; createdAt: string }) => {
    chatMessages.value.push(payload)
  })

  socket.on('error', (msg: string) => {
    alert(msg)
  })

  socket.emit('joinGame', { gameId, userId })
})

onUnmounted(() => {
  if (socket) socket.disconnect()
})

const handleCellClick = (row: number, col: number) => {
  if (winner.value) return
  if (!isMyTurn.value) return

  const cell = getBoardCell(row, col)

  if (!selectedPiece.value) {
    if (!ownsPiece(cell)) return
    setSelectedPiece(row, col)
    return
  }

  if (selectedPiece.value[0] === row && selectedPiece.value[1] === col) {
    selectedPiece.value = null
    validTargets.value = []
    return
  }

  if (validTargets.value.some(([r, c]) => r === row && c === col)) {
    socket.emit('makeMove', {
      gameId,
      userId,
      from: selectedPiece.value,
      to: [row, col],
    })
    selectedPiece.value = null
    validTargets.value = []
    return
  }

  if (ownsPiece(cell)) {
    setSelectedPiece(row, col)
  }
}

const sendChat = () => {
  const text = chatInput.value.trim()
  if (!text || !socket) return

  socket.emit('chatMessage', {
    gameId,
    userId,
    text,
  })
  chatInput.value = ''
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
  background-color: white;
  border: 2px solid #111;
}

.player2 {
  background-color: black;
  color: white;
}

.king {
  font-size: 24px;
}

.room-meta {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.status-card,
.chat-card {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 16px;
  flex: 1;
  min-width: 280px;
}

.timer-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-top: 8px;
  font-size: 0.95rem;
}

.chat-messages {
  max-height: 220px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}

.chat-message {
  display: flex;
  gap: 8px;
  font-size: 0.95rem;
}

.chat-user {
  font-weight: 700;
}

.chat-empty {
  color: #6b7280;
}

.chat-form {
  display: flex;
  gap: 8px;
}

.chat-form input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
}

.chat-form button {
  padding: 8px 12px;
  border: none;
  background: #2563eb;
  color: white;
  border-radius: 8px;
  cursor: pointer;
}
</style>