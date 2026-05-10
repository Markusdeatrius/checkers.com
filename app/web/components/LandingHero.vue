<template>
  <section class="hero">
    <div class="hero-copy">
      <span class="eyebrow">Welcome to</span>
      <h1>Checkers.com</h1>
      <p>Fast matches, clean lobby, and easy one-click play. Sign in or choose a game to join, or start a new match instantly.</p>
      <div class="hero-actions">
        <button class="btn btn-primary" type="button" @click="$emit('open-auth')">Sign Up / Login</button>
        <button class="btn btn-secondary" type="button" @click="$emit('open-play')">Play</button>
      </div>
    </div>
    <div class="hero-card">
      <div class="stat">
        <strong>2</strong>
        <span>Players per game</span>
      </div>
      <div class="stat">
        <strong>Quick</strong>
        <span>Join created rooms instantly</span>
      </div>
      <div class="stat">
        <strong>Simple</strong>
        <span>Clear board, easy flow</span>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const emit = defineEmits(['open-auth', 'open-play'])
</script>

<style scoped>
.hero {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(240px, 1fr);
  gap: 32px;
  align-items: center;
  padding: 40px;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  border-radius: 28px;
  color: white;
}

.hero-copy .eyebrow {
  letter-spacing: 0.2em;
  text-transform: uppercase;
  opacity: 0.75;
  font-size: 0.85rem;
}

.hero-copy h1 {
  font-size: clamp(3rem, 4vw, 4.5rem);
  margin: 16px 0;
  line-height: 0.95;
}

.hero-copy p {
  max-width: 560px;
  margin-bottom: 28px;
  font-size: 1.05rem;
  opacity: 0.9;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.hero-card {
  display: grid;
  gap: 18px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 24px;
  padding: 26px;
}

.stat {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stat strong {
  font-size: 1.7rem;
}

.stat span {
  opacity: 0.82;
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

@media (max-width: 840px) {
  .hero {
    grid-template-columns: 1fr;
  }
}
</style>
