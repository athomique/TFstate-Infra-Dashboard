<template>
  <nav class="navbar">
    <ul class="nav-links">
      <li>
        <button @click="redirectTo('metrics-dashboard')" class="nav-button">
          Plateforme 2, Dashboard
        </button>
      </li>
      <li>
        <button @click="redirectTo('statistics')" class="nav-button">
          Plateforme 3, Dashboard
        </button>
      </li>
      <li>
        <button @click="redirectTo('infrastructure-view')" class="nav-button">
          Visualisation de l'infra
        </button>
      </li>
    </ul>
  </nav>
</template>

<script setup>
import { useRouter } from 'nuxt/app';

const router = useRouter();

const redirectTo = (route) => {
  router.push(`/${route}`);
};
</script>

<style scoped>
.navbar {
  width: 100%;
  background-color: #1e1e1e;
  padding: 20px 0;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.4);
  position: fixed;
  top: 0;
  z-index: 1000;
}

.nav-links {
  display: flex;
  justify-content: center;
  gap: 20px;
  list-style-type: none;
  padding: 0;
  margin: 0;
}

.nav-button {
  background-color: #ffab00;
  color: #121212;
  font-weight: bold;
  padding: 10px 20px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-size: 1.2em;
  transition: background-color 0.3s ease;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
}

.nav-button:hover {
  background-color: #ffcc33;
}

.nav-button:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(255, 171, 0, 0.5);
}
</style>

