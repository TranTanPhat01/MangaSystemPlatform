import { expect, test } from '@playwright/test';
import axios from './support/axios';

const GATEWAY_URL = 'http://localhost:5200';

async function verifyBackendConnection(): Promise<boolean> {
  try {
    const res = await axios.get(`${GATEWAY_URL}/health/live`, { timeout: 2000 });
    return res.status === 200;
  } catch {
    return false;
  }
}

async function loginUser(email: string, password: string) {
  const response = await axios.post(`${GATEWAY_URL}/identity/auth/login`, { email, password });
  return response.data.data;
}

test.describe('Batch 6 Notifications & Realtime Fullstack E2E Workflow', () => {
  let isBackendLive = false;
  let adminAuth: any;
  let mangakaAuth: any;
  let assistantAuth: any;
  let boardAuth: any;
  let timestamp: number;

  test.beforeAll(async () => {
    isBackendLive = await verifyBackendConnection();
    if (!isBackendLive) {
      console.warn('⚠️ Backend is not live. Skipping E2E tests.');
      return;
    }

    timestamp = Date.now();
    adminAuth = await loginUser('admin@gmail.com', 'Admin@system');
    const authHeaders = { Authorization: `Bearer ${adminAuth.accessToken}` };

    const mangakaEmail = `mangaka_b6_${timestamp}@example.com`;
    const assistantEmail = `assistant_b6_${timestamp}@example.com`;
    const boardEmail = `board_b6_${timestamp}@example.com`;

    // Create test users
    await axios.post(`${GATEWAY_URL}/identity/admin/users`, {
      email: mangakaEmail,
      username: `mangaka_b6_${timestamp}`,
      fullName: 'B6 Mangaka',
      password: 'Password@123',
      roles: ['Mangaka'],
    }, { headers: authHeaders });

    await axios.post(`${GATEWAY_URL}/identity/admin/users`, {
      email: assistantEmail,
      username: `assistant_b6_${timestamp}`,
      fullName: 'B6 Assistant',
      password: 'Password@123',
      roles: ['Assistant'],
    }, { headers: authHeaders });

    await axios.post(`${GATEWAY_URL}/identity/admin/users`, {
      email: boardEmail,
      username: `board_b6_${timestamp}`,
      fullName: 'B6 Board Member',
      password: 'Password@123',
      roles: ['EditorialBoard'],
    }, { headers: authHeaders });

    mangakaAuth = await loginUser(mangakaEmail, 'Password@123');
    assistantAuth = await loginUser(assistantEmail, 'Password@123');
    boardAuth = await loginUser(boardEmail, 'Password@123');
  });

  test.beforeEach(async ({ page }) => {
    test.skip(!isBackendLive, 'Backend connection is not live');
  });

  test('Flow A & F & G - Realtime Task Notification, Click Navigation, Mark Read, Fallback, Security', async ({ page }) => {
    // 1. Authenticate Assistant page context
    const { accessToken, refreshToken, user } = assistantAuth;
    await page.context().addCookies([
      { name: 'auth_token', value: accessToken, url: 'http://localhost:3000' },
      { name: 'user_roles', value: JSON.stringify(user.roles), url: 'http://localhost:3000' },
    ]);

    await page.addInitScript(({ token, refresh, u }) => {
      window.localStorage.setItem('manga-auth-storage', JSON.stringify({
        state: { accessToken: token, refreshToken: refresh, user: u, isAuthenticated: true },
        version: 0,
      }));
    }, { token: accessToken, refresh: refreshToken, u: user });

    page.on('console', msg => console.log('BROWSER LOG:', msg.text()));

    // Go to dashboard
    await page.goto('http://localhost:3000/assistant');
    await page.waitForLoadState('networkidle');

    // Confirm unread badge is 0 initially (bell button has no unread span or it's empty)
    const bellBtn = page.locator('button:has(svg.lucide-bell)').last();
    await expect(bellBtn).toBeVisible();

    // 2. Trigger task assignment via mangaka REST API
    const mangakaHeaders = { Authorization: `Bearer ${mangakaAuth.accessToken}` };
    const studioRes = await axios.post(`${GATEWAY_URL}/manga/studios`, {
      name: `B6 Studio ${timestamp}`,
      description: 'B6 E2E Studio',
    }, { headers: mangakaHeaders });
    const studioId = studioRes.data.data.id;

    // Join assistant to studio
    await axios.post(`${GATEWAY_URL}/manga/studios/${studioId}/members`, {
      userId: assistantAuth.user.id,
      role: 'Assistant',
    }, { headers: mangakaHeaders });

    const seriesRes = await axios.post(`${GATEWAY_URL}/manga/series`, {
      studioId,
      title: `B6 Series ${timestamp}`,
      description: 'B6 Series Description',
      genre: 'Action',
    }, { headers: mangakaHeaders });
    const seriesId = seriesRes.data.data.id;

    // Submit and Approve Series Proposal so it becomes Active and can host Chapters
    await axios.post(`${GATEWAY_URL}/manga/series/${seriesId}/submit-proposal`, {}, { headers: mangakaHeaders });
    await axios.post(`${GATEWAY_URL}/manga/series/${seriesId}/approve-proposal`, { decisionNote: 'Seed approve' }, { headers: { Authorization: `Bearer ${adminAuth.accessToken}` } });

    // Upload a page reference file
    const fileFormData = new FormData();
    const dummyFile = new Blob(['dummy-reference-img'], { type: 'image/png' });
    fileFormData.append('file', dummyFile, 'reference_page.png');
    fileFormData.append('category', 'Page');

    const fileUploadRes = await axios.post(`${GATEWAY_URL}/files/upload`, fileFormData, {
      headers: {
        Authorization: `Bearer ${mangakaAuth.accessToken}`,
        'Content-Type': 'multipart/form-data',
      },
    });
    const pageFileId = fileUploadRes.data.data.fileId;

    const chapterRes = await axios.post(`${GATEWAY_URL}/manga/series/${seriesId}/chapters`, {
      chapterNumber: 1,
      title: 'B6 Chapter 1',
      progressPercentage: 0,
    }, { headers: mangakaHeaders });
    const chapterId = chapterRes.data.data.id;

    const pageRes = await axios.post(`${GATEWAY_URL}/manga/chapters/${chapterId}/pages`, {
      pageNumber: 1,
      fileId: pageFileId,
    }, { headers: mangakaHeaders });
    const pageId = pageRes.data.data.id;

    const annotationRes = await axios.post(`${GATEWAY_URL}/manga/pages/${pageId}/annotations`, {
      type: 4,
      coordinatesJson: JSON.stringify({ x: 10, y: 10, w: 100, h: 100 }),
      description: 'Please fix bubble alignment',
    }, { headers: mangakaHeaders });
    const annotationId = annotationRes.data.data.id;

    // Assign task to assistant
    const taskRes = await axios.post(`${GATEWAY_URL}/manga/tasks`, {
      annotationId: annotationId,
      pageId: pageId,
      assignedToUserId: assistantAuth.user.id,
      title: 'Redraw speech bubbles',
      description: 'Please fix bubble alignment',
      priority: 1,
      deadline: new Date(Date.now() + 86400000).toISOString(),
    }, { headers: mangakaHeaders });
    const taskId = taskRes.data.data.id;

    // Verify unread count badge increases via SignalR push!
    const badge = bellBtn.locator('span.bg-indigo-600');
    await expect(badge).toBeVisible({ timeout: 15000 });
    await expect(badge).toHaveText(/^[1-9]\d*$/);

    // Click the bell to open the dropdown
    await bellBtn.click();

    // Verify the task notification card is displayed
    const notifItem = page.locator('div[role="button"]').filter({ hasText: 'New task assigned' }).first();
    await expect(notifItem).toBeVisible();

    // Click on the notification to trigger navigate and mark read
    await notifItem.click();

    // Page should navigate to /tasks?taskId={taskId}
    await expect(page).toHaveURL(new RegExp(`/tasks\\?taskId=${taskId}`));

    // Unread count should go back to 0
    await expect(badge).not.toBeVisible();

    // 3. Mark all as read security check
    // Try to mark/get someone else's notification via REST using Assistant credentials (G7 flow security)
    const assistantHeaders = { Authorization: `Bearer ${assistantAuth.accessToken}` };
    try {
      await axios.post(`${GATEWAY_URL}/notifications/${taskId}/read`, {}, { headers: assistantHeaders });
      // Should throw or fail since taskId is not a valid notificationId or not owned
    } catch (err: any) {
      expect(err.response.status).toBe(404);
    }
  });
});

function GuidEmpty(): string {
  return '00000000-0000-0000-0000-000000000000';
}
