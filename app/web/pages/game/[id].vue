<template>
  <div class="game-shell">
    <div class="main-container">
      
      <!-- LEVÁ STRANA: Šachovnice -->
      <div class="board-area">
        <div class="board-wrapper">
          <!-- Dynamická třída 'flipped' zajistí otočení desky pro hráče za černé -->
          <div class="board" :class="{ flipped: playerSlot === 2 }">
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
                  dark: (rowIndex + colIndex) % 2 === 1,
                  selected: selectedPiece && selectedPiece[0] === rowIndex && selectedPiece[1] === colIndex,
                  validTarget: validTargets.some(([r, c]) => r === rowIndex && c === colIndex)
                }"
                @click="handleCellClick(rowIndex, colIndex)"
              >
                <!-- Indikátor pro validní tah na prázdném poli -->
                <div v-if="validTargets.some(([r, c]) => r === rowIndex && c === colIndex) && cell === 0" class="target-dot"></div>
                
                <div
                  v-if="cell !== 0"
                  class="piece"
                  :class="{
                    player1: cell === 1 || cell === 3,
                    player2: cell === 2 || cell === 4,
                    king: cell === 3 || cell === 4
                  }"
                >
                  <!-- Dekorativní prstenec pro texturu kamene -->
                  <div class="piece-ring"></div>
                  
                  <div v-if="cell === 3 || cell === 4" class="king-crown">
                    <span class="king-icon">👑</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="game-info-footer">
          <div class="turn-status" :class="{ 'my-turn': isMyTurn }">
            <span class="pulse-icon" v-if="isMyTurn"></span>
            {{ turnLabel }}
          </div>
          <div v-if="winner" class="winner-announcement">
            🏆 Winner: {{ winnerLabel }}
          </div>
        </div>
      </div>

      <!-- PRAVÁ STRANA: Ovládací panel -->
      <aside class="side-controls">
        
        <!-- Sekce Hráčů a Času -->
        <div class="control-card">
          <div class="card-header">Game Status</div>
          <div class="clocks-grid">
            <div class="clock-box" :class="{ active: currentTurn === 1 }">
              <span class="clock-label">White</span>
              <span class="clock-time">{{ formatDuration(whiteTime) }}</span>
            </div>
            <div class="clock-box" :class="{ active: currentTurn === 2 }">
              <span class="clock-label">Black</span>
              <span class="clock-time">{{ formatDuration(blackTime) }}</span>
            </div>
          </div>

          <div class="players-list">
            <div v-for="player in players" :key="player.userId" class="player-entry">
              <div class="player-avatar" :class="player.color"></div>
              <div class="player-details">
                <div class="name">{{ player.name }} <span v-if="player.userId === userId">(You)</span></div>
                <div class="meta">Rating: {{ player.eloRating }} • {{ player.stats.wins }}W</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Chat Panel -->
        <div class="control-card chat-panel">
          <div class="card-header">Room Chat</div>
          <div class="chat-messages" ref="chatScroll">
            <div v-for="message in chatMessages" :key="message.createdAt + message.userId" class="chat-message">
              <span class="chat-user" :style="{ color: message.userId === userId ? '#81b64c' : '#989795' }">
                {{ message.userName || playerNameMap[message.userId] || ('Player ' + message.userId) }}:
              </span>
              <span class="chat-text">{{ message.text }}</span>
            </div>
            <div v-if="chatMessages.length === 0" class="chat-empty">No messages in lobby</div>
          </div>
          <form class="chat-form" @submit.prevent="sendChat">
            <input v-model="chatInput" placeholder="Send a message..." />
            <button type="submit">Send</button>
          </form>
        </div>

      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { io } from 'socket.io-client'

const route = useRoute()
const gameId = Array.isArray(route.params.id) ? route.params.id[0] : route.params.id
const userId = Array.isArray(route.query.userId) ? route.query.userId[0] : String(route.query.userId ?? '')

