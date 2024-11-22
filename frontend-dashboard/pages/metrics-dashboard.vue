<template>
  <div class="metrics-dashboard">
    <!-- Graphique pour le nombre de VMs -->
    <div class="chart-with-value">
      <div class="chart-container">
        <h2>Nombre de VMs</h2>
        <canvas id="vmChart"></canvas>
      </div>
      <div class="value-container">
        <p class="current-value">{{ lastVmCount }}</p> <!-- Affichage dynamique -->
      </div>
    </div>

    <!-- Graphique pour l'utilisation du CPU -->
    <div class="chart-with-value">
      <div class="chart-container">
        <h2>Utilisation CPU (%)</h2>
        <canvas id="cpuChart"></canvas>
      </div>
      <div class="value-container">
        <p class="current-value">{{ lastCpuUsage !== null ? lastCpuUsage.toFixed(3) : '0.000' }}%</p> <!-- Affichage dynamique -->
      </div>
    </div>

    <!-- Graphique pour les écritures sur disque -->
    <div class="chart-with-value">
      <div class="chart-container">
        <h2>Écritures sur disque (octets)</h2>
        <canvas id="writeChart"></canvas>
      </div>
      <div class="value-container">
        <p class="current-value">{{ lastWriteBytes !== null ? lastWriteBytes.toFixed(3) : '0.000' }} octets</p> <!-- Affichage dynamique -->
      </div>
    </div>

    <!-- Graphique pour les lectures sur disque -->
    <div class="chart-with-value">
      <div class="chart-container">
        <h2>Lectures sur disque (octets)</h2>
        <canvas id="readChart"></canvas>
      </div>
      <div class="value-container">
        <p class="current-value">{{ lastReadBytes !== null ? lastReadBytes.toFixed(3) : '0.000' }} octets</p> <!-- Affichage dynamique -->
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import Chart from 'chart.js/auto';
import io from 'socket.io-client';

const socket = io('http://localhost:3333');  // Connexion au backend

// Références pour les dernières valeurs et les graphiques
const lastCpuUsage = ref(0);
const lastReadBytes = ref(0);
const lastWriteBytes = ref(0);
const lastVmCount = ref(0);

// Références pour les graphiques
let cpuChart, readChart, writeChart, vmChart;

// Fonction pour créer un graphique
function createChart(ctx, label) {
  return new Chart(ctx, {
    type: 'line',
    data: {
      labels: [],
      datasets: [{
        label: label,
        data: [],
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1
      }]
    },
    options: {
      responsive: true,
      scales: {
        x: { title: { display: true, text: 'Temps' }},
        y: { title: { display: true, text: label }}
      }
    }
  });
}

// Fonction pour mettre à jour un graphique
function updateChart(chart, newData) {
  const currentTime = new Date().toLocaleTimeString();  // Heure actuelle
  chart.data.labels.push(currentTime);
  chart.data.datasets[0].data.push(newData);

  // Limiter à 24 points
  if (chart.data.labels.length > 24) {
    chart.data.labels.shift();
    chart.data.datasets[0].data.shift();
  }
  chart.update();
}

onMounted(() => {
  // Créer les graphiques
  const vmCtx = document.getElementById('vmChart').getContext('2d');
  vmChart = createChart(vmCtx, 'Nombre de VMs');

  const cpuCtx = document.getElementById('cpuChart').getContext('2d');
  cpuChart = createChart(cpuCtx, 'Utilisation CPU (%)');

  const readCtx = document.getElementById('readChart').getContext('2d');
  readChart = createChart(readCtx, 'Lectures sur disque (octets)');

  const writeCtx = document.getElementById('writeChart').getContext('2d');
  writeChart = createChart(writeCtx, 'Écritures sur disque (octets)');

  // Recevoir les métriques en temps réel depuis le backend
  socket.on('updateMetrics', (metrics) => {
    // Mettre à jour les graphiques
    updateChart(vmChart, metrics.vmCount);
    updateChart(cpuChart, metrics.cpuUsage);
    updateChart(readChart, parseInt(metrics.readBytes, 10) || 0); // Conversion en nombre
    updateChart(writeChart, parseInt(metrics.writeBytes, 10) || 0); // Conversion en nombre

    // Mettre à jour les dernières valeurs
    lastVmCount.value = metrics.vmCount !== undefined ? metrics.vmCount : 0;
    lastCpuUsage.value = metrics.cpuUsage !== undefined ? metrics.cpuUsage : 0;
    lastReadBytes.value = metrics.readBytes !== undefined ? parseInt(metrics.readBytes, 10) : 0;
    lastWriteBytes.value = metrics.writeBytes !== undefined ? parseInt(metrics.writeBytes, 10) : 0;
  });
});
</script>

<style scoped>

body {
  font-family: 'Montserrat', sans-serif;
  background-color: #121212;
  color: #ffffff;
  margin-top: 180px; 
}

.metrics-dashboard {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 40px;
  padding: 20px;
  background-color: #121212; /* Fond sombre */
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

.value-container {
  width: 20%;
  background-color: #555555;
  padding: 20px;
  margin-left: 40px; /* Espace ajouté entre le graphique et la box */
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
  width: 100%; /* Utilise toute la largeur disponible dans la chart-container */
  height: 250px;
}

h2 {
  margin-bottom: 10px;
  font-size: 1.5em;
  color: #ffffff;
}
</style>

