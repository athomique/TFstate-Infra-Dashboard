<template>
  <div class="metrics-dashboard">
    <h1>Cloud Function Statistics</h1>

    <!-- Section pour chaque métrique Cloud Function -->
    <div class="chart-with-value" v-for="(metric, index) in metrics" :key="index">
      <!-- Conteneur de graphique -->
      <div class="chart-container">
        <h2>{{ metric.name }}</h2>
        <div class="chart-box">
          <canvas :id="'chart-' + index"></canvas>
        </div>
      </div>
      <!-- Conteneur de la valeur actuelle -->
      <div class="value-container">
        <div class="current-value">
          {{ metric.currentValue }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import Chart from 'chart.js/auto';

// Données des métriques simulées
const metrics = ref([
  { name: 'Function A Calls', currentValue: 120, data: [10, 20, 30, 40, 50, 120] },
  { name: 'Function B Calls', currentValue: 80, data: [5, 15, 25, 35, 45, 80] },
  { name: 'Function C Calls', currentValue: 200, data: [20, 60, 100, 140, 180, 200] },
]);

// Initialisation des graphiques avec une taille fixe et une échelle dynamique
onMounted(() => {
  metrics.value.forEach((metric, index) => {
    const ctx = document.getElementById(`chart-${index}`).getContext('2d');
    new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [{
          label: metric.name,
          data: metric.data,
          borderColor: '#ffab00',
          backgroundColor: 'rgba(255, 171, 0, 0.2)',
          borderWidth: 2,
        }],
      },
      options: {
        responsive: true, 
        maintainAspectRatio: false,
        scales: {
          x: {
            grid: {
              color: '#444444'
            },
            ticks: {
              color: '#ffffff'
            }
          },
          y: {
            beginAtZero: true, 
            grid: {
              color: '#444444'
            },
            ticks: {
              color: '#ffffff'
            },
            suggestedMin: Math.min(...metric.data) - 10,
            suggestedMax: Math.max(...metric.data) + 10
          }
        },
        plugins: {
          legend: {
            labels: {
              color: '#ffffff'
            }
          }
        }
      }
    });
  });
});
</script>

<style scoped>

body {
  font-family: 'Montserrat', sans-serif;
  background-color: #121212;
  color: #ffffff;
  margin-top: 250px; /* Même hauteur que la barre de navigation */
}

.metrics-dashboard {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 40px;
  padding: 20px;
  background-color: #121212;
}

.chart-with-value {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  max-width: 1200px;
  margin-bottom: 40px;
}

.chart-container {
  width: 75%;
  background-color: #333333;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.chart-box {
  width: 100%;
  height: 300px; /* Limite la hauteur des graphiques */
  overflow: hidden; /* Empêche le débordement des graphiques */
  display: flex;
  align-items: center;
  justify-content: center;
}

.value-container {
  width: 20%;
  background-color: #555555;
  padding: 20px;
  margin-left: 40px;
  border-radius: 12px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.current-value {
  font-size: 1.2em;
  font-weight: bold;
  color: #ffffff;
}

canvas {
  width: 100%; 
  height: 100%; 
}

h1 {
  font-size: 2.5em;
  color: #ffab00;
}

h2 {
  margin-bottom: 10px;
  font-size: 1.5em;
  color: #ffffff;
}
</style>

