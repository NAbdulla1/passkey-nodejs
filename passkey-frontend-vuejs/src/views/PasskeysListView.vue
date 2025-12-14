<script setup>
import { ref, onMounted } from 'vue';
import { getPassKeys } from '../services/backendServices';
import { useUserStore } from '../stores/user';

const userStore = useUserStore();
const passkeys = ref([]);
const loading = ref(false);
const error = ref(null);

onMounted(async () => {
  loading.value = true;
  error.value = null;
  try {
    const response = await getPassKeys();
    passkeys.value = response;
  } catch (err) {
    console.error('Error fetching passkeys:', err);
    error.value = 'Failed to load passkeys. Please try again.';
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <main>
    <div class="passkeys-container">
      <h1>Your Passkeys</h1>
      
      <div v-if="!userStore.isUserLoggedIn" class="alert alert-warning">
        <p>Please log in to view your passkeys.</p>
      </div>

      <div v-else>
        <div v-if="loading" class="alert alert-info">
          <p>Loading passkeys...</p>
        </div>

        <div v-else-if="error" class="alert alert-error">
          <p>{{ error }}</p>
        </div>

        <div v-else-if="passkeys.length === 0" class="alert alert-info">
          <p>No passkeys registered yet.</p>
        </div>

        <div v-else>
          <div class="passkeys-list">
            <div v-for="passkey in passkeys" :key="passkey.id" class="passkey-item">
              <div class="passkey-info">
                <h3>Passkey ID</h3>
                <p class="passkey-id">{{ passkey.id }}</p>
              </div>
              <div class="passkey-details">
                <div class="detail">
                  <strong>Created:</strong>
                  <span>{{ new Date(passkey.createdAt).toLocaleString() }}</span>
                </div>
                <div class="detail">
                  <strong>Last Used:</strong>
                  <span>{{ passkey.lastUsedAt ? new Date(passkey.lastUsedAt).toLocaleString() : 'Never' }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped>
.passkeys-container {
  max-width: 1024px;
  margin: 0 auto;
  padding: 2rem;
}

h1 {
  margin-bottom: 2rem;
  color: var(--color-text);
}

.alert {
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 2rem;
}

.alert-info {
  background-color: #e3f2fd;
  color: #1976d2;
  border: 1px solid #90caf9;
}

.alert-warning {
  background-color: #fff3e0;
  color: #f57c00;
  border: 1px solid #ffb74d;
}

.alert-error {
  background-color: #ffebee;
  color: #c62828;
  border: 1px solid #ef5350;
}

.passkeys-list {
  display: grid;
  gap: 1.5rem;
}

.passkey-item {
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 1.5rem;
  background-color: var(--color-background);
}

.passkey-info {
  margin-bottom: 1rem;
}

.passkey-info h3 {
  margin: 0 0 0.5rem 0;
  font-size: 0.875rem;
  color: var(--color-text-secondary, #666);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.passkey-id {
  margin: 0;
  font-family: monospace;
  word-break: break-all;
  color: var(--color-text);
  font-size: 0.95rem;
}

.passkey-details {
  display: grid;
  gap: 1rem;
}

.detail {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-top: 1px solid var(--color-border);
}

.detail strong {
  color: var(--color-text);
  margin-right: 1rem;
}

.detail span {
  color: var(--color-text-secondary, #666);
  text-align: right;
}

@media (max-width: 768px) {
  .passkeys-container {
    padding: 1rem;
  }

  .detail {
    flex-direction: column;
    align-items: flex-start;
  }

  .detail strong {
    margin-right: 0;
    margin-bottom: 0.25rem;
  }
}
</style>
