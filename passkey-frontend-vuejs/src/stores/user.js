import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { isLoggedIn, loginByPassword as loginWithPassword } from '@/services/backendServices'

export const useUserStore = defineStore('user', () => {
  const loggedIn = ref(false)
  const userData = ref(null)
  const isUserLoggedIn = computed(() => loggedIn.value)

  async function checkLoginStatus() {
    loggedIn.value = await isLoggedIn().then(data => {
      userData.value = data.user || null
      return data.loggedIn
    });
  }

  async function loginByPassword(email, password) {
    loggedIn.value = await loginWithPassword(email, password).then(data => {
      userData.value = data.user || null
      return true;
    }).catch(() => {
      userData.value = null;
      return false;
    });
    return loggedIn.value;
  }

  return { isUserLoggedIn, userData, checkLoginStatus, loginByPassword }
});
