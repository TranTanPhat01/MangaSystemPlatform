const https = require('https');
const dns = require('dns');
const { execFileSync } = require('child_process');
const signalR = require('@microsoft/signalr');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const password = 'Password@123';
const timestamp = Date.now();
const gateway = 'https://127.0.0.1';
const publicGateway = 'https://api.manga.local';
const originalLookup = dns.lookup;
dns.lookup = function patchedLookup(host, opts, cb) {
  if (typeof opts === 'function') {
    cb = opts;
    opts = {};
  }
  if (host === 'api.manga.local') {
    return opts && opts.all ? cb(null, [{ address: '127.0.0.1', family: 4 }]) : cb(null, '127.0.0.1', 4);
  }
  return originalLookup.call(dns, host, opts, cb);
};
const agent = new https.Agent({
  rejectUnauthorized: false,
  lookup(host, opts, cb) {
    if (typeof opts === 'function') {
      cb = opts;
      opts = {};
    }
    if (host === 'api.manga.local') {
      return opts && opts.all ? cb(null, [{ address: '127.0.0.1', family: 4 }]) : cb(null, '127.0.0.1', 4);
    }
    return dns.lookup(host, opts, cb);
  }
});

async function api(path, options = {}) {
  const headers = { host: 'api.manga.local', ...(options.headers || {}) };
  let body = options.body;
  if (body && !(body instanceof FormData)) {
    headers['content-type'] = 'application/json';
    body = JSON.stringify(body);
  }
  const response = await fetch(gateway + path, { ...options, headers, body, agent });
  const text = await response.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch { json = null; }
  if (!response.ok) {
    throw new Error(`${options.method || 'GET'} ${path} -> ${response.status} ${text.slice(0, 200)}`);
  }
  return json;
}

async function register(email, fullName) {
  await api('/identity/auth/register', {
    method: 'POST',
    body: { email, fullName, password }
  });
}

async function login(email) {
  const json = await api('/identity/auth/login', {
    method: 'POST',
    body: { email, password }
  });
  return json.data;
}

function psql(database, sql) {
  return execFileSync('docker', [
    'exec', '-u', 'postgres', 'manga-postgres',
    'psql', '-d', database, '-t', '-A', '-c', sql
  ], { encoding: 'utf8' }).trim();
}

function grantAssistant(email) {
  const escaped = email.replace(/'/g, "''");
  psql('IdentityDB', `
    insert into user_roles (user_id, role_id)
    select u.id, r.id from users u cross join roles r
    where u.email='${escaped}' and r.name='Assistant'
    on conflict do nothing;
  `);
}

function notificationRows(userId, sourceEventId) {
  return Number(psql('NotificationDB', `select count(*) from notifications where "UserId"='${userId}' and "SourceEventId"='${sourceEventId}';`) || '0');
}

function docker(args) {
  return execFileSync('docker', args, { encoding: 'utf8' }).trim();
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitFor(predicate, timeoutMs, intervalMs = 250) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (predicate()) return true;
    await wait(intervalMs);
  }
  return false;
}

async function waitForNotificationCount(received, count, timeoutMs = 20000) {
  return waitFor(() => received.length >= count, timeoutMs);
}

async function waitForNotificationHealthy(timeoutMs = 60000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const status = docker(['inspect', '-f', '{{.State.Health.Status}}', 'manga-prodlike-notification-api-1']);
      if (status === 'healthy') return true;
    } catch {
      // retry
    }
    await wait(1000);
  }
  return false;
}

