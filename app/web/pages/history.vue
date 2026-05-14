<template>
  <main class="history-layout">
    <div class="history-container">
      <header class="history-header">
        <div class="header-content">
          <span class="status-badge">● Player Records</span>
          <h1>Match History</h1>
          <p>Your last 30 finished matches</p>
        </div>
        <button class="btn-text" @click="$router.push('/')">← Back to Lobby</button>
      </header>

      <div v-if="loading" class="loading-state">Načítám historii...</div>
      
      <div v-else-if="finishedMatches.length === 0" class="no-data">
        <div class="empty-icon">📜</div>
        <p>Zatím žádné dohrané hry.</p>
        <button class="btn-sub" @click="$router.push('/')">Hrát nyní</button>
      </div>

      <div v-else class="match-list">
        <div v-for="(match, index) in finishedMatches" :key="match.id" class="match-card" :class="getMatchResultClass(match)">
          <div class="match-rank">#{{ index + 1 }}</div>
          
          <div class="match-info">
            <div class="opponent">
              <span class="label">Soupeř:</span>
              <span class="name">{{ getOpponentName(match) }}</span>
            </div>
            <div class="date">{{ formatDate(match.updatedAt || match.createdAt) }}</div>
          </div>

          <div class="match-result">
            <span class="result-label">{{ getResultText(match) }}</span>
          </div>

          <div class="elo-change" :class="getEloStatusClass(match)">
            {{ formatElo(match) }} ELO
          </div>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

const user = ref<any>(null)
const allGames = ref<any[]>([])
const loading = ref(true)

const finishedMatches = computed(() => {
  if (!user.value) return []
  return allGames.value
    .filter((g: any) => {
      const isFinished = g.status === 'FINISHED'
      const isParticipant = g.players?.some((p: any) => String(p.userId || p.id) === String(user.value.id))
      return isFinished && isParticipant
    })
    .sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime())
    .slice(0, 30)
})

onMounted(async () => {
  const savedUser = localStorage.getItem('user')
  if (!savedUser) { navigateTo('/'); return; }
  user.value = JSON.parse(savedUser)

  try {
    const response = await fetch('/api/games')
    if (response.ok) {
      allGames.value = await response.json()
    }
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
})

const getOpponentName = (match: any) => {
  if (!match.players || match.players.length < 2) return 'Unknown'
  const isPlayer1 = String(match.players[0]?.userId || match.players[0]?.id) === String(user.value.id)
  const opponent = isPlayer1 ? match.players[1] : match.players[0]
  return opponent?.user?.name || 'Unknown'
}

// LOGIKA: Pokud backend neposílá eloChange, vypočítáme ho podle winnerId
const getUserEloChange = (match: any) => {
  // 1. Zkusíme nejdřív vzít reálná data, pokud by tam náhodou byla
  const isPlayer1 = String(match.players?.[0]?.userId || match.players?.[0]?.id) === String(user.value.id)
  const realChange = isPlayer1 ? match.eloChangePlayer1 : match.eloChangePlayer2
  
  if (realChange !== undefined && realChange !== null && realChange !== 0) {
    return realChange
  }

  // 2. Nouzový výpočet: Výhra = +20, Prohra = -20, Remíza = 0
  if (!match.winnerId || match.winnerId === 'DRAW') return 0
  return String(match.winnerId) === String(user.value.id) ? 20 : -20
}

const getMatchResultClass = (match: any) => {
  if (!match.winnerId || match.winnerId === 'DRAW') return 'match-draw'
  return String(match.winnerId) === String(user.value.id) ? 'match-win' : 'match-loss'
}

const getResultText = (match: any) => {
  if (!match.winnerId || match.winnerId === 'DRAW') return 'REMÍZA'
  return String(match.winnerId) === String(user.value.id) ? 'VÝHRA' : 'PROHRA'
}

const getEloStatusClass = (match: any) => {
  const change = getUserEloChange(match)
  return change > 0 ? 'elo-plus' : (change < 0 ? 'elo-minus' : '')
}

const formatElo = (match: any) => {
  const val = getUserEloChange(match)
  return val > 0 ? `+${val}` : `${val}`
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('cs-CZ')
}
</script>

<style scoped>
.history-layout { min-height: 100vh; background-color: #161512; color: #ffffff; padding: 40px 20px; font-family: sans-serif; }
.history-container { max-width: 800px; margin: 0 auto; }
.history-header { display: flex; justify-content: space-between; border-bottom: 1px solid #312e2b; padding-bottom: 20px; margin-bottom: 30px; align-items: flex-end; }
.status-badge { color: #81b64c; font-size: 0.75rem; font-weight: 800; text-transform: uppercase; }
h1 { font-size: 2.2rem; margin: 5px 0; }
.match-list { display: flex; flex-direction: column; gap: 12px; }
.match-card { background: #262522; border: 1px solid #312e2b; border-left: 4px solid #454341; border-radius: 8px; padding: 16px 24px; display: grid; grid-template-columns: 50px 1fr 120px 120px; align-items: center; }
.match-win { border-left-color: #81b64c; }
.match-loss { border-left-color: #f87171; }
.match-draw { border-left-color: #989795; }
.match-rank { color: #989795; font-weight: bold; font-size: 1.1rem; }
.opponent .label { display: block; font-size: 0.7rem; color: #989795; text-transform: uppercase; margin-bottom: 2px; }
.opponent .name { font-weight: 600; font-size: 1.1rem; color: #fff; }
.date { font-size: 0.8rem; color: #636261; margin-top: 4px; }
.match-result { text-align: center; }
.result-label { font-weight: 900; letter-spacing: 1px; font-size: 0.9rem; }
.match-win .result-label { color: #81b64c; }
.match-loss .result-label { color: #f87171; }
.match-draw .result-label { color: #989795; }
.elo-change { text-align: right; font-weight: 800; font-size: 1.1rem; }
.elo-plus { color: #81b64c; }
.elo-minus { color: #f87171; }
.btn-text { background: transparent; color: #989795; border: none; cursor: pointer; font-weight: 600; }
.loading-state, .no-data { text-align: center; padding: 60px; background: #262522; border-radius: 12px; border: 1px solid #312e2b; }
.empty-icon { font-size: 3rem; margin-bottom: 10px; }
.btn-sub { background: #312e2b; color: #fff; padding: 12px 24px; border-radius: 6px; border: none; cursor: pointer; margin-top: 20px; font-weight: bold; }
</style>