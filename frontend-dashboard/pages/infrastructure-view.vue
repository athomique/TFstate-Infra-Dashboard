<template>
  <div class="diagram">
    <h2>Cloud Infrastructure Resources</h2>

    <div class="providers-container">
      <div v-for="(zones, provider) in resources" :key="provider" class="provider-section">
        <h3>{{ provider }}</h3>
        <div v-for="(resources, zone) in zones" :key="zone" class="zone-section">
          <h4>Zone: {{ zone }}</h4>

          <div class="resources-container">
            <img v-for="network in resources.networks" :key="network.id" src="/images/network_logo.png" alt="Network">
            <img v-for="vm in resources.vms" :key="vm.id" src="/images/VM_logo.png" alt="VM">
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const resources = ref({});

onMounted(async () => {
  const response = await fetch('http://localhost:3333/api/tfstate');
  resources.value = await response.json();
});
</script>

<style scoped>
html, body {
  height: 100%;
  margin-top: 180px; 
}

.diagram {
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: #121212; /* Fond sombre global */
  padding: 40px;
  color: #ffffff;
  gap: 40px;
  width: 100%;
}

.diagram h2 {
  font-size: 2em;
  color: #ffab00; /* Couleur accent pour les titres */
  margin-bottom: 20px;
}

.providers-container {
  display: flex;
  justify-content: space-between;
  width: 100%;
  max-width: 1200px;
  gap: 20px; /* Espace entre les colonnes */
}

.provider-section {
  display: flex;
  flex-direction: column;
  background-color: #1e1e1e; /* Boîte sombre pour chaque fournisseur */
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.4);
  flex: 1; /* Chaque colonne prend un tiers de la largeur */
}

.provider-section h3 {
  font-size: 1.5em;
  color: #ffffff;
  margin-bottom: 15px;
  text-align: center;
}

.zone-section {
  background-color: #2a2a2a; /* Boîte sombre légèrement différente pour les zones */
  border-radius: 10px;
  padding: 15px;
  margin-bottom: 20px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
}

.zone-section h4 {
  font-size: 1.2em;
  color: #cfcfcf; /* Couleur douce pour les sous-titres */
  margin-bottom: 10px;
}

.resources-container {
  display: flex;
  justify-content: space-around; /* Espace uniforme entre les éléments */
  flex-wrap: wrap; /* Permet un retour à la ligne si trop d'éléments */
  gap: 15px; /* Espace entre les icônes */
}

img {
  width: 60px; /* Taille des icônes */
  height: 60px;
  border-radius: 8px; /* Légère courbure des coins */
  background-color: #444444; /* Fond derrière les images */
  padding: 5px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3); /* Ombre légère pour les icônes */
}
</style>
