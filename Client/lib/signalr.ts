import * as signalR from '@microsoft/signalr';

const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5200';

export function createSignalRConnection(getToken: () => string): signalR.HubConnection {
  // Use YARP route /notifications/hub or directly /hub
  const hubUrl = `${baseURL}/notifications/hub`;

  const connection = new signalR.HubConnectionBuilder()
    .withUrl(hubUrl, {
      accessTokenFactory: () => getToken() || '',
    })
    .withAutomaticReconnect([0, 1000, 3000, 5000, 10000])
    .configureLogging(signalR.LogLevel.None)
    .build();

  return connection;
}

/**
 * Safely starts a hub connection, catching any errors (e.g. if Hub endpoint is not configured)
 */
export async function startSignalRConnection(connection: signalR.HubConnection): Promise<boolean> {
  if (connection.state === signalR.HubConnectionState.Disconnected) {
    try {
      await connection.start();
      console.log('[SignalR] Connected successfully.');
      return true;
    } catch (err: any) {
      const errMsg = err?.message || String(err);
      if (errMsg.includes('stopped during negotiation') || errMsg.includes('negotiation was stopped')) {
        console.log('[SignalR] Connection negotiation aborted (normal during component unmount).');
      } else {
        console.warn('[SignalR] Hub connection failed to start. Notifications will poll instead. Error:', err);
      }
      return false;
    }
  }
  return connection.state === signalR.HubConnectionState.Connected;
}

/**
 * Stop SignalR connection cleanly
 */
export async function stopSignalRConnection(connection: signalR.HubConnection) {
  try {
    if (connection.state !== signalR.HubConnectionState.Disconnected) {
      await connection.stop();
      console.log('[SignalR] Connection stopped.');
    }
  } catch (err) {
    console.warn('[SignalR] Error stopping connection:', err);
  }
}
