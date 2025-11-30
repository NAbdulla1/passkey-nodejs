<script setup>
import { ref } from 'vue';
import { useUserStore } from '@/stores/user';
import { useRouter } from 'vue-router';

const email = ref('');
const router = useRouter();
const userStore = useUserStore();

const handleSubmit = async () => {
  const loginSuccess = await userStore.loginByPasskey(email.value);
  if (loginSuccess) {
    try {
      alert('Passkey login successful!');
      router.push({ name: 'home' });
    } catch (err) {
      console.error('Passkey login failed:', err);
      alert('Passkey login failed. Please try again.');
    }
  } else {
    alert('Login failed. Please check your credentials.');
  }
};
</script>
<template>
  <div class="about">
    <h1>Login by PassKey</h1>
    <form @submit.prevent="handleSubmit">
      <div>
        <label for="email">Email:</label>
        <input v-model="email" type="email" id="email" name="email" required />
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
