<template>
  <section class="panel">
    <div class="panel-header">
      <div>
        <p class="eyebrow">Account</p>
        <h2>{{ authMode === 'login' ? 'Login to your account' : 'Create a new account' }}</h2>
      </div>
      <button class="link-btn" type="button" @click="$emit('back')">Back</button>
    </div>

    <div class="tabs">
      <button
        :class="['tab', { active: authMode === 'login' }]"
        type="button"
        @click="$emit('change-mode', 'login')"
      >
        Login
      </button>
      <button
        :class="['tab', { active: authMode === 'register' }]"
        type="button"
        @click="$emit('change-mode', 'register')"
      >
        Register
      </button>
    </div>

    <form @submit.prevent="submitAuth" class="auth-form">
      <template v-if="authMode === 'register'">
        <label>
          Name
          <input v-model="form.name" type="text" placeholder="Your name" required />
        </label>
      </template>
      <label>
        Email
        <input v-model="form.email" type="email" placeholder="you@example.com" required />
      </label>
      <label>
        Password
        <input v-model="form.password" type="password" placeholder="••••••••" required minlength="6" />
      </label>
      <button class="btn btn-primary" type="submit">{{ authMode === 'login' ? 'Login' : 'Register' }}</button>
      <p class="message" v-if="authMessage">{{ authMessage }}</p>
      <p class="error" v-if="authError">{{ authError }}</p>
    </form>
  </section>
</template>

<script setup lang="ts">
const { authMode, authMessage, authError } = defineProps<{
  authMode: 'login' | 'register'
  authMessage: string
  authError: string
}>()

const emit = defineEmits<{
  (e: 'back'): void
  (e: 'change-mode', mode: 'login' | 'register'): void
  (e: 'submit', payload: { authMode: 'login' | 'register'; name: string; email: string; password: string }): void
}>()

const form = reactive({
  name: '',
  email: '',
  password: '',
})

const submitAuth = () => {
  emit('submit', {
    authMode,
    name: form.name,
    email: form.email,
    password: form.password,
  })
}
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

.tabs {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.tab {
  border: 1px solid #cbd5e1;
  background: #f8fafc;
  color: #0f172a;
  padding: 12px 18px;
  border-radius: 999px;
  cursor: pointer;
}

.tab.active {
  background: #2563eb;
  color: white;
  border-color: transparent;
}

.auth-form {
  display: grid;
  gap: 16px;
  max-width: 420px;
}

.auth-form label {
  display: grid;
  gap: 8px;
  font-size: 0.95rem;
  color: #334155;
}

.auth-form input {
  border: 1px solid #cbd5e1;
  border-radius: 14px;
  padding: 14px 16px;
  font-size: 1rem;
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

.message {
  color: #0f766e;
  margin-top: 8px;
}
</style>
