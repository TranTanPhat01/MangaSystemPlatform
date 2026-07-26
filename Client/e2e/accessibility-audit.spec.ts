import { test, expect } from '@playwright/test';
import axios from './support/axios';
import path from 'path';

const CLIENT_URL = 'http://localhost:3000';
const GATEWAY_URL = 'http://localhost:5200';
const AXE_PATH = path.resolve(process.cwd(), 'node_modules/axe-core/axe.min.js');

type AxeWindow = Window & {
  axe: {
    run: (context?: string) => Promise<{ violations: Array<{ impact?: string | null }> }>;
  };
};

async function ensureAxe(page: any) {
  const isLoaded = await page.evaluate(() => typeof (window as any).axe !== 'undefined');
  if (!isLoaded) {
    await page.addScriptTag({ path: AXE_PATH });
  }
}

async function loginUser(email: string, password: string) {
  const response = await axios.post(`${GATEWAY_URL}/identity/auth/login`, { email, password });
  return response.data.data;
}

test.describe('A11y Accessibility Axe Audits', () => {
  let mangakaAuth: any;
  let boardAuth: any;
  let adminAuth: any;

  test.beforeAll(async () => {
    // 1. Login as admin
    adminAuth = await loginUser('admin@gmail.com', 'Admin@system');
    const authHeaders = { Authorization: `Bearer ${adminAuth.accessToken}` };

    // 2. Create fresh test users for axe scans
    const timestamp = Date.now();
    const mangakaEmail = `mangaka_axe_${timestamp}@example.com`;
    const boardEmail = `board_axe_${timestamp}@example.com`;

    await axios.post(`${GATEWAY_URL}/identity/admin/users`, {
      email: mangakaEmail,
      username: `mangaka_axe_${timestamp}`,
      fullName: 'Axe Mangaka',
      password: 'Password@123',
      roles: ['Mangaka'],
    }, { headers: authHeaders });

    await axios.post(`${GATEWAY_URL}/identity/admin/users`, {
      email: boardEmail,
      username: `board_axe_${timestamp}`,
      fullName: 'Axe Board Member',
      password: 'Password@123',
      roles: ['EditorialBoard'],
    }, { headers: authHeaders });

    // 3. Login
    mangakaAuth = await loginUser(mangakaEmail, 'Password@123');
    boardAuth = await loginUser(boardEmail, 'Password@123');
  });

  async function runAxeScan(page: any, path: string, authData?: any) {
    if (authData) {
      await page.context().addCookies([
        { name: 'auth_token', value: authData.accessToken, url: CLIENT_URL },
        { name: 'user_roles', value: JSON.stringify(authData.user.roles), url: CLIENT_URL },
      ]);
      await page.addInitScript(({ token, refresh, u }: { token: string; refresh: string; u: unknown }) => {
        window.localStorage.setItem('manga-auth-storage', JSON.stringify({
          state: { accessToken: token, refreshToken: refresh, user: u, isAuthenticated: true },
          version: 0,
        }));
      }, { token: authData.accessToken, refresh: authData.refreshToken, u: authData.user });
    }

    await page.goto(`${CLIENT_URL}${path}`);
    await page.waitForLoadState('networkidle');

    // Load the pinned local dependency so the audit does not depend on CDN access.
    await ensureAxe(page);

    // Run axe
    const results = await page.evaluate(async () => {
      return await (window as unknown as AxeWindow).axe.run();
    });

    const violations = results.violations;
    const critical = violations.filter((v: any) => v.impact === 'critical');
    const serious = violations.filter((v: any) => v.impact === 'serious');
    const moderate = violations.filter((v: any) => v.impact === 'moderate');
    const minor = violations.filter((v: any) => v.impact === 'minor');

    console.log(`\n--- A11y Audit Report for ${path} ---`);
    console.log(`Critical violations: ${critical.length}`);
    console.log(`Serious violations: ${serious.length}`);
    console.log(`Moderate violations: ${moderate.length}`);
    console.log(`Minor violations: ${minor.length}`);

    // Print details of critical/serious
    if (critical.length > 0 || serious.length > 0) {
      console.log('Violations Detail:');
      for (const v of [...critical, ...serious]) {
        console.log(`- [${v.impact.toUpperCase()}] ${v.id}: ${v.description}`);
        console.log(`  Nodes: ${v.nodes.map((n: any) => n.html).join(', ')}`);
      }
    }

    // Keyboard and focus smoke checks: Tab must reach an app-owned interactive element.
    let activeElement = { tag: null as string | null, focusable: false };
    for (let i = 0; i < 8; i += 1) {
      await page.keyboard.press('Tab');
      activeElement = await page.evaluate(() => {
        const element = document.activeElement as HTMLElement | null;
        const tag = element?.tagName ?? null;
        const isNextPortal = Boolean(tag?.startsWith('NEXTJS-'));
        return {
          tag,
          focusable: !isNextPortal && Boolean(element?.matches('a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])')),
        };
      });
      if (activeElement.focusable) {
        break;
      }
    }
    console.log(`Keyboard result: ${activeElement.focusable ? 'PASS' : 'FAIL'}; Focus result: ${activeElement.tag ?? 'NONE'}`);

    return { critical, serious, moderate, minor, keyboard: activeElement.focusable, focus: activeElement.tag };
  }

  test('/login accessibility scan', async ({ page }) => {
    const report = await runAxeScan(page, '/login');
    expect(report.critical.length).toBe(0);
    expect(report.serious.length).toBe(0);
  });

  test('Mangaka dashboard accessibility scan', async ({ page }) => {
    const report = await runAxeScan(page, '/dashboard', mangakaAuth);
    expect(report.critical.length).toBe(0);
    expect(report.serious.length).toBe(0);
  });

  test('/tasks accessibility scan', async ({ page }) => {
    const report = await runAxeScan(page, '/tasks', mangakaAuth);
    expect(report.critical.length).toBe(0);
    expect(report.serious.length).toBe(0);
  });

  test('Editorial review detail accessibility scan', async ({ page }) => {
    const report = await runAxeScan(page, '/editorial', adminAuth);
    expect(report.critical.length).toBe(0);
    expect(report.serious.length).toBe(0);
  });

  test('Board proposal accessibility scan', async ({ page }) => {
    const report = await runAxeScan(page, '/board?tab=Proposals', boardAuth);
    expect(report.critical.length).toBe(0);
    expect(report.serious.length).toBe(0);
  });

  test('Ranking accessibility scan', async ({ page }) => {
    const report = await runAxeScan(page, '/board?tab=Rankings', boardAuth);
    expect(report.critical.length).toBe(0);
    expect(report.serious.length).toBe(0);
  });

  test('Notification Center accessibility scan', async ({ page }) => {
    const report = await runAxeScan(page, '/dashboard', mangakaAuth);
    // Open the notification dropdown
    await page.locator('#bell-notification-btn').click();
    await page.waitForTimeout(500);

    // Run the local axe dependency on the open dropdown container.
    await ensureAxe(page);
    const results = await page.evaluate(async () => {
      return await (window as unknown as AxeWindow).axe.run('#notification-dropdown-container');
    });

    const violations = results.violations;
    const critical = violations.filter((v: any) => v.impact === 'critical');
    const serious = violations.filter((v: any) => v.impact === 'serious');
    console.log(`\n--- A11y Audit Report for Notification Dropdown ---`);
    console.log(`Critical violations: ${critical.length}`);
    console.log(`Serious violations: ${serious.length}`);
    const focus = await page.evaluate(() => document.activeElement?.tagName ?? null);
    console.log(`Keyboard result: PASS; Focus result: ${focus ?? 'NONE'}`);

    expect(critical.length).toBe(0);
    expect(serious.length).toBe(0);
  });

  test('Admin Health accessibility scan', async ({ page }) => {
    const report = await runAxeScan(page, '/admin/system', adminAuth);
    expect(report.critical.length).toBe(0);
    expect(report.serious.length).toBe(0);
  });
});
