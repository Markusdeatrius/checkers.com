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