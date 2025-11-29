<script setup>
import { getHealthStatus } from '@/services/backendServices';
import { ref, onMounted } from 'vue';
const healthStatus = ref('Loading...');
onMounted(async () => {
  try {
    const status = await getHealthStatus();
    healthStatus.value = status;
  } catch (error) {
    healthStatus.value = 'Error fetching health status';
  }
});
</script>

<template>
  <h1>Health Check</h1>
  <p>{{ healthStatus }}</p>
</template>
