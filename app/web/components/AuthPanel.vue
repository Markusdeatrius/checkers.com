<template>
  <section class="panel animate-fade">
    <div class="panel-header">
      <div>
        <p class="status-badge">● Zabezpečené připojení</p>
        <h2>{{ authMode === 'login' ? 'Přihlášení' : 'Nová registrace' }}</h2>
      </div>
      <button class="btn-text" type="button" @click="$emit('back')">Zpět do lobby</button>
    </div>

    <div class="tabs">
      <button
        :class="['tab', { active: authMode === 'login' }]"
        type="button"
        @click="$emit('change-mode', 'login')"
      >
        Přihlásit se
      </button>
      <button
        :class="['tab', { active: authMode === 'register' }]"
        type="button"
        @click="$emit('change-mode', 'register')"
      >
        Vytvořit účet
      </button>
    </div>

    <form @submit.prevent="submitAuth" class="auth-form">
      <!-- JMÉNO (pouze registrace) -->
      <template v-if="authMode === 'register'">
        <div class="input-group">
          <label>Uživatelské jméno</label>
          <input v-model="form.name" type="text" placeholder="Např. NabrVan" required />
        </div>
      </template>

      <!-- EMAIL -->
      <div class="input-group">
        <label>E-mail</label>
        <input v-model="form.email" type="email" placeholder="vas@email.cz" required />
      </div>

      <!-- HESLO -->
      <div class="input-group">
        <label>Heslo</label>
        <div class="password-wrapper">
          <input 
            v-model="form.password" 
            :type="showPassword ? 'text' : 'password'" 
            placeholder="••••••••" 
            required 
            minlength="6" 
          />
          <button type="button" class="eye-btn" @click="showPassword = !showPassword">
            <span v-if="showPassword">👁️‍🗨️</span>
            <span v-else>👁️</span>
          </button>
        </div>
      </div>

      <!-- POTVRZENÍ HESLA (pouze registrace) -->
      <template v-if="authMode === 'register'">
        <div class="input-group">
          <label>Potvrzení hesla</label>
          <div class="password-wrapper">
            <input 
              v-model="form.confirmPassword" 
              :type="showPassword ? 'text' : 'password'" 
              placeholder="••••••••" 
              required 
              :class="{ 'input-error': !passwordsMatch && form.confirmPassword }"
            />
          </div>
          <p v-if="!passwordsMatch && form.confirmPassword" class="error-text">
            Hesla se neshodují!
          </p>
        </div>
      </template>

      <!-- TLAČÍTKO -->
      <button 
        class="btn-main" 
        type="submit" 
        :disabled="authMode === 'register' && !passwordsMatch"
      >
        {{ authMode === 'login' ? 'Vstoupit do arény' : 'Zaregistrovat se' }}
      </button>

      <!-- ZPRÁVY -->
      <p class="message-success" v-if="authMessage">{{ authMessage }}</p>
      <p class="message-error" v-if="authError || localError">{{ authError || localError }}</p>
    </form>
  </section>
</template>

<script setup lang="ts">
import { reactive, ref, computed } from 'vue'

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
  confirmPassword: ''
})

const showPassword = ref(false)
const localError = ref('')

// Validace shody hesel
const passwordsMatch = computed(() => {
  if (authMode === 'login') return true
  return form.password === form.confirmPassword
})

const submitAuth = () => {
  localError.value = ''
  
  if (authMode === 'register' && !passwordsMatch.value) {
    localError.value = 'Hesla musí být identická.'
    return
  }

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
  background: #262522; /* Sladěno s lobby */
  border: 1px solid #312e2b;
  border-radius: 12px;
  padding: 32px;
  max-width: 460px;
  margin: 0 auto;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 30px;
}

.status-badge {
  color: #81b64c;
  font-size: 0.75rem;
  font-weight: 800;
  text-transform: uppercase;
  margin-bottom: 8px;
  display: block;
}

h2 {
  color: #fff;
  font-size: 1.8rem;
  margin: 0;
}

.tabs {
  display: flex;
  background: #1b1917;
  padding: 4px;
  border-radius: 8px;
  margin-bottom: 24px;
}

.tab {
  flex: 1;
  background: transparent;
  border: none;
  color: #989795;
  padding: 10px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
}

.tab.active {
  background: #312e2b;
  color: #fff;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.input-group label {
  font-size: 0.9rem;
  color: #bab9b7;
  font-weight: 600;
}

.input-group input {
  background: #1b1917;
  border: 1px solid #312e2b;
  border-radius: 6px;
  padding: 12px 16px;
  color: #fff;
  font-size: 1rem;
  outline: none;
}

.input-group input:focus {
  border-color: #81b64c;
}

.input-error {
  border-color: #f87171 !important;
}

.password-wrapper {
  position: relative;
  display: flex;
}

.password-wrapper input {
  width: 100%;
  padding-right: 45px;
}

.eye-btn {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.2rem;
  opacity: 0.6;
  transition: opacity 0.2s;
}

.eye-btn:hover {
  opacity: 1;
}

.btn-main {
  background: #81b64c;
  color: white;
  border: none;
  padding: 16px;
  border-radius: 6px;
  font-weight: 800;
  font-size: 1.1rem;
  cursor: pointer;
  box-shadow: 0 4px 0 #457520;
  margin-top: 10px;
  transition: transform 0.1s;
}

.btn-main:hover:not(:disabled) {
  background: #95c95a;
}

.btn-main:active:not(:disabled) {
  transform: translateY(2px);
  box-shadow: 0 2px 0 #457520;
}

.btn-main:disabled {
  background: #312e2b;
  box-shadow: none;
  color: #555;
  cursor: not-allowed;
}

.btn-text {
  background: transparent;
  color: #989795;
  border: none;
  cursor: pointer;
  font-weight: 600;
}

.btn-text:hover {
  color: #fff;
}

.error-text {
  color: #f87171;
  font-size: 0.8rem;
  margin: 0;
}

.message-success {
  background: rgba(129, 182, 76, 0.1);
  color: #81b64c;
  padding: 12px;
  border-radius: 6px;
  text-align: center;
  font-size: 0.9rem;
}

.message-error {
  background: rgba(248, 113, 113, 0.1);
  color: #f87171;
  padding: 12px;
  border-radius: 6px;
  text-align: center;
  font-size: 0.9rem;
}
</style>