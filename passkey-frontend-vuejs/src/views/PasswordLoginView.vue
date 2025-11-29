<script setup>
import { ref } from 'vue';
import { useUserStore } from '@/stores/user';
import { useRouter } from 'vue-router';
import { handlePasskeyWorkflow } from '@/services/passkeyService';

const email = ref('');
const password = ref('');
const router = useRouter();
const userStore = useUserStore();

const handleSubmit = async () => {
  const loginSuccess = await userStore.loginByPassword(email.value, password.value);
  if (loginSuccess) {
    try {
      await handlePasskeyWorkflow(email.value);
      alert('Passkey registration successful!');
      router.push({ name: 'home' });
    } catch (err) {
      console.error('Passkey registration failed:', err);
      alert('Passkey registration failed. Please try again.');
    }
  } else {
    alert('Login failed. Please check your credentials.');
  }
};
</script>
<template>
  <div class="about">
    <h1>Login by Password</h1>
    <form @submit.prevent="handleSubmit">
      <div>
        <label for="email">Email:</label>
        <input v-model="email" type="email" id="email" name="email" required />
      </div>
      <div>
        <label for="password">Password:</label>
        <input v-model="password" type="password" id="password" name="password" required />
      </div>
      <button type="submit">Login</button>
    </form>
  </div>
</template>

<style>
@media (min-width: 1024px) {
  .about {
    min-height: 100vh;
    display: flex;
    align-items: center;
  }
}
</style>
