import { WebSocketServer } from 'ws';
import jwt from 'jsonwebtoken';
import { config } from '../config/config.js';
import { getDatabase } from '../database/init.js';

let wss = null;
const connectedClients = new Map();

export function setupWebSocket(server) {
  wss = new WebSocketServer({ 
    server,
    path: '/ws'
  });

  wss.on('connection', async (ws, request) => {
    try {
      // Extract token from query parameters or headers
      const url = new URL(request.url, `http://${request.headers.host}`);
      const token = url.searchParams.get('token') || request.headers.authorization?.split(' ')[1];
      
      if (!token) {
        ws.close(1008, 'Authentication required');
        return;
      }

      // Verify JWT token
      const decoded = jwt.verify(token, config.jwt.secret);
      
      // Get user from database
      const db = getDatabase();
      const user = await db.get(
        'SELECT id, username, display_name, role FROM operatives WHERE id = ?',
        [decoded.userId]
      );

      if (!user) {
        ws.close(1008, 'Invalid token');
        return;
      }

      // Store connection
      const clientId = `${user.id}_${Date.now()}`;
      connectedClients.set(clientId, {
        ws,
        user,
        connectedAt: new Date()
      });

      console.log(`WebSocket client connected: ${user.username} (${clientId})`);

      // Send welcome message
      ws.send(JSON.stringify({
        type: 'welcome',
        data: {
          message: 'Connected to The Ark WebSocket',
          user: user.display_name,
          timestamp: new Date().toISOString()
        }
      }));

      // Handle incoming messages
      ws.on('message', async (message) => {
        try {
          const data = JSON.parse(message.toString());
          await handleWebSocketMessage(clientId, data);
        } catch (error) {
          console.error('WebSocket message error:', error);
          ws.send(JSON.stringify({
            type: 'error',
            data: {
              error: 'Invalid message format',
              timestamp: new Date().toISOString()
            }
          }));
        }
      });

      // Handle disconnect
      ws.on('close', () => {
        console.log(`WebSocket client disconnected: ${user.username} (${clientId})`);
        connectedClients.delete(clientId);
      });

      // Handle errors
      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        connectedClients.delete(clientId);
      });

    } catch (error) {
      console.error('WebSocket authentication error:', error);
      ws.close(1008, 'Authentication failed');
    }
  });

  console.log('✅ WebSocket server initialized');
}

async function handleWebSocketMessage(clientId, message) {
  const client = connectedClients.get(clientId);
  if (!client) return;

  const { ws, user } = client;

  switch (message.type) {
    case 'ping':
      ws.send(JSON.stringify({
        type: 'pong',
        data: {
          timestamp: new Date().toISOString()
        }
      }));
      break;

    case 'subscribe_analysis':
      // Subscribe to analysis updates for a specific session
      const { sessionId } = message.data;
      if (sessionId) {
        client.subscriptions = client.subscriptions || new Set();
        client.subscriptions.add(`analysis_${sessionId}`);
        
        ws.send(JSON.stringify({
          type: 'subscribed',
          data: {
            channel: `analysis_${sessionId}`,
            timestamp: new Date().toISOString()
          }
        }));
      }
      break;

    case 'unsubscribe_analysis':
      const { sessionId: unsubSessionId } = message.data;
      if (unsubSessionId && client.subscriptions) {
        client.subscriptions.delete(`analysis_${unsubSessionId}`);
        
        ws.send(JSON.stringify({
          type: 'unsubscribed',
          data: {
            channel: `analysis_${unsubSessionId}`,
            timestamp: new Date().toISOString()
          }
        }));
      }
      break;

    case 'get_status':
      // Send current system status
      await sendSystemStatus(ws);
      break;

    default:
      ws.send(JSON.stringify({
        type: 'error',
        data: {
          error: `Unknown message type: ${message.type}`,
          timestamp: new Date().toISOString()
        }
      }));
  }
}

async function sendSystemStatus(ws) {
  try {
    const db = getDatabase();
    
    const fileCount = await db.get('SELECT COUNT(*) as count FROM forensic_files');
    const runningAnalysis = await db.get('SELECT COUNT(*) as count FROM analysis_sessions WHERE status = "running"');
    
    ws.send(JSON.stringify({
      type: 'system_status',
      data: {
        files_analyzed: fileCount.count,
        running_analysis: runningAnalysis.count,
        connected_users: connectedClients.size,
        timestamp: new Date().toISOString()
      }
    }));
  } catch (error) {
    console.error('Failed to send system status:', error);
  }
}

// Broadcast functions for external use
export function broadcastAnalysisUpdate(sessionId, update) {
  if (!wss) return;

  const message = JSON.stringify({
    type: 'analysis_progress',
    data: {
      session_id: sessionId,
      ...update,
      timestamp: new Date().toISOString()
    }
  });

  connectedClients.forEach((client, clientId) => {
    if (client.subscriptions && client.subscriptions.has(`analysis_${sessionId}`)) {
      try {
        client.ws.send(message);
      } catch (error) {
        console.error('Failed to send analysis update:', error);
        connectedClients.delete(clientId);
      }
    }
  });
}

export function broadcastSystemAlert(alert) {
  if (!wss) return;

  const message = JSON.stringify({
    type: 'system_alert',
    data: {
      ...alert,
      timestamp: new Date().toISOString()
    }
  });

  connectedClients.forEach((client, clientId) => {
    try {
      client.ws.send(message);
    } catch (error) {
      console.error('Failed to send system alert:', error);
      connectedClients.delete(clientId);
    }
  });
}

export function broadcastNotification(notification, targetUserId = null) {
  if (!wss) return;

  const message = JSON.stringify({
    type: 'notification',
    data: {
      ...notification,
      timestamp: new Date().toISOString()
    }
  });

  connectedClients.forEach((client, clientId) => {
    if (!targetUserId || client.user.id === targetUserId) {
      try {
        client.ws.send(message);
      } catch (error) {
        console.error('Failed to send notification:', error);
        connectedClients.delete(clientId);
      }
    }
  });
}

// Periodic system status broadcast
setInterval(() => {
  if (connectedClients.size > 0) {
    connectedClients.forEach((client) => {
      sendSystemStatus(client.ws);
    });
  }
}, 30000); // Every 30 seconds