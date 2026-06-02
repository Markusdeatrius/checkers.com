<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import LandingHero from '~/components/LandingHero.vue'
import AuthPanel from '~/components/AuthPanel.vue'

const apiBase = useRuntimeConfig().public.NUXT_PUBLIC_API_BASE || ''

const view = ref<'home' | 'auth' | 'play'>('home')
const authMode = ref<'login' | 'register'>('login')
const authMessage = ref<string>('')
const authError = ref<string>('')
const playError = ref<string>('')
const user = ref<{ id: string; name: string; email: string; eloRating?: number } | null>(null)
const token = ref<string>('')
const games = ref<any[]>([])
const topPlayers = ref<Array<{ id: string; name: string; eloRating: number; rank: number }>>([])
let pollInterval: ReturnType<typeof setInterval> | null = null

const waitingGames = computed(() => {
  return games.value
    .filter((g: any) => g.status === 'WAITING' && g.players.length < 2)
    .sort((a, b) => a.id.localeCompare(b.id))
})

const fetchLeaderboard = async () => {
  try {
    const response = await fetch(`${apiBase}/api/matches/leaderboard`)
    if (!response.ok) return
    topPlayers.value = await response.json()
  } catch (e) {
    console.error(e)
  }
}

const fetchUserProfile = async () => {
  try {
    const token = localStorage.getItem('token')
    if (!token) return
    const response = await fetch(`${apiBase}/api/auth/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })
    if (!response.ok) return
    const userData = await response.json()
    user.value = userData
    localStorage.setItem('user', JSON.stringify(userData))
  } catch (e) {
    console.error(e)
  }
}

const fetchGames = async () => {
  playError.value = ''
  try {
    const response = await fetch(`${apiBase}/api/games`)
    if (!response.ok) {
      playError.value = `Load failed: ${response.status}`
      games.value = []
      return
    }
    games.value = await response.json()
  } catch (e) {
    playError.value = 'Network error'
  }
}

const startPolling = () => {
  if (pollInterval) clearInterval(pollInterval)
  pollInterval = setInterval(() => {
    if (view.value === 'play') fetchGames()
  }, 2000)
}

const stopPolling = () => {
  if (pollInterval) {
    clearInterval(pollInterval)
    pollInterval = null
  }
}

const goToPlay = async () => {
  view.value = 'play'
  await fetchGames()
  startPolling()
}

onMounted(() => {
  fetchLeaderboard()
  const savedUser = localStorage.getItem('user')
  if (savedUser) {
    user.value = JSON.parse(savedUser)
    fetchUserProfile()
  }
})

onUnmounted(() => {
  stopPolling()
})

const handleAuthSubmit = async (payload: { authMode: 'login' | 'register'; name: string; email: string; password: string }) => {
  authError.value = ''
  authMessage.value = ''
  const endpoint = payload.authMode === 'login' ? `${apiBase}/api/auth/login` : `${apiBase}/api/auth/register`
  const body = payload.authMode === 'login'
    ? { email: payload.email, password: payload.password }
    : { name: payload.name, email: payload.email, password: payload.password }

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await response.json()
    if (!response.ok) {
      authError.value = data.error || 'Auth failed'
      return
    }

    token.value = data.token
    user.value = data.user || data
    localStorage.setItem('user', JSON.stringify(user.value))
    localStorage.setItem('token', data.token)
    
    authMessage.value = payload.authMode === 'login' ? 'Logged in successfully' : `Registered ${user.value?.name}`
    view.value = 'play'
    await Promise.all([fetchGames(), fetchUserProfile()])
  } catch (e) {
    authError.value = 'Server connection error'
  }
}

const playGame = async () => {
  if (!user.value) { playError.value = 'Please log in first.'; return; }
  playError.value = ''
  try {
    let gameId: string
    if (waitingGames.value.length > 0) {
      gameId = waitingGames.value[0].id
      const joinResponse = await fetch(`${apiBase}/api/games/${gameId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.value.id }),
      })
      if (!joinResponse.ok) {
        await fetchGames()
        return
      }
    } else {
      const createResponse = await fetch(`${apiBase}/api/games`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Checkers match' }),
      })
      const newGame = await createResponse.json()
      gameId = newGame.id
      await fetch(`${apiBase}/api/games/${gameId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.value.id }),
      })
    }
    stopPolling()
    window.location.href = `/game/${gameId}?userId=${user.value.id}`
  } catch (e) {
    playError.value = 'Network error'
  }
}

const joinSpecificGame = async (gameId: string) => {
  if (!user.value) { playError.value = 'Please log in first.'; return; }
  try {
    const response = await fetch(`${apiBase}/api/games/${gameId}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.value.id }),
    })
    if (!response.ok) return
    window.location.href = `/game/${gameId}?userId=${user.value.id}`
  } catch (e) {
    playError.value = 'Network error'
  }
}

