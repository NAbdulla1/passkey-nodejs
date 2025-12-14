<script setup>
import { RouterLink } from 'vue-router'
</script>

<template>
  <main>
    <div class="not-found-container">
      <div class="not-found-content">
        <h1 class="error-code">404</h1>
        <h2>Page Not Found</h2>
        <p class="error-message">The page you're looking for doesn't exist or has been moved.</p>
        
        <div class="actions">
          <RouterLink to="/" class="btn btn-primary">Go Home</RouterLink>
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped>
.not-found-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 70vh;
  padding: 2rem;
}

.not-found-content {
  text-align: center;
  max-width: 600px;
}

.error-code {
  font-size: 8rem;
  font-weight: 900;
  margin: 0;
  color: var(--color-text);
  opacity: 0.1;
  line-height: 1;
}

h2 {
  margin-top: 1rem;
  margin-bottom: 0.5rem;
  color: var(--color-text);
  font-size: 2rem;
}

.error-message {
  color: var(--color-text-secondary, #666);
  font-size: 1.1rem;
  margin-bottom: 2rem;
  line-height: 1.6;
}

.actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.btn {
  padding: 0.75rem 2rem;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 500;
  transition: all 0.3s ease;
  border: none;
  cursor: pointer;
  display: inline-block;
}

.btn-primary {
  background-color: var(--color-border);
  color: var(--color-text);
  border: 2px solid var(--color-border);
}

.btn-primary:hover {
  background-color: var(--color-background);
  border-color: var(--color-text);
}

@media (max-width: 768px) {
  .error-code {
    font-size: 5rem;
  }

  h2 {
    font-size: 1.5rem;
  }

  .error-message {
    font-size: 1rem;
  }

  .btn {
    padding: 0.6rem 1.5rem;
    font-size: 0.9rem;
  }
}
</style>
