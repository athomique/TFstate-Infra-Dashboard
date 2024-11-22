require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');

// SDKs pour les différents clouds
const { InstancesClient } = require('@google-cloud/compute');
const { MetricServiceClient } = require('@google-cloud/monitoring');
const { EC2Client, DescribeInstancesCommand } = require('@aws-sdk/client-ec2');
const { CloudWatchClient, GetMetricStatisticsCommand } = require('@aws-sdk/client-cloudwatch');
const { ComputeManagementClient } = require('@azure/arm-compute');
const { MonitorClient } = require('@azure/arm-monitor');
const { ClientSecretCredential } = require('@azure/identity');

// Initialisation des clients pour les différents clouds
let gcpCompute, gcpMonitoringClient, ec2Client, cloudwatchClient, azureComputeClient, azureMonitorClient;

if (process.env.USE_GCP === 'true') {
  console.log("Using GCP");
  gcpCompute = new InstancesClient();
  gcpMonitoringClient = new MetricServiceClient();
}

if (process.env.USE_AWS === 'true') {
  console.log("Using AWS");
  ec2Client = new EC2Client({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });
  cloudwatchClient = new CloudWatchClient({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });
}

if (process.env.USE_AZURE === 'true') {
  console.log("Using Azure");
  const azureCredential = new ClientSecretCredential(
    process.env.AZURE_TENANT_ID,
    process.env.AZURE_CLIENT_ID,
    process.env.AZURE_CLIENT_SECRET
  );
  azureComputeClient = new ComputeManagementClient(azureCredential, process.env.AZURE_SUBSCRIPTION_ID);
  azureMonitorClient = new MonitorClient(azureCredential, process.env.AZURE_SUBSCRIPTION_ID);
}

// Création du serveur Express et Socket.IO
const app = express();
const server = http.createServer(app);

// Ajoute cors pour Express
app.use(cors({
  origin: 'http://localhost:3334',
  methods: ['GET', 'POST'],
  credentials: true
}));

// Configuration de Socket.IO avec CORS
const io = socketIO(server, {
  cors: {
    origin: "http://localhost:3334",
    methods: ["GET", "POST"],
    credentials: true
  }
});

io.on('connection', (socket) => {
  console.log('A user connected');
  
  // Envoi des métriques toutes les 5 secondes
  setInterval(async () => {
    const vmMetrics = await getAllVMMetrics();

    const metrics = {
      vmCount: await getVMCount(),
      requestsPerMinute: getRequestsPerMinute(),
      cpuUsage: vmMetrics.cpuUsage,
      readBytes: vmMetrics.readBytes,
      writeBytes: vmMetrics.writeBytes
    };

    console.log('Métriques envoyées:', metrics);
    socket.emit('updateMetrics', metrics);
  }, 5000);  // Rafraîchissement toutes les 5 secondes
});

// Fonction pour récupérer les métriques CPU, lecture et écriture sur disque
async function getAllVMMetrics() {
  let totalCpuUsage = 0;
  let totalReadBytes = 0;
  let totalWriteBytes = 0;

  // GCP
  if (process.env.USE_GCP === 'true') {
    const { cpuUsage, readBytes, writeBytes } = await getGCPMetrics();
    totalCpuUsage += cpuUsage;
    totalReadBytes += readBytes;
    totalWriteBytes += writeBytes;
  }

  // AWS
  if (process.env.USE_AWS === 'true') {
    const { cpuUsage, readBytes, writeBytes } = await getAWSMetrics();
    totalCpuUsage += cpuUsage;
    totalReadBytes += readBytes;
    totalWriteBytes += writeBytes;
  }

  // Azure
  if (process.env.USE_AZURE === 'true') {
    const { cpuUsage, readBytes, writeBytes } = await getAzureMetrics();
    totalCpuUsage += cpuUsage;
    totalReadBytes += readBytes;
    totalWriteBytes += writeBytes;
  }

  return {
    cpuUsage: totalCpuUsage,
    readBytes: totalReadBytes,
    writeBytes: totalWriteBytes
  };
}

