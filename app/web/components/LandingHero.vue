<template>
  <section class="hero-container">
    <div class="hero-content">
      <div class="badge">Season 1</div>
      <h1>Master the board, <br><span class="highlight">claim your rank.</span></h1>
      <p>
        Experience one of the best checkers arena. Join other players in real-time matches 
        and climb the ranks.
      </p>
      
      <div class="hero-btns">
        <button class="btn-main" @click="$emit('open-auth')">
          Start Playing Now
        </button>
        <button class="btn-alt" @click="$emit('open-play')">
          View Open Lobby
        </button>
      </div>
    </div>

    <div class="hero-visual">
      <div class="feature-card">
        <div class="feature-item">
          <div class="icon">⚡</div>
          <div class="text">
            <strong>Instant Match</strong>
            <span>Zero wait time pairing</span>
          </div>
        </div>
        <div class="feature-item">
          <div class="icon">🏆</div>
          <div class="text">
            <strong>Elo System</strong>
            <span>Track your progress</span>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const emit = defineEmits(['open-auth', 'open-play'])
</script>

<style scoped>
.hero-container {
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  gap: 40px;
  align-items: center;
  padding: 60px 40px;
  background: #21201d; /* Deep matte surface */
  border-radius: 12px;
  border: 1px solid #312e2b;
  overflow: hidden;
  position: relative;
}

/* DECORATION */
.hero-container::before {
  content: "";
  position: absolute;
  top: -100px;
  right: -100px;
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, rgba(129, 182, 76, 0.05) 0%, transparent 70%);
  pointer-events: none;
}

/* CONTENT LEFT */
.badge {
  display: inline-block;
  padding: 6px 12px;
  background: #312e2b;
  color: #81b64c;
  font-size: 0.75rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  border-radius: 4px;
  margin-bottom: 24px;
}

h1 {
  font-size: clamp(2.5rem, 5vw, 3.8rem);
  line-height: 1.1;
  margin: 0 0 24px 0;
  color: #ffffff;
  font-weight: 800;
}

.highlight {
  color: #81b64c;
}

p {
  font-size: 1.15rem;
  line-height: 1.6;
  color: #989795;
  margin-bottom: 36px;
  max-width: 500px;
}

/* BUTTONS (Tactile Style) */
.hero-btns {
  display: flex;
  gap: 16px;
}

.btn-main, .btn-alt {
  padding: 16px 32px;
  font-size: 1.1rem;
  font-weight: 800;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.1s ease;
}

.btn-main {
  background: #81b64c;
  color: white;
  box-shadow: 0 5px 0 #457520;
}

.btn-main:hover {
  background: #95bb4a;
}

.btn-main:active {
  transform: translateY(3px);
  box-shadow: 0 2px 0 #457520;
}

.btn-alt {
  background: #312e2b;
  color: #bababa;
  box-shadow: 0 5px 0 #1b1917;
}

.btn-alt:hover {
  background: #3d3a37;
  color: white;
}

.btn-alt:active {
  transform: translateY(3px);
  box-shadow: 0 2px 0 #1b1917;
}

/* FEATURE CARD RIGHT */
.feature-card {
  background: #262522;
  padding: 30px;
  border-radius: 16px;
  border: 1px solid #312e2b;
  display: flex;
  flex-direction: column;
  gap: 24px;
  box-shadow: 0 20px 40px rgba(0,0,0,0.4);
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 20px;
}

.icon {
  font-size: 1.8rem;
  background: #312e2b;
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
}

.text strong {
  display: block;
  font-size: 1rem;
  color: #ffffff;
  margin-bottom: 2px;
}

.text span {
  font-size: 0.85rem;
  color: #989795;
}

/* RESPONSIVE */
@media (max-width: 1000px) {
  .hero-container {
    grid-template-columns: 1fr;
    padding: 40px 30px;
    text-align: center;
  }

  p { margin: 0 auto 36px auto; }
  .hero-btns { justify-content: center; }
  .hero-visual { display: none; } /* Skryjeme na mobilu pro čistotu */
}
</style>