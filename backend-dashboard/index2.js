const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors'); // Ajoute cette ligne pour importer cors
const app = express();
const port = 3333;

// Ajoute la configuration CORS pour autoriser les requêtes de ton frontend
app.use(cors({
  origin: 'http://localhost:3334', // Autorise le frontend sur le port 3334
  methods: ['GET'], // Autorise uniquement la méthode GET
  credentials: true // Active les credentials si nécessaire
}));

// API endpoint to parse and return tfstate data
app.get('/api/tfstate', (req, res) => {
  const tfStateFilePath = path.join(__dirname, 'tfstate'); // Assurez-vous que le fichier 'tfstate' est dans le même répertoire

  fs.readFile(tfStateFilePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Failed to read tfstate file:', err);
      return res.status(500).json({ error: 'Failed to read tfstate file' });
    }

    try {
      const tfState = JSON.parse(data); // Parse the tfstate file
      const resources = parseResources(tfState); // Function to parse resources
      res.json(resources); // Return the parsed resources
    } catch (parseError) {
      console.error('Error parsing tfstate JSON:', parseError);
      return res.status(500).json({ error: 'Failed to parse tfstate file' });
    }
  });
});

function parseResources(tfState) {
  const resourcesByProvider = {};

  tfState.resources.forEach(resource => {
    const provider = resource.provider || 'unknown_provider'; // Handle undefined provider
    if (!resourcesByProvider[provider]) {
      resourcesByProvider[provider] = {};
    }

    const zone = resource.instances[0]?.attributes?.zone || 'global'; // Handle missing zone

    if (!resourcesByProvider[provider][zone]) {
      resourcesByProvider[provider][zone] = {
        vms: [],
        networks: [],
      };
    }

    if (resource.type === 'google_compute_instance' || resource.type === 'aws_instance' || resource.type === 'azurerm_virtual_machine') {
      resourcesByProvider[provider][zone].vms.push({
        name: resource.name,
        id: resource.instances[0]?.attributes?.id,
        networkInterfaces: resource.instances[0]?.attributes?.network_interface || [],
      });
    }

    if (resource.type.includes('network')) {
      resourcesByProvider[provider][zone].networks.push({
        name: resource.name,
        id: resource.instances[0]?.attributes?.id,
      });
    }
  });

  return resourcesByProvider;
}

app.listen(port, () => {
  console.log(`Backend running on port ${port}`);
});

