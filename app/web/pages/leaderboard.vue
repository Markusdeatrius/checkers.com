<template>
  <div class="leaderboard-container">
    <div class="leaderboard-header">
      <div class="header-top">
        <!-- Tlačítko Zpět -->
        <router-link to="/" class="back-btn">
          <span class="arrow">←</span> Back to Overview
        </router-link>   
      </div>
      <div class="header-main">
        <span class="status-badge">● Hall of Fame</span>
        <h1>Community Leaderboards</h1>
        <p>Competitive rankings across the arena</p>
      </div>
      
      <div class="tabs">
        <button 
          class="tab-btn" 
          :class="{ active: activeTab === 'rankers' }"
          @click="activeTab = 'rankers'"
        >
          🏆 Rankers
        </button>
        <button 
          class="tab-btn" 
          :class="{ active: activeTab === 'winners' }"
          @click="activeTab = 'winners'"
        >
          ⭐ Winners
        </button>
        <button 
          class="tab-btn" 
          :class="{ active: activeTab === 'shame' }"
          @click="activeTab = 'shame'"
        >
          💀 Wall of Shame
        </button>
      </div>
    </div>

    <div class="leaderboard-content">
      <!-- Rankers Tab -->
      <div v-if="activeTab === 'rankers'" class="board animate-fade">
        <div class="board-info">Top 50 players by current Elo rating</div>
        <div v-if="loading" class="state-msg">Načítám mistry...</div>
        <div v-else-if="rankers.length === 0" class="state-msg">Zatím žádní mistři.</div>
        <div v-else class="board-list">
          <div v-for="player in rankers" :key="player.id" class="player-row">
            <div class="rank">#{{ player.rank }}</div>
            <div class="player-info">
              <span class="avatar">👤</span>
              <span class="name">{{ player.name }}</span>
            </div>
            <div class="stats-group">
              <div class="stat-item">
                <span class="label">Games</span>
                <span class="value">{{ player.gamesPlayed }}</span>
              </div>
              <div class="stat-item highlight">
                <span class="label">Rating</span>
                <span class="value elo">{{ player.eloRating }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Winners Tab -->
      <div v-if="activeTab === 'winners'" class="board animate-fade">
        <div class="board-info">Top 50 by Net Performance (Wins - Losses)</div>
        <div v-if="loading" class="state-msg">Hledám vítěze...</div>
        <div v-else-if="winners.length === 0" class="state-msg">Nikdo zatím nedominuje.</div>
        <div v-else class="board-list">
          <div v-for="player in winners" :key="player.id" class="player-row">
            <div class="rank">#{{ player.rank }}</div>
            <div class="player-info">
              <span class="avatar">👤</span>
              <span class="name">{{ player.name }}</span>
            </div>
            <div class="stats-group">
              <div class="stat-item">
                <span class="label">W/L Record</span>
                <span class="value compact">
                  <span class="win-txt">{{ player.wins ?? 0 }}W</span>
                  <span class="sep">/</span>
                  <span class="loss-txt">{{ player.losses ?? 0 }}L</span>
                </span>
              </div>
              <div class="stat-item highlight">
                <span class="label">Net Wins</span>
                <span class="value net" :class="{ positive: (player.net ?? 0) > 0, negative: (player.net ?? 0) < 0 }">
                  {{ (player.net ?? 0) > 0 ? '+' : '' }}{{ player.net ?? 0 }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Wall of Shame Tab -->
      <div v-if="activeTab === 'shame'" class="board animate-fade">
        <div class="board-info shame-info">Most persistent players (Net Losses)</div>
        <div v-if="loading" class="state-msg">Sčítám ostudu...</div>
        <div v-else-if="shame.length === 0" class="state-msg">Žádná ostuda v dohledu.</div>
        <div v-else class="board-list">
          <div v-for="player in shame" :key="player.id" class="player-row shame-row">
            <div class="rank">#{{ player.rank }}</div>
            <div class="player-info">
              <span class="avatar">💀</span>
              <span class="name">{{ player.name }}</span>
            </div>
            <div class="stats-group">
              <div class="stat-item">
                <span class="label">W/L Record</span>
                <span class="value compact">
                  <span class="win-txt">{{ player.wins ?? 0 }}W</span>
                  <span class="sep">/</span>
                  <span class="loss-txt">{{ player.losses ?? 0 }}L</span>
                </span>
              </div>
              <div class="stat-item highlight">
                <span class="label">Net Diff</span>
                <span class="value net negative">{{ player.net ?? 0 }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface Player {
  rank: number
  id: string
  name: string
  eloRating: number
  gamesPlayed?: number
  wins?: number
  losses?: number
  net?: number
}

const activeTab = ref<'rankers' | 'winners' | 'shame'>('rankers')
const rankers = ref<Player[]>([])
const winners = ref<Player[]>([])
const shame = ref<Player[]>([])
const loading = ref(false)

const fetchRankers = async () => {
  try {
    const res = await fetch('/api/matches/leaderboard/rankers')
    rankers.value = await res.json()
  } catch (err) { console.error(err) }
}

const fetchWinners = async () => {
  try {
    const res = await fetch('/api/matches/leaderboard/winners')
    winners.value = await res.json()
  } catch (err) { console.error(err) }
}

const fetchShame = async () => {
  try {
    const res = await fetch('/api/matches/leaderboard/wall-of-shame')
    shame.value = await res.json()
  } catch (err) { console.error(err) }
}

const fetchAll = async () => {
  loading.value = true
  await Promise.all([fetchRankers(), fetchWinners(), fetchShame()])
  loading.value = false
}

onMounted(() => {
  fetchAll()
})
</script>

<style scoped>
.leaderboard-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 40px 20px;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

.leaderboard-header {
  margin-bottom: 30px;
}

.header-top {
  margin-bottom: 20px;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #636261; /* Utlumená barva */
  text-decoration: none;
  font-size: 0.85rem;
  font-weight: 600;
  transition: all 0.2s ease;
  padding: 6px 0;
}

.back-btn .arrow {
  font-size: 1.1rem;
  transition: transform 0.2s ease;
}

.back-btn:hover {
  color: #81b64c; /* Změna na zelenou při hoveru */
}

.back-btn:hover .arrow {
  transform: translateX(-4px); /* Animace šipky */
}

.status-badge {
  color: #81b64c;
  font-size: 0.75rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 1.2px;
}

h1 {
  font-size: 2.2rem;
  margin: 8px 0;
  color: #dadada; /* Lomená bílá pro menší oční únavu */
}

p {
  color: #a1a1a1;
  margin: 0 0 25px 0;
  font-size: 1rem;
}

/* Tabs Design - Moderní herní přepínač */
.tabs {
  display: flex;
  background: #21201d;
  padding: 5px;
  border-radius: 10px;
  gap: 5px;
  border: 1px solid #312e2b;
}

.tab-btn {
  flex: 1;
  padding: 12px;
  background: transparent;
  border: none;
  color: #989795;
  font-weight: 700;
  cursor: pointer;
  border-radius: 7px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.tab-btn:hover {
  color: #dadada;
  background: rgba(255, 255, 255, 0.03);
}

.tab-btn.active {
  background: #2b2926;
  color: #fff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

/* Board Design */
.board {
  background: #262522;
  border-radius: 10px;
  border: 1px solid #312e2b;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
}

.board-info {
  padding: 16px 24px;
  background: rgba(129, 182, 76, 0.1); /* Jemný zelený nádech pro Rankers */
  font-size: 0.85rem;
  color: #81b64c;
  font-weight: 700;
  border-bottom: 1px solid #312e2b;
  letter-spacing: 0.5px;
}

/* Specifické barvy pro Wall of Shame */
.shame-info {
  background: rgba(248, 113, 113, 0.08);
  color: #f87171;
}

.board-list {
  display: flex;
  flex-direction: column;
}

.player-row {
  display: grid;
  grid-template-columns: 65px 1fr auto;
  align-items: center;
  padding: 18px 24px;
  border-bottom: 1px solid #312e2b;
  transition: background 0.15s ease;
  background: #262522;
}

.player-row:last-child {
  border-bottom: none;
}

.player-row:hover {
  background: #2d2c29;
}

/* Jméno a Avatar */
.rank {
  font-weight: 900;
  color: #636261;
  font-size: 1.1rem;
}

.player-info {
  display: flex;
  align-items: center;
  gap: 15px;
}

.avatar {
  font-size: 1.2rem;
  opacity: 0.8;
}

.name {
  color: #e8e8e8; /* Elegantní lomená bílá */
  font-weight: 600;
  font-size: 1.05rem;
  letter-spacing: 0.2px;
}

/* Styling statistik vpravo */
.stats-group {
  display: flex;
  gap: 35px;
  align-items: center;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.label {
  font-size: 0.65rem;
  text-transform: uppercase;
  color: #636261;
  font-weight: 800;
  margin-bottom: 4px;
  letter-spacing: 0.5px;
}

.value {
  font-weight: 800;
  font-size: 1.05rem;
  color: #d1d1d1;
}

/* Barevné akcenty hodnot */
.value.elo {
  color: #81b64c;
}

.value.net.positive { color: #81b64c; }
.value.net.negative { color: #f87171; }

.win-txt { color: #81b64c; font-weight: 700; }
.loss-txt { color: #f87171; font-weight: 700; }
.sep { color: #444; margin: 0 4px; }

/* Wall of Shame specifické úpravy */
.shame-row .name {
  color: #efdfdf;
}

.shame-row:hover {
  background: #332a2a; /* Temně rudý nádech při najetí */
}

/* Stavy a animace */
.state-msg {
  padding: 80px 20px;
  text-align: center;
  color: #636261;
  font-size: 1.1rem;
}

.animate-fade {
  animation: fadeIn 0.4s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Responzivita */
@media (max-width: 700px) {
  .player-row {
    padding: 15px;
    grid-template-columns: 45px 1fr auto;
  }
  .stats-group { gap: 15px; }
  .label { display: none; }
  .stats-group { flex-direction: column; gap: 5px; align-items: flex-end; }
  h1 { font-size: 1.8rem; }
}
</style>