// ------------------- GCP Metrics -------------------
async function getGCPMetrics() {
  try {
    // CPU request
    const requestCpu = {
      name: `projects/${process.env.GCP_PROJECT_ID}`,  // Correction ici
      filter: 'metric.type="compute.googleapis.com/instance/cpu/utilization"',
      interval: {
        endTime: { seconds: Math.floor(Date.now() / 1000) },
        startTime: { seconds: Math.floor((Date.now() - 5 * 60 * 1000) / 1000) }, // Fenêtre de 2 minutes
      },
      aggregation: {
        alignmentPeriod: { seconds: 60 },
        perSeriesAligner: 'ALIGN_MEAN',
      },
    };

    // Disk read bytes request
    const requestDiskRead = {
      name: `projects/${process.env.GCP_PROJECT_ID}`,  // Correction ici
      filter: 'metric.type="compute.googleapis.com/instance/disk/read_bytes_count"',
      interval: {
        endTime: { seconds: Math.floor(Date.now() / 1000) },
        startTime: { seconds: Math.floor((Date.now() - 5 * 60 * 1000) / 1000) }, // Fenêtre de 2 minutes
      },
      aggregation: {
        alignmentPeriod: { seconds: 60 },
        perSeriesAligner: 'ALIGN_SUM',
      },
    };

    // Disk write bytes request
    const requestDiskWrite = {
      name: `projects/${process.env.GCP_PROJECT_ID}`,  // Correction ici
      filter: 'metric.type="compute.googleapis.com/instance/disk/write_bytes_count"',
      interval: {
        endTime: { seconds: Math.floor(Date.now() / 1000) },
        startTime: { seconds: Math.floor((Date.now() - 5 * 60 * 1000) / 1000) }, // Fenêtre de 2 minutes
      },
      aggregation: {
        alignmentPeriod: { seconds: 60 },
        perSeriesAligner: 'ALIGN_SUM',
      },
    };

    // Fetch CPU metrics
    const [responseCpu] = await gcpMonitoringClient.listTimeSeries(requestCpu);
    let cpuUsage = responseCpu.length && responseCpu[0].points.length ? responseCpu[0].points[0].value.doubleValue : 0;

    // Fetch disk read metrics
    const [responseDiskRead] = await gcpMonitoringClient.listTimeSeries(requestDiskRead);
    let readBytes = responseDiskRead.length && responseDiskRead[0].points.length ? responseDiskRead[0].points[0].value.int64Value : 0;

    // Fetch disk write metrics
    const [responseDiskWrite] = await gcpMonitoringClient.listTimeSeries(requestDiskWrite);
    let writeBytes = responseDiskWrite.length && responseDiskWrite[0].points.length ? responseDiskWrite[0].points[0].value.int64Value : 0;

    return { cpuUsage, readBytes, writeBytes };
  } catch (err) {
    console.error('Error fetching GCP metrics:', err);
    return { cpuUsage: 0, readBytes: 0, writeBytes: 0 };
  }
}

// ------------------- AWS Metrics -------------------
async function getAWSMetrics() {
  try {
    const cpuParams = {
      Namespace: 'AWS/EC2',
      MetricName: 'CPUUtilization',
      Dimensions: [{ Name: 'InstanceId', Value: 'INSTANCE_ID' }],
      StartTime: new Date(Date.now() - 5 * 60 * 1000),
      EndTime: new Date(),
      Period: 60,
      Statistics: ['Average'],
    };

    const readParams = {
      Namespace: 'AWS/EC2',
      MetricName: 'DiskReadBytes',
      Dimensions: [{ Name: 'InstanceId', Value: 'INSTANCE_ID' }],
      StartTime: new Date(Date.now() - 5 * 60 * 1000),
      EndTime: new Date(),
      Period: 60,
      Statistics: ['Sum'],
    };

    const writeParams = {
      Namespace: 'AWS/EC2',
      MetricName: 'DiskWriteBytes',
      Dimensions: [{ Name: 'InstanceId', Value: 'INSTANCE_ID' }],
      StartTime: new Date(Date.now() - 5 * 60 * 1000),
      EndTime: new Date(),
      Period: 60,
      Statistics: ['Sum'],
    };

    const [cpuData] = await cloudwatchClient.send(new GetMetricStatisticsCommand(cpuParams));
    const [readData] = await cloudwatchClient.send(new GetMetricStatisticsCommand(readParams));
    const [writeData] = await cloudwatchClient.send(new GetMetricStatisticsCommand(writeParams));

    const cpuUsage = cpuData.Datapoints.length ? cpuData.Datapoints[0].Average : 0;
    const readBytes = readData.Datapoints.length ? readData.Datapoints[0].Sum : 0;
    const writeBytes = writeData.Datapoints.length ? writeData.Datapoints[0].Sum : 0;

    return { cpuUsage, readBytes, writeBytes };
  } catch (err) {
    console.error('Error fetching AWS metrics:', err);
    return { cpuUsage: 0, readBytes: 0, writeBytes: 0 };
  }
}

