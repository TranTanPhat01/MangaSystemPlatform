import * as signalR from '@microsoft/signalr';

const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5200';

export function createSignalRConnection(token: string): signalR.HubConnection {
  // Use YARP route /notifications/hub or directly /hub
  const hubUrl = `${baseURL}/notifications/hub`;

  const connection = new signalR.HubConnectionBuilder()
    .withUrl(hubUrl, {
      accessTokenFactory: () => token,
    })
    .withAutomaticReconnect()
    .configureLogging(signalR.LogLevel.Warning)
    .build();

  return connection;
}

/**
 * Safely starts a hub connection, catching any errors (e.g. if Hub endpoint is not configured)
 */
export async function startSignalRConnection(connection: signalR.HubConnection) {
  if (connection.state === signalR.HubConnectionState.Disconnected) {
    try {
      await connection.start();
      console.log('SignalR connected successfully.');
    } catch (err) {
      console.warn('SignalR Hub connection failed to start. Notifications will poll instead. Error:', err);
    }
  }
}