const logout = () => {
  user.value = null
  token.value = ''
  localStorage.removeItem('user')
  localStorage.removeItem('token')
  view.value = 'home'
  stopPolling()
}
</script>

<template>
  <main class="lobby-layout">
    <div class="lobby-container">
      
      <section class="content-area">
        <header class="lobby-header">
          <div class="welcome-text">
            <span class="status-badge">● Online Arena</span>
            <h1>Pro Checkers Lobby</h1>
            <p>Competitive matches • Real-time Elo tracking</p>
          </div>
          <div class="user-quick-stats" v-if="user">
            <div class="stat-pill">
              <span class="label">Starting Rating</span>
              <span class="value">1200</span>
            </div>
          </div>
        </header>

        <div class="view-viewport">
          <div v-if="view === 'home'" class="view-wrapper animate-fade">
            <LandingHero @open-auth="view = 'auth'" @open-play="goToPlay" />
          </div>

          <div v-if="view === 'play'" class="view-wrapper animate-fade">
            <div class="play-view-header">
              <h2>Ready to Play?</h2>
              <button class="refresh-btn" @click="fetchGames">↻ Refresh</button>
            </div>
            <div v-if="playError" class="error-message">{{ playError }}</div>
            
            <div class="quick-join-section">
              <button class="btn-play-large" @click="playGame">⚡ Quick Join</button>
              <p class="quick-join-hint">Automatically join waiting game or create new</p>
            </div>

            <div class="games-divider">OR</div>
            
            <div class="games-list-section">
              <h3>Games Waiting for Players</h3>
              <div v-if="waitingGames.length === 0" class="no-games">
                No games waiting. Use Quick Join to start!
              </div>
              <div v-else class="games-grid">
                <div v-for="(game, index) in waitingGames" :key="game.id" class="game-card">
                  <div class="game-card-header">
                    <span class="game-id">#{{ index + 1 }}</span>
                    <span class="game-name">Game {{ index + 1 }}</span>
                  </div>
                  <div class="game-players">{{ game.players.length }}/2 players</div>
                  <button class="btn-join-game" @click="joinSpecificGame(game.id)">Join Game</button>
                </div>
              </div>
            </div>
            
          </div>

          <div v-if="view === 'auth'" class="view-wrapper animate-fade auth-view">
            <AuthPanel
              :authMode="authMode"
              :authMessage="authMessage"
              :authError="authError"
              @back="view = 'home'"
              @change-mode="authMode = $event"
              @submit="handleAuthSubmit"
            />
          </div>
        </div>
      </section>

      <aside class="control-sidebar">
        <div class="side-panel">
          <div class="panel-header">
            <h3>{{ user ? 'Player Profile' : 'Control Center' }}</h3>
          </div>
          <div class="panel-body">
            <div v-if="!user" class="guest-info">
              <p>Join the community to track your skill and climb the ranks.</p>
            </div>
            <div v-else class="user-info-compact">
              <div class="user-brand">
                <strong class="username">{{ user.name }}</strong>                <div class="user-elo">{{ user.eloRating}} ELO</div>              </div>
              <button class="btn-logout" @click="logout">Odhlásit se</button>
            </div>
            <div class="sidebar-actions">
              <template v-if="user">
                  <template v-if="view === 'home'">
                    <button class="btn-main" @click="goToPlay">Browse Matches</button>
                    <button class="btn-sub" @click="$router.push('/history')">📜 Match History</button>
                    <button class="btn-sub" @click="$router.push('/leaderboard')">🏆 Leaderboard</button>
                  </template>
                </template>
                <template v-else>
                  <template v-if="view === 'home'">
                    <button class="btn-main" @click="view = 'auth'">Sign In / Register</button>
                    <button class="btn-sub" @click="goToPlay">Browse Matches</button>
                  </template>
                </template>
                
                <template v-if="view === 'play' && !user">
                  <div class="login-warning">Sign in to join or create matches.</div>
                  <button class="btn-main" @click="view = 'auth'">Login Now</button>
                </template>

                <button v-if="view !== 'home'" class="btn-text" @click="view = 'home'">
                  ← Back to Overview
                </button>
            </div>
          </div>
        </div>

        <div class="side-panel">
          <div class="panel-header">
            <h3>Top Players</h3>
          </div>
          <div class="mini-list">
            <div v-if="topPlayers.length === 0" class="no-games">
              Loading top players...
            </div>
            <div v-else>
              <div v-for="player in topPlayers.slice(0, 3)" :key="player.id" class="mini-item">
                <span class="rank">{{ player.rank }}</span>
                <span class="name">{{ player.name }}</span>
                <span class="score">{{ player.eloRating }}</span>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </div>
  </main>
</template>

<style scoped>
.lobby-layout {
  min-height: 100vh;
  background-color: #161512;
  color: #ffffff;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  padding: 40px 20px;
}

