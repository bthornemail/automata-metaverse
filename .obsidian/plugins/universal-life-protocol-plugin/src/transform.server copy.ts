import express, { Request, Response } from 'express';
import net from 'net';
import http from 'http';
import ngrok from 'ngrok'; // Import Ngrok
import cors from 'cors';
// Create an Express app
const app = express();
const expressPort = 3000;

app.use(cors({
  origin: 'https://your-ngrok-url.ngrok.io',
  credentials: true
}));
// Middleware to parse incoming data as text
app.use(express.text());

// Express route to handle incoming data
app.post('/process', (req: Request, res: Response) => {
  const data = req.body; // Data received from the net socket
  console.log('Express app received data:', data);

  // Process the data (e.g., transform it)
  const processedData = data.toUpperCase(); // Example: Convert to uppercase

  // Send the processed data back to the net socket
  res.send(processedData);
});

// Start the Express server
app.listen(expressPort, async () => {
  console.log(`Express server listening on port ${expressPort}`);
    // Start Ngrok tunnel for the Express server
    try {
        const expressUrl = await ngrok.connect({
          addr: expressPort,
          authtoken: '7pokcWyw8pGbxw6daKiYE_3xPiaTA2qpLnDhtLooBk1', // Replace with your Ngrok auth token
        });
        console.log(`Express server exposed via Ngrok at: ${expressUrl}`);
      } catch (err) {
        console.error('Failed to start Ngrok tunnel for Express server:', err);
      }
});

// Create a net server to act as the source of data
const netServer = net.createServer((socket: net.Socket) => {
  console.log('Net server connection established.');

  // Send sample data to the connected client
  socket.write('Hello from the net server!');
  socket.end(); // Close the connection after sending data
});

const netServerPort = 4000;
netServer.listen(netServerPort, () => {
  console.log(`Net server listening on port ${netServerPort}`);
});

// Create a net socket to receive data from the net server
const inputSocket = net.createConnection({ port: netServerPort }, () => {
  console.log('Input net socket connected to net server!');
});

// Handle data received from the input net socket
inputSocket.on('data', (data: Buffer) => {
  console.log('Input net socket received data:', data.toString());

  // Forward the data to the Express app for processing
  const requestOptions = {
    hostname: 'localhost',
    port: expressPort,
    path: '/process',
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain',
      'Content-Length': data.length,
    },
  };

  const req = http.request(requestOptions, (res) => {
    let responseData = '';
    res.on('data', (chunk: Buffer) => {
      responseData += chunk.toString();
    });
    res.on('end', () => {
      console.log('Express app response:', responseData);

      // Pipe the response to the output net socket
      outputSocket.write(responseData);
    });
  });

  req.on('error', (err: Error) => {
    console.error('Request to Express app failed:', err);
  });

  req.write(data);
  req.end();
});

// Create a net socket to send processed data to another destination
const outputSocket = net.createConnection({ port: 5000 }, () => {
  console.log('Output net socket connected to destination!');
});

// Handle errors
inputSocket.on('error', (err: Error) => {
  console.error('Input net socket error:', err);
});

outputSocket.on('error', (err: Error) => {
  console.error('Output net socket error:', err);
});

// Create a destination server to receive processed data
const destinationServer = net.createServer((socket: net.Socket) => {
  console.log('Destination server connection established.');
  socket.on('data', (data: Buffer) => {
    console.log('Destination server received data:', data.toString());
  });
});

const destinationPort = 5000;
destinationServer.listen(destinationPort, () => {
  console.log(`Destination server listening on port ${destinationPort}`);
});