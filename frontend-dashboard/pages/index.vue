<template>
  <div class="home-container">
    <div class="content">
      <h1>Welcome to the Infrastructure Dashboard</h1>

      <!-- Paragraphe principal présentant le projet -->
      <p class="project-description">
        This dashboard provides real-time insights into your cloud infrastructure, allowing you to track essential metrics such as the number of virtual machines (VMs), storage evolution, and CPU usage across multiple cloud platforms including Google Cloud, AWS, and Azure.
        Our mission is to give you full visibility over your resources to help ensure your systems are performing optimally.
      </p>

      <!-- Paragraphe secondaire présentant Plateforme 2 et 3 selon IDC -->
      <p class="platform-concepts">
        According to IDC, Platform 2 represents traditional IT environments based on virtual machines and dedicated resources. 
        Platform 3 focuses on cloud-native applications, utilizing containerization, microservices, and distributed architectures. 
        This dashboard supports monitoring both platforms for comprehensive infrastructure management.
      </p>

      <!-- Slider pour sélectionner Plateforme 2 ou Plateforme 3 -->
      <div class="slider-container" @click="togglePlatform">
        <div class="option left" :class="{ active: selectedPlatform === '2' }">
          Platform 2
        </div>
        <div class="option right" :class="{ active: selectedPlatform === '3' }">
          Platform 3
        </div>
      </div>

      <!-- Bouton pour aller au Metrics Dashboard ou Statistiques -->
      <button @click="redirectToPage" class="dashboard-link">
        Go to Dashboard
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'nuxt/app';

// Variable pour suivre la sélection de la plateforme
const selectedPlatform = ref('2');

// Fonction pour basculer entre Plateforme 2 et Plateforme 3
const togglePlatform = () => {
  selectedPlatform.value = selectedPlatform.value === '2' ? '3' : '2';
};

// Router pour la navigation
const router = useRouter();

// Fonction pour rediriger dynamiquement
const redirectToPage = () => {
  if (selectedPlatform.value === '2') {
    router.push('/metrics-dashboard?platform=2');
  } else {
    router.push('/statistics');
  }
};

</script>

<style scoped>

/* Style conservé pour cohérence */
@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700&display=swap');

* {
  font-family: 'Montserrat', sans-serif;
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  height: 100%;
  margin-top: 180px; 
}

.home-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #121212;
  color: #ffffff;
  text-align: center;
  padding: 20px;
}

.content {
  max-width: 800px;
  background-color: #1e1e1e;
  padding: 30px;
  border-radius: 10px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.6);
}

h1 {
  font-size: 3em;
  color: #ffab00;
  margin-bottom: 20px;
}

.project-description {
  font-size: 1.2em;
  line-height: 1.44;
  color: #cfcfcf;
  margin-bottom: 30px;
}

.platform-concepts {
  font-size: 1em;
  color: #a0a0a0;
  margin-bottom: 45px;
}

.slider-container {
  display: flex;
  justify-content: space-between;
  width: 300px;
  height: 50px;
  background-color: #333;
  border-radius: 25px;
  cursor: pointer;
  margin: 0 auto 40px auto;
}

.option { 
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1em;
  font-weight: bold;
  color: #ffffff;
  transition: color 0.3s ease;
}

.option.left {
  border-radius: 25px 0 0 25px;
} 

.option.right {
  border-radius: 0 25px 25px 0;
}

.active {
  background-color: #ffab00;
  color: #121212;
  border-radius: inherit;
}

.dashboard-link {
  display: inline-block;
  padding: 15px 30px;
  background-color: #ffab00;
  color: #121212;
  font-weight: bold;
  border-radius: 8px;
  text-decoration: none;
  transition: background-color 0.3s ease;
}

.dashboard-link:hover {
  background-color: #ffcc33;
}

</style>

