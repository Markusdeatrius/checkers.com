<template>
  <div class="leaderboard">
    <h1>Leaderboard</h1>
    <div v-if="loading" class="loading">Loading...</div>
    <div v-else class="table-container">
      <table class="leaderboard-table">
        <thead>
          <tr>
            <th>Rank</th>
            <th>Name</th>
            <th>Elo</th>
            <th>Games</th>
            <th>Win Rate</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="player in players" :key="player.id" :class="`rank-${player.rank}`">
            <td class="rank">
              <span v-if="player.rank === 1" class="medal">🥇</span>
              <span v-else-if="player.rank === 2" class="medal">🥈</span>
              <span v-else-if="player.rank === 3" class="medal">🥉</span>
              <span v-else>{{ player.rank }}</span>
            </td>
            <td class="name">{{ player.name }}</td>
            <td class="elo">{{ player.eloRating }}</td>
            <td class="games">{{ player.gamesPlayed }}</td>
            <td class="winrate">{{ player.winRate }}%</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const apiBase = useRuntimeConfig().public.NUXT_PUBLIC_API_BASE || ''

interface LeaderboardEntry {
  rank: number
  id: number
  name: string
  eloRating: number
  gamesPlayed: number
  winRate: number
  totalWins: number
}

const players = ref<LeaderboardEntry[]>([])
const loading = ref(true)

onMounted(async () => {
  try {
    const response = await fetch(`${apiBase}/api/matches/leaderboard`)
    if (!response.ok) throw new Error('Failed to fetch leaderboard')
    players.value = await response.json()
  } catch (error) {
    console.error('Error fetching leaderboard:', error)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.leaderboard {
  max-width: 900px;
  margin: 20px auto;
  padding: 20px;
}

h1 {
  text-align: center;
  margin-bottom: 30px;
  font-size: 2em;
  color: #111827;
}

.loading {
  text-align: center;
  font-size: 1.2em;
  color: #666;
}

.table-container {
  overflow-x: auto;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.leaderboard-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
}

thead {
  background: #f3f4f6;
  font-weight: 600;
  border-bottom: 2px solid #e5e7eb;
}

th {
  padding: 14px;
  text-align: left;
  color: #374151;
}

tbody tr {
  border-bottom: 1px solid #e5e7eb;
  transition: background 0.2s;
}

tbody tr:hover {
  background: #f9fafb;
}

tbody tr.rank-1 {
  background: #fef3c7;
}

tbody tr.rank-2 {
  background: #f3f4f6;
}

tbody tr.rank-3 {
  background: #fce7f3;
}

td {
  padding: 14px;
  color: #1f2937;
}

.medal {
  font-size: 1.3em;
  margin-right: 8px;
}

.rank {
  font-weight: 600;
  color: #6b7280;
  width: 60px;
}

.name {
  font-weight: 500;
}

.elo {
  font-weight: 600;
  color: #059669;
}

.games {
  text-align: center;
}

.winrate {
  text-align: right;
  color: #d97706;
  font-weight: 500;
}
</style>
