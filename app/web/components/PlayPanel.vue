<template>
  <section class="play-section">
    <div class="section-header">
      <div class="title-group">
        <span class="eyebrow">Matchmaking</span>
        <h2>Open Challenges</h2>
      </div>
      <div class="header-actions">
        <button class="btn btn-primary" type="button" @click="$emit('create-game')">
          + Create New Game
        </button>
      </div>
    </div>

    <div class="game-list">
      <div class="list-header" v-if="games.length">
        <span>Game Info</span>
        <span>Status</span>
        <span class="text-right">Action</span>
      </div>

      <template v-if="games.length">
        <div v-for="game in games" :key="game.id" class="game-row">
          <div class="game-info">
            <div class="game-icon">🏁</div>
            <div>
              <strong>{{ game.name || 'Checkers Match' }} #{{ game.id }}</strong>
              <p class="players-count">{{ game.players?.length ?? 0 }}/2 Players</p>
            </div>
          </div>
          
          <div class="game-status">
            <span :class="['status-tag', game.status.toLowerCase()]">
              {{ game.status }}
            </span>
          </div>

          <div class="game-action">
            <button
              class="join-btn"
              type="button"
              :disabled="game.players?.length >= 2 || game.status !== 'WAITING'"
              @click="$emit('join-game', game.id)"
            >
              {{ game.status === 'WAITING' ? 'Join' : 'In Progress' }}
            </button>
          </div>
        </div>
      </template>

      <div v-else class="empty-state">
        <div class="empty-icon">🏜️</div>
        <p>No active challenges at the moment.</p>
        <span>Be the first one to start a match!</span>
      </div>
    </div>

    <p class="error-msg" v-if="playError">⚠️ {{ playError }}</p>
  </section>
</template>

<script setup lang="ts">
const { games, playError } = defineProps<{
  games: Array<any>
  playError: string
}>()

const emit = defineEmits<{
  (e: 'back'): void
  (e: 'create-game'): void
  (e: 'join-game', gameId: string): void
}>()
</script>

<style scoped>
.play-section {
  color: #ffffff;
}

/* HEADER */
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 24px;
}

.eyebrow {
  color: #81b64c;
  font-size: 0.75rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 1px;
}

h2 {
  margin: 4px 0 0 0;
  font-size: 1.5rem;
}

/* LIST STYLING */
.game-list {
  background: #262522; /* Stejné jako ostatní panely */
  border-radius: 8px;
  border: 1px solid #312e2b;
  overflow: hidden;
}

.list-header {
  display: grid;
  grid-template-columns: 2fr 1fr 100px;
  padding: 12px 20px;
  background: #2b2926;
  border-bottom: 1px solid #312e2b;
  font-size: 0.75rem;
  font-weight: bold;
  color: #989795;
  text-transform: uppercase;
}

.game-row {
  display: grid;
  grid-template-columns: 2fr 1fr 100px;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #312e2b;
  transition: background 0.1s;
}

.game-row:last-child { border-bottom: none; }
.game-row:hover { background: #2d2b28; }

/* ROW CONTENT */
.game-info {
  display: flex;
  align-items: center;
  gap: 15px;
}

.game-icon {
  width: 40px;
  height: 40px;
  background: #312e2b;
  display: grid;
  place-items: center;
  border-radius: 6px;
  font-size: 1.2rem;
}

.game-info strong {
  display: block;
  font-size: 0.95rem;
}

.players-count {
  margin: 0;
  font-size: 0.8rem;
  color: #989795;
}

.status-tag {
  font-size: 0.7rem;
  font-weight: 800;
  padding: 4px 8px;
  border-radius: 4px;
  background: #312e2b;
  color: #bababa;
}

.status-tag.waiting {
  color: #81b64c;
  background: rgba(129, 182, 76, 0.1);
}

/* BUTTONS */
.btn-primary {
  background: #81b64c;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  font-weight: 800;
  cursor: pointer;
  box-shadow: 0 3px 0 #457520;
}

.btn-primary:active {
  transform: translateY(2px);
  box-shadow: 0 1px 0 #457520;
}

.join-btn {
  background: #312e2b;
  color: #ffffff;
  border: 1px solid #45423e;
  padding: 8px 12px;
  border-radius: 4px;
  font-weight: bold;
  cursor: pointer;
  width: 100%;
}

.join-btn:hover:not(:disabled) {
  background: #3d3a37;
  border-color: #81b64c;
}

.join-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  color: #666;
}

/* EMPTY STATE */
.empty-state {
  padding: 60px 20px;
  text-align: center;
  color: #989795;
}

.empty-icon { font-size: 2.5rem; margin-bottom: 10px; }
.empty-state p { margin: 0; font-weight: bold; color: white; }
.empty-state span { font-size: 0.9rem; }

.error-msg {
  margin-top: 20px;
  padding: 12px;
  background: rgba(239, 68, 68, 0.1);
  color: #f87171;
  border-radius: 6px;
  font-size: 0.9rem;
  border: 1px solid rgba(239, 68, 68, 0.2);
}

.text-right { text-align: right; }
</style>