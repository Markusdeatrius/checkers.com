<template>
  <main class="page-shell">
    <LandingHero v-if="view === 'home'" @open-auth="view = 'auth'" @open-play="goToPlay" />
    <AuthPanel
      v-if="view === 'auth'"
      :authMode="authMode"
      :authMessage="authMessage"
      :authError="authError"
      @back="view = 'home'"
      @change-mode="authMode = $event"
      @submit="handleAuthSubmit"
    />
    <PlayPanel
      v-if="view === 'play'"
      :games="games"
      :playError="playError"
      @back="view = 'home'"
      @create-game="createGame"
      @join-game="joinGame"
    />
  </main>
</template>

<script setup lang="ts">
import LandingHero from '~/components/LandingHero.vue'
import AuthPanel from '~/components/AuthPanel.vue'
import PlayPanel from '~/components/PlayPanel.vue'

const view = ref<'home' | 'auth' | 'play'>('home')
const authMode = ref<'login' | 'register'>('login')
const authMessage = ref<string>('')
const authError = ref<string>('')
const playError = ref<string>('')
const user = ref<{ id: number; name: string; email: string } | null>(null)
const token = ref<string>('')
const games = ref<any[]>([])
const router = useRouter()

const goToPlay = async () => {
  view.value = 'play'
  await fetchGames()
}

const handleAuthSubmit = async (payload: { authMode: 'login' | 'register'; name: string; email: string; password: string }) => {
  authError.value = ''
  authMessage.value = ''

  const endpoint = payload.authMode === 'login' ? '/api/auth/login' : '/api/auth/register'
  const body = payload.authMode === 'login'
    ? { email: payload.email, password: payload.password }
    : { name: payload.name, email: payload.email, password: payload.password }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  const data = await response.json()

  if (!response.ok) {
    authError.value = data.error || 'Authentication failed'
    return
  }

  if (payload.authMode === 'login') {
    token.value = data.token
    user.value = data.user
    authMessage.value = 'Logged in successfully'
    view.value = 'play'
    await fetchGames()
  } else {
    user.value = data
    authMessage.value = `Registered ${data.name}`
    view.value = 'play'
    await fetchGames()
  }
}

const fetchGames = async () => {
  playError.value = ''
  const response = await fetch('/api/games')

  if (!response.ok) {
    playError.value = `Unable to load games: ${response.status}`
    games.value = []
    return
  }

  games.value = await response.json()
}

const createGame = async () => {
  playError.value = ''
  const response = await fetch('/api/games', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Checkers match' }),
  })

  if (!response.ok) {
    const errorBody = await response.text()
    playError.value = `Create failed: ${response.status} ${errorBody}`
    return
  }

  await fetchGames()
}

const joinGame = async (gameId: number) => {
  if (!user.value) {
    playError.value = 'You must log in before joining a game.'
    return
  }

  playError.value = ''
  const response = await fetch(`/api/games/${gameId}/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: user.value.id }),
  })

  if (!response.ok) {
    const errorBody = await response.text()
    playError.value = `Join failed: ${response.status} ${errorBody}`
    return
  }

  const targetUrl = `/game/${encodeURIComponent(String(gameId))}?userId=${encodeURIComponent(String(user.value?.id))}`
  // Use hard redirect to ensure the playroom opens as its own page.
  window.location.href = targetUrl
}
</script>

<style scoped>
.page-shell {
  max-width: 1120px;
  margin: 0 auto;
  padding: 40px 24px;
  font-family: Inter, system-ui, sans-serif;
  color: #111827;
}
</style>