// ------------------- Azure Metrics -------------------
async function getAzureMetrics() {
  try {
    const resourceGroupName = 'your-resource-group';
    const vmName = 'your-vm-name';

    // Requête pour la CPU
    const metricsCpuResponse = await azureMonitorClient.metrics.list(
      `/subscriptions/${process.env.AZURE_SUBSCRIPTION_ID}/resourceGroups/${resourceGroupName}/providers/Microsoft.Compute/virtualMachines/${vmName}`,
      {
        timespan: 'PT2M',
        interval: 'PT1M',
        metricnames: 'Percentage CPU',
        aggregation: 'Average',
      }
    );

    // Requête pour la lecture sur disque
    const metricsReadResponse = await azureMonitorClient.metrics.list(
      `/subscriptions/${process.env.AZURE_SUBSCRIPTION_ID}/resourceGroups/${resourceGroupName}/providers/Microsoft.Compute/virtualMachines/${vmName}`,
      {
        timespan: 'PT2M',
        interval: 'PT1M',
        metricnames: 'Disk Read Bytes',
        aggregation: 'Total',
      }
    );

    // Requête pour l'écriture sur disque
    const metricsWriteResponse = await azureMonitorClient.metrics.list(
      `/subscriptions/${process.env.AZURE_SUBSCRIPTION_ID}/resourceGroups/${resourceGroupName}/providers/Microsoft.Compute/virtualMachines/${vmName}`,
      {
        timespan: 'PT2M',
        interval: 'PT1M',
        metricnames: 'Disk Write Bytes',
        aggregation: 'Total',
      }
    );

    // Extraire les données
    const cpuUsage = metricsCpuResponse.value.length ? metricsCpuResponse.value[0].timeseries[0].data[0].average : 0;
    const readBytes = metricsReadResponse.value.length ? metricsReadResponse.value[0].timeseries[0].data[0].total : 0;
    const writeBytes = metricsWriteResponse.value.length ? metricsWriteResponse.value[0].timeseries[0].data[0].total : 0;

    return { cpuUsage, readBytes, writeBytes };
  } catch (err) {
    console.error('Error fetching Azure metrics:', err);
    return { cpuUsage: 0, readBytes: 0, writeBytes: 0 };
  }
}

// ------------------- GCP, AWS, AZURE - VMs actives -------------------

// GCP - VMs actives sans spécification de zone
async function getGCPVMCount() {
  const projectId = process.env.GCP_PROJECT_ID;

  try {
    const vmsIterator = gcpCompute.aggregatedListAsync({
      project: projectId,
    });

    let activeVMs = 0;

    for await (const [zone, zoneData] of vmsIterator) {
      if (zoneData.instances) {
        zoneData.instances.forEach(instance => {
          if (instance.status === 'RUNNING') {
            activeVMs++;
          }
        });
      }
    }

    return activeVMs;
  } catch (err) {
    console.error('Error fetching GCP VM count:', err);
    return 0;
  }
}

// AWS - VMs actives
async function getAWSVMCount() {
  try {
    const data = await ec2Client.send(new DescribeInstancesCommand({}));
    const instances = data.Reservations.flatMap(r => r.Instances);
    const runningInstances = instances.filter(instance => instance.State.Name === 'running');
    return runningInstances.length;
  } catch (err) {
    console.error('Error fetching AWS VM count:', err);
    return 0;
  }
}

// Azure - VMs actives
async function getAzureVMCount() {
  try {
    const vmList = await azureComputeClient.virtualMachines.listAll();
    let activeVMs = 0;

    for (const vm of vmList) {
      const instanceView = await azureComputeClient.virtualMachines.instanceView(vm.resourceGroupName, vm.name);
      if (instanceView.statuses.some(status => status.code === 'PowerState/running')) {
        activeVMs++;
      }
    }

    return activeVMs;
  } catch (err) {
    console.error('Error fetching Azure VM count:', err);
    return 0;
  }
}

// Récupérer le nombre total de VMs "up" sur GCP, AWS et Azure
async function getVMCount() {
  let totalVMCount = 0;

  if (process.env.USE_GCP === 'true') {
    totalVMCount += await getGCPVMCount();
  }

  if (process.env.USE_AWS === 'true') {
    totalVMCount += await getAWSVMCount();
  }

  if (process.env.USE_AZURE === 'true') {
    totalVMCount += await getAzureVMCount();
  }

  return totalVMCount;
}

// Simulations et autres métriques
function getRequestsPerMinute() {
  return Math.floor(Math.random() * 1000);
}

// Démarrer le serveur
server.listen(3333, () => {
  console.log('Backend running on port 3333');
});