.lobby-container {
  max-width: 1300px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: 40px;
}

.lobby-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #312e2b;
}

.status-badge {
  color: #81b64c;
  font-size: 0.75rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.welcome-text h1 {
  font-size: 2.4rem;
  font-weight: 800;
  margin: 4px 0;
}

.welcome-text p {
  color: #989795;
}

.stat-pill {
  background: #262522;
  padding: 10px 20px;
  border-radius: 8px;
  border: 1px solid #312e2b;
  text-align: center;
}

.stat-pill .label { font-size: 0.7rem; color: #989795; display: block; text-transform: uppercase; }
.stat-pill .value { font-size: 1.2rem; font-weight: 800; color: #81b64c; }

.side-panel {
  background: #262522;
  border-radius: 8px;
  border: 1px solid #312e2b;
  margin-bottom: 20px;
  overflow: hidden;
}

.panel-header {
  background: #2b2926;
  padding: 12px 20px;
  border-bottom: 1px solid #312e2b;
}

.panel-header h3 {
  margin: 0;
  font-size: 0.75rem;
  color: #989795;
  text-transform: uppercase;
}

.panel-body { padding: 20px; }

.sidebar-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 20px;
}

.user-info-compact {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #1b1917;
  padding: 10px 15px;
  border-radius: 8px;
  border: 1px solid #312e2b;
}

.user-brand {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.user-avatar {
  font-size: 1.2rem;
}

.username {
  color: #fff;
  font-weight: 600;
  font-size: 0.95rem;
}

.user-elo {
  color: #81b64c;
  font-weight: 600;
  font-size: 0.85rem;
  white-space: nowrap;
}

.btn-logout {
  background: transparent;
  color: #f87171;
  border: 1px solid #f87171;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-logout:hover {
  background: #f87171;
  color: white;
}

.btn-main, .btn-sub {
  padding: 14px;
  border-radius: 6px;
  font-weight: 800;
  border: none;
  cursor: pointer;
  transition: transform 0.1s;
}

.btn-main {
  background: #81b64c;
  color: white;
  box-shadow: 0 4px 0 #457520;
}

.btn-main:active { transform: translateY(2px); box-shadow: 0 2px 0 #457520; }

.btn-sub {
  background: #312e2b;
  color: white;
  box-shadow: 0 4px 0 #1b1917;
}

.btn-text {
  background: transparent;
  color: #989795;
  border: none;
  cursor: pointer;
}

.mini-list { padding: 0 20px 20px 20px; }
.mini-item {
  display: grid;
  grid-template-columns: 30px 1fr auto;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #312e2b;
}
.rank { color: #989795; font-weight: bold; }
.score { font-weight: 800; color: #81b64c; }

.play-view-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.refresh-btn {
  background: none;
  border: none;
  color: #989795;
  cursor: pointer;
}

.error-message {
  background: rgba(239, 68, 68, 0.1);
  color: #f87171;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 20px;
  border: 1px solid rgba(239, 68, 68, 0.2);
}

.quick-join-section {
  text-align: center;
  margin-bottom: 40px;
}

.btn-play-large {
  padding: 20px 40px;
  background: #81b64c;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 800;
  font-size: 1.2rem;
  cursor: pointer;
  box-shadow: 0 6px 0 #457520;
}

.btn-play-large:active { transform: translateY(3px); box-shadow: 0 3px 0 #457520; }

.games-divider {
  text-align: center;
  color: #312e2b;
  font-weight: bold;
  margin: 30px 0;
  position: relative;
}

.games-divider::before {
  content: '';
  position: absolute;
  left: 0; right: 0; top: 50%;
  border-top: 1px solid #312e2b;
  z-index: -1;
}

.games-divider { background: #161512; width: 100%; }

.games-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
}

/* FIX: Úprava hlavičky karty, aby se texty nekřížily */
.game-card {
  background: #262522;
  border: 1px solid #312e2b;
  border-radius: 8px;
  padding: 16px;
  transition: border-color 0.2s;
}

.game-card:hover { border-color: #81b64c; }

.game-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  gap: 10px;
}

.game-id {
  background: #81b64c;
  color: white;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: bold;
  flex-shrink: 0;
}

.game-name {
  color: #ffffff;
  font-size: 0.95rem;
  font-weight: 600;
  text-align: right;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.game-players {
  color: #989795;
  font-size: 0.85rem;
  margin-bottom: 12px;
  text-align: center;
}

.btn-join-game {
  width: 100%;
  padding: 10px;
  background: #312e2b;
  color: #81b64c;
  border: 1px solid #81b64c;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
}

.btn-join-game:hover { background: #81b64c; color: white; }

@media (max-width: 1000px) {
  .lobby-container { grid-template-columns: 1fr; }
}
</style>