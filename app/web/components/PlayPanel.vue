<template>
  <section class="panel">
    <div class="panel-header">
      <div>
        <p class="eyebrow">Play</p>
        <h2>Choose a game or create one</h2>
      </div>
      <button class="link-btn" type="button" @click="$emit('back')">Back</button>
    </div>

    <div class="play-actions">
      <button class="btn btn-secondary" type="button" @click="$emit('create-game')">Create new game</button>
      <span class="hint">Open games listed below</span>
    </div>

    <div class="game-list">
      <template v-if="games.length">
        <div v-for="game in games" :key="game.id" class="game-card">
          <div>
            <strong>Game {{ game.id }}</strong>
            <p>{{ game.name || 'Untitled match' }}</p>
          </div>
          <div class="game-meta">
            <span>Status: {{ game.status }}</span>
            <span>Players: {{ game.players?.length ?? 0 }}/2</span>
          </div>
          <button
            class="btn btn-primary"
            type="button"
            :disabled="game.players?.length >= 2 || game.status !== 'WAITING'"
            @click="$emit('join-game', game.id)"
          >
            Join
          </button>
        </div>
      </template>
      <div v-else class="empty-state">
        <p>No open games yet.</p>
        <p>Create one to invite a friend or join when someone else starts a match.</p>
      </div>
    </div>

    <p class="error" v-if="playError">{{ playError }}</p>
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
  (e: 'join-game', gameId: number): void
}>()
</script>

<style scoped>
.panel {
  background: white;
  border-radius: 24px;
  box-shadow: 0 20px 60px rgba(15, 23, 42, 0.08);
  padding: 28px;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}

.play-actions {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 24px;
}

.hint {
  color: #475569;
}

.game-list {
  display: grid;
  gap: 16px;
}

.game-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 18px;
  padding: 20px;
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  background: #fbfdff;
}

.game-meta {
  display: grid;
  gap: 6px;
  text-align: right;
  font-size: 0.92rem;
  color: #475569;
}

.empty-state {
  padding: 28px;
  border: 1px dashed #cbd5e1;
  border-radius: 18px;
  color: #475569;
  background: #f8fafc;
}

.btn {
  border: none;
  border-radius: 999px;
  padding: 14px 24px;
  font-weight: 600;
  cursor: pointer;
}

.btn-primary {
  background: #2563eb;
  color: white;
}

.btn-secondary {
  background: white;
  color: #1e3a8a;
  border: 1px solid #cbd5e1;
}

.link-btn {
  background: none;
  color: #2563eb;
  border: none;
  font-weight: 600;
  cursor: pointer;
}

.error {
  color: #dc2626;
  margin-top: 8px;
}
</style>