async function main() {
  const creatorEmail = `wss_creator_${timestamp}@example.com`;
  const assigneeEmail = `wss_assignee_${timestamp}@example.com`;
  await register(creatorEmail, 'WSS Creator');
  await register(assigneeEmail, 'WSS Assignee');
  grantAssistant(assigneeEmail);

  const creator = await login(creatorEmail);
  const assignee = await login(assigneeEmail);
  const creatorHeaders = { authorization: `Bearer ${creator.accessToken}` };

  const received = [];
  const connectionStates = [];
  const connection = new signalR.HubConnectionBuilder()
    .withUrl(`${publicGateway}/notifications/hub`, {
      accessTokenFactory: () => assignee.accessToken,
      transport: signalR.HttpTransportType.WebSockets,
      skipNegotiation: true,
      agent
    })
    .withAutomaticReconnect([0, 1000, 2000, 5000])
    .build();

  connection.on('NotificationReceived', n => {
    received.push({ ...n, receivedAt: new Date().toISOString() });
  });
  connection.onreconnecting(error => connectionStates.push({ state: 'reconnecting', at: new Date().toISOString(), message: error?.message || null }));
  connection.onreconnected(connectionId => connectionStates.push({ state: 'reconnected', at: new Date().toISOString(), connectionId: connectionId || null }));
  connection.onclose(error => connectionStates.push({ state: 'closed', at: new Date().toISOString(), message: error?.message || null }));

  await connection.start();

  const studio = (await api('/manga/studios', {
    method: 'POST',
    headers: creatorHeaders,
    body: { name: `WSS Studio ${timestamp}`, description: 'WSS evidence studio' }
  })).data;

  await api(`/manga/studios/${studio.id}/members`, {
    method: 'POST',
    headers: creatorHeaders,
    body: { userId: assignee.user.id, role: 'Assistant' }
  });

  const series = (await api('/manga/series', {
    method: 'POST',
    headers: creatorHeaders,
    body: { studioId: studio.id, title: `WSS Series ${timestamp}`, description: 'WSS evidence series', genre: 'Action' }
  })).data;

  const upload = new FormData();
  upload.append('file', new Blob(['wss-evidence-page'], { type: 'image/png' }), 'wss-evidence.png');
  upload.append('category', 'Page');
  const file = (await api('/files/upload', {
    method: 'POST',
    headers: creatorHeaders,
    body: upload
  })).data;

  const chapter = (await api(`/manga/series/${series.id}/chapters`, {
    method: 'POST',
    headers: creatorHeaders,
    body: { chapterNumber: 1, title: 'WSS Chapter 1', progressPercentage: 0 }
  })).data;

  const page = (await api(`/manga/chapters/${chapter.id}/pages`, {
    method: 'POST',
    headers: creatorHeaders,
    body: { pageNumber: 1, fileId: file.fileId }
  })).data;

  const annotation = (await api(`/manga/pages/${page.id}/annotations`, {
    method: 'POST',
    headers: creatorHeaders,
    body: { type: 4, coordinatesJson: JSON.stringify({ x: 10, y: 10, w: 100, h: 100 }), description: 'WSS evidence task area' }
  })).data;

  async function triggerTask(label) {
    return (await api('/manga/tasks', {
      method: 'POST',
      headers: creatorHeaders,
      body: {
        annotationId: annotation.id,
        pageId: page.id,
        assignedToUserId: assignee.user.id,
        title: `WSS Evidence Task ${label} ${timestamp}`,
        description: `WSS evidence task ${label}`,
        priority: 1,
        deadline: new Date(Date.now() + 86400000).toISOString()
      }
    })).data;
  }

  const taskA = await triggerTask('A');
  await waitForNotificationCount(received, 1);
  const notificationA = received[0];

  docker(['stop', 'manga-prodlike-notification-api-1']);
  const reconnectingObserved = await waitFor(() => connectionStates.some(s => s.state === 'reconnecting' || s.state === 'closed'), 15000);
  docker(['start', 'manga-prodlike-notification-api-1']);
  const notificationHealthy = await waitForNotificationHealthy();
  const reconnectedObserved = await waitFor(() => connection.state === signalR.HubConnectionState.Connected, 30000);

  const taskB = await triggerTask('B');
  await waitForNotificationCount(received, 2);

  const mine = await api('/notifications/my?page=1&pageSize=20', {
    headers: { authorization: `Bearer ${assignee.accessToken}` }
  });
  const unread = await api('/notifications/unread-count', {
    headers: { authorization: `Bearer ${assignee.accessToken}` }
  });

  await connection.stop();

  const notificationB = received.find(n => n.sourceEventId !== notificationA?.sourceEventId);
  const deliveriesBySource = received.reduce((acc, item) => {
    acc[item.sourceEventId] = (acc[item.sourceEventId] || 0) + 1;
    return acc;
  }, {});
  const sourceEventId = notificationA?.sourceEventId;
  const sourceEventIdB = notificationB?.sourceEventId;
  const dbCount = sourceEventId ? notificationRows(assignee.user.id, sourceEventId) : 0;
  const dbCountB = sourceEventIdB ? notificationRows(assignee.user.id, sourceEventIdB) : 0;
  const apiMatches = sourceEventId ? mine.data.filter(n => n.sourceEventId === sourceEventId).length : 0;
  const apiMatchesB = sourceEventIdB ? mine.data.filter(n => n.sourceEventId === sourceEventIdB).length : 0;
  const noDuplicate = sourceEventId && sourceEventIdB && deliveriesBySource[sourceEventId] === 1 && deliveriesBySource[sourceEventIdB] === 1;

  console.log(JSON.stringify({
    status: notificationA && notificationB && dbCount === 1 && dbCountB === 1 && apiMatches === 1 && apiMatchesB === 1 && reconnectingObserved && notificationHealthy && reconnectedObserved && noDuplicate ? 'PASS' : 'FAIL',
    hub: 'wss://api.manga.local/notifications/hub',
    directNotificationServiceUsed: false,
    userId: assignee.user.id,
    taskAId: taskA.id,
    taskBId: taskB.id,
    notificationAId: notificationA?.id || null,
    notificationBId: notificationB?.id || null,
    sourceEventId: sourceEventId || null,
    sourceEventIdB: sourceEventIdB || null,
    sourceEventType: notificationA?.sourceEventType || null,
    receiveTimestamp: notificationA?.receivedAt || null,
    receiveTimestampB: notificationB?.receivedAt || null,
    realtimeDeliveries: received.length,
    deliveriesBySource,
    reconnectingObserved,
    reconnectedObserved,
    notificationHealthyAfterRestart: notificationHealthy,
    singleActiveConnectionAtEnd: connection.state === signalR.HubConnectionState.Disconnected,
    databaseRowsForSourceEvent: dbCount,
    databaseRowsForSourceEventB: dbCountB,
    apiRowsForSourceEvent: apiMatches,
    apiRowsForSourceEventB: apiMatchesB,
    noDuplicateAfterReconnect: noDuplicate,
    unreadCount: unread.data?.count ?? unread.data?.unreadCount ?? unread.data
  }, null, 2));
}

main().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
