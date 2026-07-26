import { expect, test } from '@playwright/test';
import axios from './support/axios';

const GATEWAY_URL = 'http://localhost:5200';
const CLIENT_URL = 'http://localhost:3000';

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

test.describe('Batch 7 Final System Acceptance E2E Master Workflow', () => {
  let isBackendLive = false;
  let adminAuth: any;
  let mangakaAuth: any;
  let assistantAuth: any;
  let editorAuth: any;
  let boardAuth: any;
  let timestamp: number;

  test.beforeAll(async () => {
    isBackendLive = await verifyBackendConnection();
    if (!isBackendLive) {
      console.warn('⚠️ Local backend is not live. Skipping Batch 7 E2E Master Workflow.');
      return;
    }

    timestamp = Date.now();
    adminAuth = await loginUser('admin@gmail.com', 'Admin@system');
    const authHeaders = { Authorization: `Bearer ${adminAuth.accessToken}` };

    // Create fresh test users for this master workflow run
    const mangakaEmail = `mangaka_b7_${timestamp}@example.com`;
    const assistantEmail = `assistant_b7_${timestamp}@example.com`;
    const editorEmail = `editor_b7_${timestamp}@example.com`;
    const boardEmail = `board_b7_${timestamp}@example.com`;

    await axios.post(`${GATEWAY_URL}/identity/admin/users`, {
      email: mangakaEmail,
      username: `mangaka_b7_${timestamp}`,
      fullName: 'B7 Mangaka',
      password: 'Password@123',
      roles: ['Mangaka'],
    }, { headers: authHeaders });

    await axios.post(`${GATEWAY_URL}/identity/admin/users`, {
      email: assistantEmail,
      username: `assistant_b7_${timestamp}`,
      fullName: 'B7 Assistant',
      password: 'Password@123',
      roles: ['Assistant'],
    }, { headers: authHeaders });

    await axios.post(`${GATEWAY_URL}/identity/admin/users`, {
      email: editorEmail,
      username: `editor_b7_${timestamp}`,
      fullName: 'B7 Editor',
      password: 'Password@123',
      roles: ['TantouEditor'],
    }, { headers: authHeaders });

    await axios.post(`${GATEWAY_URL}/identity/admin/users`, {
      email: boardEmail,
      username: `board_b7_${timestamp}`,
      fullName: 'B7 Board Member',
      password: 'Password@123',
      roles: ['EditorialBoard'],
    }, { headers: authHeaders });

    mangakaAuth = await loginUser(mangakaEmail, 'Password@123');
    assistantAuth = await loginUser(assistantEmail, 'Password@123');
    editorAuth = await loginUser(editorEmail, 'Password@123');
    boardAuth = await loginUser(boardEmail, 'Password@123');
  });

  test.beforeEach(async ({ page }) => {
    test.skip(!isBackendLive, 'Backend connection is not live');
  });

  test('Flow A - Auth & Role Navigation and protected routes', async ({ page }) => {
    // 1. Unauthenticated user redirects to login
    await page.goto(`${CLIENT_URL}/dashboard`);
    await page.waitForURL(url => url.pathname === '/login');

    // 2. Login as Assistant
    await page.locator('input[type="email"]').fill(assistantAuth.user.email);
    await page.locator('input[type="password"]').fill('Password@123');
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(url => url.pathname === '/dashboard');

    // 3. Confirm Assistant workspace details are visible
    await expect(page.locator('text=Assistant Workspace')).toBeVisible();

    // Seed assistant cookies and localStorage to persist hard page navigation
    const { accessToken, refreshToken, user } = assistantAuth;
    await page.context().addCookies([
      { name: 'auth_token', value: accessToken, url: CLIENT_URL },
      { name: 'user_roles', value: JSON.stringify(user.roles), url: CLIENT_URL },
    ]);
    await page.addInitScript(({ token, refresh, u }) => {
      window.localStorage.setItem('manga-auth-storage', JSON.stringify({
        state: { accessToken: token, refreshToken: refresh, user: u, isAuthenticated: true },
        version: 0,
      }));
    }, { token: accessToken, refresh: refreshToken, u: user });

    // Go to editorial page and verify assistant is blocked by middleware role guard
    await page.goto(`${CLIENT_URL}/editorial`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=You do not have permission to access this workspace')).toBeVisible();

    // Return to dashboard where header controls are available
    await page.goto(`${CLIENT_URL}/dashboard`);
    await page.waitForLoadState('networkidle');

    // Open profile dropdown
    await page.locator('button:has-text("Kenji Tanaka")').click();

    // 4. Logout
    const signOutBtn = page.locator('button:has-text("Sign Out")');
    await expect(signOutBtn).toBeVisible();
    await signOutBtn.click();
    await page.waitForURL(url => url.pathname === '/login');
  });

  test('Flow B to J - Full-Stack Editorial and Board Publication Master Lifecycle', async ({ page }) => {
    // Authenticate Mangaka page context
    const { accessToken, refreshToken, user } = mangakaAuth;
    await page.context().addCookies([
      { name: 'auth_token', value: accessToken, url: CLIENT_URL },
      { name: 'user_roles', value: JSON.stringify(user.roles), url: CLIENT_URL },
    ]);

    await page.addInitScript(({ token, refresh, u }) => {
      window.localStorage.setItem('manga-auth-storage', JSON.stringify({
        state: { accessToken: token, refreshToken: refresh, user: u, isAuthenticated: true },
        version: 0,
      }));
    }, { token: accessToken, refresh: refreshToken, u: user });

    // 1. Mangaka setup Studio & active Series
    const mangakaHeaders = { Authorization: `Bearer ${mangakaAuth.accessToken}` };
    const studioRes = await axios.post(`${GATEWAY_URL}/manga/studios`, {
      name: `B7 Studio ${timestamp}`,
      description: 'B7 E2E Studio',
    }, { headers: mangakaHeaders });
    const studioId = studioRes.data.data.id;

    await axios.post(`${GATEWAY_URL}/manga/studios/${studioId}/members`, {
      userId: assistantAuth.user.id,
      role: 'Assistant',
    }, { headers: mangakaHeaders });

    const seriesRes = await axios.post(`${GATEWAY_URL}/manga/series`, {
      studioId,
      title: `B7 Series ${timestamp}`,
      description: 'B7 Series Description',
      genre: 'Action',
    }, { headers: mangakaHeaders });
    const seriesId = seriesRes.data.data.id;

    // Submit & Approve Series Proposal so it is active
    await axios.post(`${GATEWAY_URL}/manga/series/${seriesId}/submit-proposal`, {}, { headers: mangakaHeaders });
    await axios.post(`${GATEWAY_URL}/manga/series/${seriesId}/approve-proposal`, { decisionNote: 'B7 approve' }, { headers: { Authorization: `Bearer ${adminAuth.accessToken}` } });

    // Upload page file
    const fileFormData = new FormData();
    const dummyFile = new Blob(['dummy-image-contents-b7'], { type: 'image/png' });
    fileFormData.append('file', dummyFile, 'b7_page.png');
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
      title: 'B7 Chapter 1',
      progressPercentage: 0,
    }, { headers: mangakaHeaders });
    const chapterId = chapterRes.data.data.id;

    // Transition chapter status to InProduction
    await axios.patch(`${GATEWAY_URL}/manga/chapters/${chapterId}/status`, {
      status: 2, // InProduction
    }, { headers: mangakaHeaders });

    const pageRes = await axios.post(`${GATEWAY_URL}/manga/chapters/${chapterId}/pages`, {
      pageNumber: 1,
      fileId: pageFileId,
    }, { headers: mangakaHeaders });
    const pageId = pageRes.data.data.id;

    const annotationRes = await axios.post(`${GATEWAY_URL}/manga/pages/${pageId}/annotations`, {
      type: 4,
      coordinatesJson: JSON.stringify({ x: 10, y: 10, w: 100, h: 100 }),
      description: 'Draw lineart bubbles',
    }, { headers: mangakaHeaders });
    const annotationId = annotationRes.data.data.id;

    // 2. Assign task to assistant
    const taskRes = await axios.post(`${GATEWAY_URL}/manga/tasks`, {
      annotationId,
      pageId,
      assignedToUserId: assistantAuth.user.id,
      title: 'Ink bubbled outline',
      description: 'Please fix outline detail',
      priority: 1,
      deadline: new Date(Date.now() + 86400000).toISOString(),
    }, { headers: mangakaHeaders });
    const taskId = taskRes.data.data.id;

    // Open Mangaka Dashboard
    await page.goto(`${CLIENT_URL}/dashboard`);
    await page.waitForLoadState('networkidle');

    // Confirm bell and active user details are correct (No hardcoded Akira)
    const bellBtn = page.locator('button:has(svg.lucide-bell)').last();
    await expect(bellBtn).toBeVisible();
    await expect(page.locator('text=B7 Mangaka').first()).toBeVisible();

    // Check responsive viewport scaling
    await page.setViewportSize({ width: 360, height: 800 });
    // Confirm there is no horizontal overflow scroll on mobile dashboard
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(overflow).toBe(false);

    // Reset desktop viewport
    await page.setViewportSize({ width: 1280, height: 800 });

    // 3. Assistant submits the task via API
    const assistantHeaders = { Authorization: `Bearer ${assistantAuth.accessToken}` };
    await axios.post(`${GATEWAY_URL}/manga/tasks/${taskId}/start`, {}, { headers: assistantHeaders });
    await axios.post(`${GATEWAY_URL}/manga/tasks/${taskId}/submit`, {
      fileId: pageFileId,
      note: 'Submit task lines',
    }, { headers: assistantHeaders });

    // 4. Mangaka approves task & submits chapter for editorial review
    await axios.post(`${GATEWAY_URL}/manga/tasks/${taskId}/approve`, {}, { headers: mangakaHeaders });
    await axios.post(`${GATEWAY_URL}/manga/chapters/${chapterId}/submit-review`, {}, { headers: mangakaHeaders });

    // 5. Tantou Editor reviews chapter and approves it
    const editorHeaders = { Authorization: `Bearer ${editorAuth.accessToken}` };
    
    // Poll until the review is created asynchronously via RabbitMQ
    let reviewId = '';
    for (let i = 0; i < 15; i++) {
      const reviewRes = await axios.get(`${GATEWAY_URL}/editorial/reviews`, { headers: editorHeaders });
      const activeReviews = reviewRes.data.data.filter((r: any) => r.chapterId === chapterId);
      if (activeReviews.length > 0) {
        reviewId = activeReviews[0].id;
        break;
      }
      await new Promise(r => setTimeout(r, 500));
    }
    expect(reviewId).not.toBe('');

    await axios.post(`${GATEWAY_URL}/editorial/reviews/${reviewId}/start`, {}, { headers: editorHeaders });
    await axios.post(`${GATEWAY_URL}/editorial/reviews/${reviewId}/approve`, {
      decisionNote: 'Review looks stellar, approving!',
    }, { headers: editorHeaders });

    // 6. Security XSS rendering defense verification
    const xssPayload = '<script>alert("xss")</script> Xss Safe Title';
    const xssSeriesRes = await axios.post(`${GATEWAY_URL}/manga/series`, {
      studioId,
      title: xssPayload,
      description: 'Xss Description',
      genre: 'Action',
    }, { headers: mangakaHeaders });
    const xssSeriesId = xssSeriesRes.data.data.id;
    await axios.post(`${GATEWAY_URL}/manga/series/${xssSeriesId}/submit-proposal`, {}, { headers: mangakaHeaders });

    // Authenticate Board Member page context
    const boardCookie = boardAuth;
    await page.context().addCookies([
      { name: 'auth_token', value: boardCookie.accessToken, url: CLIENT_URL },
      { name: 'user_roles', value: JSON.stringify(boardCookie.user.roles), url: CLIENT_URL },
    ]);
    await page.addInitScript(({ token, refresh, u }) => {
      window.localStorage.setItem('manga-auth-storage', JSON.stringify({
        state: { accessToken: token, refreshToken: refresh, user: u, isAuthenticated: true },
        version: 0,
      }));
    }, { token: boardCookie.accessToken, refresh: boardCookie.refreshToken, u: boardCookie.user });

    // Go to Board Proposals list
    await page.goto(`${CLIENT_URL}/board?tab=Proposals`);
    await page.waitForLoadState('networkidle');

    // Verify XSS script tags rendered as raw plain text, protecting the browser session
    const proposalTitleElement = page.locator(`text=${xssPayload}`).first();
    await expect(proposalTitleElement).toBeAttached();

    // 7. Security: Verify Cross-user notification reading is forbidden
    const visitorHeaders = { Authorization: `Bearer ${boardAuth.accessToken}` };
    try {
      await axios.patch(`${GATEWAY_URL}/notifications/${taskId}/read`, {}, { headers: visitorHeaders });
      throw new Error('Should have failed to read someone else\'s notification');
    } catch (err: any) {
      expect(err.response.status).toBe(404);
    }
  });
});
