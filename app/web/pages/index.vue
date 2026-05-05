<template>
  <div>
    <h1>Lobby</h1>
    <button @click="createGame">Create Game</button>
    <h2>Available Games</h2>
    <ul>
      <li v-for="game in games" :key="game.id">
        {{ game.id }} - {{ game.status }}
        <button v-if="game.status === 'WAITING' && (game.players?.length ?? 0) < 2" @click="joinGame(game.id)">Join</button>
        <button v-if="game.status === 'WAITING' && (game.players?.length ?? 0) === 2" @click="startGame(game.id)">Start</button>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
const games = ref([])

onMounted(async () => {
  try {
    await fetchGames()
  } catch (error) {
    console.error('Failed to load games', error)
  }
})

const fetchGames = async () => {
  const response = await fetch('/api/games')
  if (!response.ok) {
    throw new Error(`Fetch games failed: ${response.status}`)
  }
  games.value = await response.json()
}

const createGame = async () => {
  const response = await fetch('/api/games', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Test Game' })
  })

  if (!response.ok) {
    const errorBody = await response.text()
    console.error('Create game failed', response.status, errorBody)
    return
  }

  await fetchGames()
}

const joinGame = async (gameId: number) => {
  const response = await fetch(`/api/games/${gameId}/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: 1 })
  })

  if (!response.ok) {
    const errorBody = await response.text()
    console.error('Join game failed', response.status, errorBody)
    return
  }

  await fetchGames()
}

const startGame = async (gameId: number) => {
  const response = await fetch(`/api/games/${gameId}/start`, { method: 'POST' })

  if (!response.ok) {
    const errorBody = await response.text()
    console.error('Start game failed', response.status, errorBody)
    return
  }

  await navigateTo(`/game/${gameId}`)
}
</script>