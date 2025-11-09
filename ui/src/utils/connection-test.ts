/**
 * Connection Test Utility
 * 
 * Tests API and WebSocket connections to ensure everything is working
 */

export interface ConnectionStatus {
  api: boolean;
  websocket: boolean;
  localFiles: boolean;
  timestamp: number;
}

export async function testConnections(): Promise<ConnectionStatus> {
  const status: ConnectionStatus = {
    api: false,
    websocket: false,
    localFiles: false,
    timestamp: Date.now(),
  };

  // Test API connection
  try {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
    const response = await fetch(`${apiUrl}/health`);
    status.api = response.ok;
  } catch (error) {
    console.warn('API connection test failed:', error);
  }

  // Test local file access
  try {
    const response = await fetch('/jsonl/generate.metaverse.jsonl');
    status.localFiles = response.ok;
  } catch (error) {
    console.warn('Local file access test failed:', error);
  }

  // WebSocket test (async, will be set by WebSocket service)
  // This is tested separately when WebSocket connects

  return status;
}

export function logConnectionStatus(status: ConnectionStatus) {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║     Connection Status                                        ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log(`✓ API Server:      ${status.api ? '✅ Connected' : '❌ Disconnected'}`);
  console.log(`✓ Local Files:      ${status.localFiles ? '✅ Available' : '❌ Not Available'}`);
  console.log(`✓ WebSocket:        ${status.websocket ? '✅ Connected' : '⏳ Connecting...'}`);
  console.log(`  Timestamp:        ${new Date(status.timestamp).toISOString()}`);
  console.log('╚══════════════════════════════════════════════════════════════╝');
}
