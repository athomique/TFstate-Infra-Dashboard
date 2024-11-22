const express = require('express');
const { WebSocketServer } = require('ws');
const { google } = require('google-auth-library');

const app = express();
const port = 3001;

// WebSocket server
const wss = new WebSocketServer({ noServer: true });

// Fonction pour récupérer les métriques GCP
async function fetchCloudFunctionMetrics() {
  const client = await google.auth.getClient({
    scopes: ['https://www.googleapis.com/auth/cloud-platform']
  });

  const projectId = 'YOUR_PROJECT_ID'; // Remplacez par votre ID projet
  const res = await client.request({
    url: `https://monitoring.googleapis.com/v3/projects/${projectId}/timeSeries`,
    method: 'GET',
    params: {
      filter: 'metric.type="cloudfunctions.googleapis.com/function/execution_count"',
      interval: {
        startTime: new Date(Date.now() - 60000).toISOString(),
        endTime: new Date().toISOString()
      },
      aggregation: {
        alignmentPeriod: '60s',
        perSeriesAligner: 'ALIGN_RATE'
      }
    }
  });

  return res.data.timeSeries || [];
}

// Diffusion des données via WebSocket
wss.on('connection', (ws) => {
  console.log('Client connecté');

  const interval = setInterval(async () => {
    const metrics = await fetchCloudFunctionMetrics();
    ws.send(JSON.stringify(metrics));
  }, 5000); // Mise à jour toutes les 5 secondes

  ws.on('close', () => clearInterval(interval));
});

// Configurer WebSocket pour Express
app.server = app.listen(port, () => {
  console.log(`Backend listening on http://localhost:${port}`);
});

app.server.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request);
  });
});

