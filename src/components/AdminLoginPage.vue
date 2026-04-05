<template>
  <main class="login-page">
    <section class="login-card">
      <p class="eyebrow">Heritage Hues</p>
      <h1>Admin Login</h1>
      <p class="copy">Use your admin credentials to access the dashboard.</p>

      <p v-if="error" class="status error">{{ error }}</p>

      <form class="login-form" @submit.prevent="submit">
        <label>
          Email
          <input v-model.trim="email" type="email" autocomplete="username" required />
        </label>

        <label>
          Password
          <input v-model="password" type="password" autocomplete="current-password" required />
        </label>

        <label class="remember-row">
          <input v-model="rememberMe" type="checkbox" />
          <span>Remember me</span>
        </label>

        <button type="submit" :disabled="loading">
          {{ loading ? 'Signing in...' : 'Login' }}
        </button>
      </form>
    </section>
  </main>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  error: {
    type: String,
    default: '',
  },
  loading: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['login'])

const email = ref('')
const password = ref('')
const rememberMe = ref(false)

const submit = () => {
  emit('login', {
    email: email.value,
    password: password.value,
    remember_me: rememberMe.value,
  })
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 1.5rem;
  background: linear-gradient(180deg, #2f120d, #4b1b14 45%, #f3e3c6 160%);
}

.login-card {
  width: min(100%, 420px);
  border-radius: 20px;
  border: 1px solid rgba(239, 200, 133, 0.25);
  background: rgba(255, 248, 234, 0.96);
  padding: 1.5rem;
  box-shadow: 0 24px 40px rgba(23, 8, 6, 0.28);
}

.eyebrow {
  margin: 0;
  color: #8a3a24;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-size: 0.78rem;
}

h1 {
  margin: 0.45rem 0 0;
  color: #2f120d;
}

.copy {
  margin: 0.55rem 0 0;
  color: #6f574a;
}

.status {
  margin-top: 0.8rem;
}

.status.error {
  color: #8a2d1d;
}

.login-form {
  margin-top: 1rem;
  display: grid;
  gap: 0.8rem;
}

label {
  display: grid;
  gap: 0.3rem;
  color: #4a2b22;
}

input {
  width: 100%;
  border: 1px solid #dfc199;
  border-radius: 10px;
  padding: 0.7rem 0.8rem;
  font: inherit;
  background: #fffdf8;
}

.remember-row {
  display: flex;
  align-items: center;
  gap: 0.55rem;
}

.remember-row input {
  width: 1rem;
  height: 1rem;
}

button {
  border: 0;
  border-radius: 999px;
  background: linear-gradient(120deg, #a53a2e, #7d231e);
  color: #fff6e7;
  padding: 0.8rem 1rem;
  cursor: pointer;
}

button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}
</style>
