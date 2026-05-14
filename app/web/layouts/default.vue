<template>
  <div class="app-layout">
    <!-- Sidebar Navigation -->
    <aside class="sidebar">
      <div class="sidebar-top">
        <div class="logo">
          <div class="logo-box">
            <span class="icon">🏁</span>
          </div>
          <div class="logo-text">
            <span class="title">Checkers.com</span>
            <span class="status">v2.0 Beta</span>
          </div>
        </div>

        <nav class="nav-menu">
          <NuxtLink to="/" class="nav-item">
            <span class="nav-icon">🏠</span>
            <span class="nav-label">Home</span>
          </NuxtLink>
          <NuxtLink to="/play" class="nav-item">
            <span class="nav-icon">⚔️</span>
            <span class="nav-label">Play</span>
          </NuxtLink>
          <NuxtLink to="/leaderboard" class="nav-item">
            <span class="nav-icon">🏆</span>
            <span class="nav-label">Leaderboard</span>
          </NuxtLink>
          <NuxtLink to="/history" class="nav-item">
            <span class="nav-icon">📖</span>
            <span class="nav-label">History</span>
          </NuxtLink>
        </nav>
      </div>

      <div class="sidebar-bottom">
        <div class="server-status">
          <div class="dot green"></div>
          <span>Server: Optimal</span>
        </div>
      </div>
    </aside>

    <!-- Main Content Context -->
    <main class="main-view">
      <div class="view-scroll">
        <slot />
      </div>
    </main>
  </div>
</template>

<style scoped>
/* APP-WIDE VARIABLES (Match Chess style) */
:host {
  --sidebar-width: 240px;
  --bg-darkest: #161512;
  --bg-sidebar: #262522;
  --text-primary: #ffffff;
  --text-secondary: #989795;
  --accent: #81b64c;
  --nav-hover: #312e2b;
}

.app-layout {
  display: flex;
  height: 100vh;
  background-color: #161512; /* Deep matte black */
  color: #ffffff;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  overflow: hidden;
}

/* SIDEBAR */
.sidebar {
  width: 240px;
  background-color: #262522;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  border-right: 1px solid #312e2b;
}

.sidebar-top {
  padding: 20px 0;
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 24px 30px 24px;
}

.logo-box {
  background: #312e2b;
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
  border-radius: 8px;
  font-size: 1.2rem;
}

.title {
  display: block;
  font-weight: 800;
  font-size: 1.1rem;
  letter-spacing: -0.5px;
}

.status {
  font-size: 0.7rem;
  color: #81b64c;
  font-weight: bold;
  text-transform: uppercase;
}

/* NAVIGATION */
.nav-menu {
  display: flex;
  flex-direction: column;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 14px 24px;
  color: #bababa;
  text-decoration: none;
  font-weight: 600;
  font-size: 0.95rem;
  transition: all 0.1s ease;
  border-left: 4px solid transparent;
}

.nav-item:hover {
  background-color: #312e2b;
  color: #ffffff;
}

.nav-item.router-link-active {
  background-color: #312e2b;
  color: #ffffff;
  border-left-color: #81b64c;
}

.nav-icon {
  font-size: 1.1rem;
  opacity: 0.8;
}

/* SIDEBAR BOTTOM */
.sidebar-bottom {
  padding: 20px 24px;
  background: #21201d;
  border-top: 1px solid #312e2b;
}

.server-status {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.75rem;
  color: #989795;
  font-weight: bold;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.dot.green { background: #81b64c; box-shadow: 0 0 8px #81b64c; }

/* MAIN VIEW */
.main-view {
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
  background-image: radial-gradient(circle at top right, #1a1917, #161512);
}

.view-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 40px;
}

/* SCROLLBAR STYLE */
.view-scroll::-webkit-scrollbar {
  width: 8px;
}

.view-scroll::-webkit-scrollbar-track {
  background: #161512;
}

.view-scroll::-webkit-scrollbar-thumb {
  background: #312e2b;
  border-radius: 4px;
}

.view-scroll::-webkit-scrollbar-thumb:hover {
  background: #3d3a37;
}

/* MOBILE RESPONSIVE */
@media (max-width: 900px) {
  .app-layout { flex-direction: column; }
  .sidebar {
    width: 100%;
    height: auto;
    flex-direction: row;
    align-items: center;
    padding: 10px 15px;
  }
  .logo, .sidebar-bottom, .nav-label { display: none; }
  .nav-menu { flex-direction: row; flex: 1; justify-content: space-around; }
  .nav-item { padding: 10px; border-left: none; border-bottom: 3px solid transparent; }
  .nav-item.router-link-active { border-bottom-color: #81b64c; }
  .view-scroll { padding: 20px; }
}
</style>