const board = ref<number[][]>(Array.from({ length: 8 }, () => Array(8).fill(0)))
const selectedPiece = ref<[number, number] | null>(null)
const validTargets = ref<[number, number][]>([])
const currentTurn = ref<number>(1)
const winner = ref<number | null>(null)
const playerSlot = ref<number | null>(null)
const playerClocks = ref<Record<number, number>>({ 1: 0, 2: 0 })
const players = ref<Array<{ slot: number; userId: string; name: string; color: 'white' | 'black'; eloRating: number; stats: { wins: number; losses: number; draws: number } }>>([])
const chatInput = ref('')
const chatMessages = ref<Array<{ userId: string; userName: string; text: string; createdAt: string }>>([])
const gameStatus = ref<string>('waiting')

const playerLabel = computed(() => {
  const me = players.value.find((player) => player.userId === userId)
  return me ? `${me.name} (${me.color})` : 'Connecting...'
})

const turnLabel = computed(() => {
  const current = players.value.find((player) => player.slot === currentTurn.value)
  return current ? `${current.name}'s Turn (${current.color})` : 'Waiting to start'
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
  const socketBase = useRuntimeConfig().public.NUXT_PUBLIC_API_BASE || ''
  socket = io(socketBase, {
    path: '/socket.io',
    transports: ['websocket', 'polling'],
  })

  socket.on('gameState', (state: any) => {
    board.value = state.board
    currentTurn.value = state.turn
    gameStatus.value = state.status
    winner.value = state.status === 'FINISHED' ? state.players.find((player: any) => player.userId === state.winnerId)?.slot ?? null : null
    playerClocks.value = state.clocks
    players.value = state.players
    playerSlot.value = state.players.find((player: any) => player.userId === userId)?.slot ?? null
  })

  socket.on('boardUpdate', (newBoard: number[][]) => { board.value = newBoard })
  socket.on('turnUpdate', (turn: number) => { currentTurn.value = turn })
  socket.on('timerUpdate', (payload: { clocks: Record<number, number>; activeSlot: number }) => {
    playerClocks.value = payload.clocks
    currentTurn.value = payload.activeSlot
  })
  socket.on('gameFinished', (win: number) => {
    winner.value = win
    gameStatus.value = 'finished'
  })
  socket.on('chatMessage', (payload: { userId: string; userName: string; text: string; createdAt: string }) => {
    chatMessages.value.push(payload)
  })
  socket.on('error', (msg: string) => { alert(msg) })
  socket.emit('joinGame', { gameId, userId })
})

onUnmounted(() => { if (socket) socket.disconnect() })

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
    socket.emit('makeMove', { gameId, userId, from: selectedPiece.value, to: [row, col] })
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
  socket.emit('chatMessage', { gameId, userId, text })
  chatInput.value = ''
}
</script>

<style scoped>
.game-shell {
  min-height: 100vh;
  background-color: #161512;
  color: #fff;
  padding: 40px 20px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

.main-container {
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: 40px;
}

/* BOARD STYLING & ROTATION */
.board-area {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.board-wrapper {
  background: #2b2926;
  padding: 12px;
  border-radius: 8px;
  box-shadow: 0 20px 50px rgba(0,0,0,0.5);
}

.board {
  display: grid;
  grid-template-rows: repeat(8, 1fr);
  width: 600px;
  height: 600px;
  border: 4px solid #312e2b;
  transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Pokud hraje černý, otočíme celou desku o 180 stupňů */
.board.flipped {
  transform: rotate(180deg);
}

.row {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
}

.cell {
  position: relative;
  background-color: #ebecd0; /* Light square */
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.1s;
}

/* Aby figurky nebyly vzhůru nohama, když je deska otočená, otočíme je zpět */
.board.flipped .cell {
  transform: rotate(180deg);
}

.cell.dark {
  background-color: #779556; /* Chess.com Dark Green */
}

.cell.selected {
  background-color: rgba(255, 255, 0, 0.5) !important;
}

.cell.validTarget {
  background-color: rgba(129, 182, 76, 0.4) !important;
}

.target-dot {
  width: 18px;
  height: 18px;
  background: rgba(0,0,0,0.15);
  border-radius: 50%;
}

/* PIECES - MODERN 3D LOOK */
.piece {
  width: 82%;
  height: 82%;
  border-radius: 50%;
  position: relative;
  box-shadow: 0 6px 0 rgba(0,0,0,0.35); /* Hloubka kamene */
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.15s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 2;
}

.piece:hover {
  transform: scale(1.05) translateY(-2px);
}

.player1 {
  background: linear-gradient(145deg, #ffffff, #dcdcdc);
  border: 1px solid #fff;
}

.player2 {
  background: linear-gradient(145deg, #3a3a3a, #1a1a1a);
  border: 1px solid #444;
}

.piece-ring {
  position: absolute;
  width: 70%;
  height: 70%;
  border-radius: 50%;
  border: 1px solid rgba(0,0,0,0.05);
  pointer-events: none;
}

.player2 .piece-ring {
  border-color: rgba(255,255,255,0.08);
}

/* KINGS - STACKED EFFECT */
.king {
  box-shadow: 0 10px 0 rgba(0,0,0,0.4);
  transform: translateY(-4px);
}

.king:hover {
  transform: scale(1.05) translateY(-6px);
}

.king-icon {
  font-size: 26px;
  filter: drop-shadow(0 2px 2px rgba(0,0,0,0.5));
  color: #ffd700;
}

/* SIDEBAR CONTROLS */
.side-controls {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.control-card {
  background: #262522;
  border: 1px solid #312e2b;
  border-radius: 8px;
  padding: 20px;
}

.card-header {
  font-size: 0.75rem;
  font-weight: 800;
  color: #989795;
  text-transform: uppercase;
  margin-bottom: 15px;
  letter-spacing: 0.05em;
}

.clocks-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 20px;
}

.clock-box {
  background: #312e2b;
  padding: 12px;
  border-radius: 6px;
  text-align: center;
  border-bottom: 3px solid transparent;
}

.clock-box.active {
  background: #3d3a37;
  border-bottom-color: #81b64c;
}

.clock-label {
  display: block;
  font-size: 0.7rem;
  color: #989795;
  margin-bottom: 4px;
}

.clock-time {
  font-family: monospace;
  font-size: 1.5rem;
  font-weight: bold;
}

.players-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.player-entry {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #2b2926;
  padding: 10px;
  border-radius: 6px;
}

.player-avatar {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}
.player-avatar.white { background: #fff; border: 1px solid #999; }
.player-avatar.black { background: #000; border: 1px solid #555; }

.player-details .name { font-weight: bold; font-size: 0.9rem; }
.player-details .meta { font-size: 0.75rem; color: #989795; }

/* CHAT */
.chat-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.chat-messages {
  flex: 1;
  max-height: 300px;
  overflow-y: auto;
  margin-bottom: 15px;
  padding-right: 5px;
}

.chat-message {
  margin-bottom: 8px;
  font-size: 0.85rem;
  line-height: 1.4;
}

.chat-user { font-weight: 800; margin-right: 6px; }
.chat-text { color: #ddd; }

.chat-form {
  display: flex;
  gap: 8px;
}

.chat-form input {
  flex: 1;
  background: #1a1917;
  border: 1px solid #312e2b;
  padding: 10px;
  border-radius: 4px;
  color: white;
  outline: none;
}

.chat-form button {
  background: #81b64c;
  border: none;
  color: white;
  padding: 0 15px;
  border-radius: 4px;
  font-weight: bold;
  cursor: pointer;
  box-shadow: 0 3px 0 #457520;
}

.chat-form button:active {
  transform: translateY(2px);
  box-shadow: 0 1px 0 #457520;
}

/* FOOTER INFO */
.game-info-footer {
  margin-top: 20px;
  display: flex;
  gap: 20px;
  align-items: center;
}

.turn-status {
  padding: 8px 16px;
  background: #262522;
  border-radius: 20px;
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 8px;
}

.turn-status.my-turn {
  color: #81b64c;
  outline: 1px solid #81b64c;
}

.pulse-icon {
  width: 8px;
  height: 8px;
  background: #81b64c;
  border-radius: 50%;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.4; transform: scale(1.3); }
  100% { opacity: 1; transform: scale(1); }
}

.winner-announcement {
  background: #81b64c;
  padding: 8px 16px;
  border-radius: 20px;
  color: white;
  font-weight: 800;
  animation: bounce 0.5s;
}

@media (max-width: 1100px) {
  .main-container { grid-template-columns: 1fr; }
  .board { width: 90vw; height: 90vw; max-width: 500px; max-height: 500px; }
}
</style>