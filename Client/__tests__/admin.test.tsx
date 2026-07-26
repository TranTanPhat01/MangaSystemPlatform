// @vitest-environment jsdom
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { act, render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';

// --- Mocks ---
const mockReplace = vi.fn();
const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: mockReplace,
    push: mockPush,
  }),
  usePathname: () => '/admin/users',
  useSearchParams: () => ({
    get: () => null,
  }),
}));

// Mock Auth Store state
const mockUserStore = {
  user: {
    fullName: 'Test Admin',
    roles: ['Admin'],
  },
  isAuthenticated: true,
  logout: vi.fn(),
};

vi.mock('@/store/auth-store', () => ({
  useAuthStore: () => mockUserStore,
}));

// Mock APIs
import { adminApi } from '@/services/admin-api';
import { healthApi } from '@/services/health-api';
import { mangaApi } from '@/services/manga-api';

vi.mock('@/services/admin-api', () => ({
  adminApi: {
    listUsers: vi.fn(),
    getUserDetail: vi.fn(),
    updateUserStatus: vi.fn(),
    updateUserRoles: vi.fn(),
    getRoles: vi.fn(),
    getPermissions: vi.fn(),
    createStudio: vi.fn(),
    listStudios: vi.fn(),
    createSeries: vi.fn(),
    createChapter: vi.fn(),
    createPage: vi.fn(),
    publishChapter: vi.fn(),
  },
}));

vi.mock('@/services/health-api', () => ({
  healthApi: {
    getLive: vi.fn(),
    getReady: vi.fn(),
    getServices: vi.fn(),
    getDetailedOverview: vi.fn(),
  },
}));

vi.mock('@/services/manga-api', () => ({
  mangaApi: {
    getSeries: vi.fn(),
    submitProposal: vi.fn(),
    approveProposal: vi.fn(),
    rejectProposal: vi.fn(),
  },
}));

// Mock components that we don't want to render deeply
vi.mock('@/components/notifications/NotificationDropdown', () => ({
  default: () => <div data-testid="notification-dropdown">Notifications</div>,
}));

// --- Test Imports ---
import DashboardPage from '@/app/dashboard/page';
import AdminLayout from '@/app/admin/layout';
import UserManagement from '@/components/admin/UserManagement';
import SystemHealth from '@/components/admin/SystemHealth';
import SeriesManagement from '@/components/admin/SeriesManagement';

type MockFunction = ReturnType<typeof vi.fn>;

describe('Admin Portal MVP Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock responses
    (adminApi.listUsers as MockFunction).mockResolvedValue({
      data: {
        success: true,
        data: {
          items: [
            { id: 'user-1', displayName: 'User One', email: 'user1@example.com', roles: ['Mangaka'], status: 1, emailVerified: true, createdAt: '2026-07-18T10:00:00Z' }
          ],
          totalItems: 1,
          totalPages: 1,
          page: 1,
          pageSize: 10,
        }
      }
    });

    (adminApi.getRoles as MockFunction).mockResolvedValue({
      data: {
        success: true,
        data: [
          { id: 'role-1', name: 'Admin', description: 'Admin description', permissions: [] },
          { id: 'role-2', name: 'Mangaka', description: 'Mangaka description', permissions: [] }
        ]
      }
    });

    (adminApi.listStudios as MockFunction).mockResolvedValue({
      data: {
        success: true,
        data: [{ id: 'studio-1', name: 'Studio Ghibli' }]
      }
    });

    (healthApi.getServices as MockFunction).mockResolvedValue({
      data: {
        'Identity API': 'Healthy',
        'Manga API': 'Healthy'
      }
    });

    (mangaApi.getSeries as MockFunction).mockResolvedValue({
      data: {
        success: true,
        data: [
          { id: 'series-1', title: 'Test Series', description: 'Synopsis', status: 'Draft', chapterCount: 0, createdAt: '2026-07-18T10:00:00Z', updatedAt: '' }
        ]
      }
    });

    (healthApi.getDetailedOverview as MockFunction).mockResolvedValue({
      data: {
        success: true,
        data: {
          status: 'Healthy',
          checkedAt: '2026-07-18T10:00:00Z',
          environment: 'Development',
          summary: { healthyServices: 6, totalServices: 6, totalFailedOutbox: 0, totalPendingOutbox: 0, criticalAlerts: 0, warningAlerts: 0 },
          services: [
            { name: 'Gateway', status: 'Healthy', version: '1.0', build: 'local', checkedAt: '2026-07-18T10:00:00Z', dependencies: [], warnings: [] }
          ]
        }
      }
    });
  });

  // --- Priority 1: Role Routing & Guards ---
  
  it('renders AdminDashboard for Admin role', async () => {
    mockUserStore.user = { fullName: 'Admin User', roles: ['Admin'] };
    mockUserStore.isAuthenticated = true;

    render(<DashboardPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Administrative Workspace')).toBeDefined();
    });
  });

  it('renders MangakaDashboard for Mangaka role', async () => {
    mockUserStore.user = { fullName: 'Mangaka User', roles: ['Mangaka'] };
    mockUserStore.isAuthenticated = true;

    render(<DashboardPage />);
    
    // MangakaDashboard contains unique tab items
    await waitFor(() => {
      expect(screen.getAllByText('Mangaka').length).toBeGreaterThan(0);
    });
  });

  it('blocks Admin route layout access for non-admin', async () => {
    mockUserStore.user = { fullName: 'Mangaka User', roles: ['Mangaka'] };
    mockUserStore.isAuthenticated = true;

    render(
      <AdminLayout>
        <div data-testid="admin-content">Admin Route Protected Area</div>
      </AdminLayout>
    );

    // Displays Access Denied 403 screen instead of children content
    await waitFor(() => {
      expect(screen.queryByTestId('admin-content')).toBeNull();
      expect(screen.getByText('403 Forbidden')).toBeDefined();
    });
  });

  // --- Priority 3: Admin API & User Management ---

  it('loads user list from Identity Admin API', async () => {
    render(<UserManagement />);
    
    await waitFor(() => {
      expect(adminApi.listUsers).toHaveBeenCalled();
      expect(screen.getByText('User One')).toBeDefined();
      expect(screen.getByText('user1@example.com')).toBeDefined();
    });
  });

  it('calls correct status endpoint when suspending user', async () => {
    window.confirm = () => true;
    render(<UserManagement />);
    
    await waitFor(() => {
      expect(screen.getByTitle('Suspend User')).toBeDefined();
    });

    fireEvent.click(screen.getByTitle('Suspend User'));

    await waitFor(() => {
      expect(adminApi.updateUserStatus).toHaveBeenCalledWith('user-1', { status: 2 });
    });
  });

  it('loads role assignment dialog catalog', async () => {
    render(<UserManagement />);
    
    await waitFor(() => {
      expect(adminApi.getRoles).toHaveBeenCalled();
    });
  });

  // --- Priority 4: System Health ---

  it('renders system health live status & diagnostics details', async () => {
    render(<SystemHealth />);

    await waitFor(() => {
      expect(healthApi.getDetailedOverview).toHaveBeenCalled();
      expect(screen.getByText('Gateway status')).toBeDefined();
      expect(screen.getByText('Gateway')).toBeDefined();
    });
  });

  it('uses real gateway and service statuses when detailed monitoring falls back', async () => {
    (healthApi.getDetailedOverview as MockFunction).mockRejectedValue(new Error('overview unavailable'));
    (healthApi.getLive as MockFunction).mockResolvedValue({ data: { status: 'Healthy' } });
    (healthApi.getServices as MockFunction).mockResolvedValue({
      data: {
        identity: 'Healthy',
        manga: 'Unhealthy',
      },
    });

    render(<SystemHealth />);

    await waitFor(() => {
      expect(healthApi.getLive).toHaveBeenCalled();
      expect(healthApi.getServices).toHaveBeenCalled();
      expect(screen.getByText('1 / 2')).toBeDefined();
      expect(screen.getByText('identity')).toBeDefined();
      expect(screen.getByText('manga')).toBeDefined();
      expect(screen.getByText('Unhealthy')).toBeDefined();
    });
  });

  it('preserves real service statuses from a 503 health response payload', async () => {
    (healthApi.getDetailedOverview as MockFunction).mockRejectedValue(new Error('overview unavailable'));
    (healthApi.getLive as MockFunction).mockResolvedValue({ data: { status: 'Healthy' } });
    (healthApi.getServices as MockFunction).mockRejectedValue({
      response: {
        status: 503,
        data: {
          gateway: 'Healthy',
          identity: 'Healthy',
          manga: 'Unhealthy',
        },
      },
    });

    render(<SystemHealth />);

    await waitFor(() => {
      expect(screen.getByText('1 / 2')).toBeDefined();
      expect(screen.getByText('identity')).toBeDefined();
      expect(screen.getByText('manga')).toBeDefined();
      expect(screen.getByText('Unhealthy')).toBeDefined();
    });
  });

  it('shows unavailable outbox metrics as N/A in fallback mode', async () => {
    (healthApi.getDetailedOverview as MockFunction).mockRejectedValue(new Error('overview unavailable'));
    (healthApi.getLive as MockFunction).mockResolvedValue({ data: { status: 'Healthy' } });
    (healthApi.getServices as MockFunction).mockResolvedValue({
      data: { identity: 'Healthy' },
    });

    render(<SystemHealth />);

    await waitFor(() => {
      expect(screen.getAllByText('N/A')).toHaveLength(2);
    });
  });

  it('marks unavailable service data as unknown instead of inventing healthy services', async () => {
    (healthApi.getDetailedOverview as MockFunction).mockRejectedValue(new Error('overview unavailable'));
    (healthApi.getLive as MockFunction).mockResolvedValue({ data: { status: 'Healthy' } });
    (healthApi.getServices as MockFunction).mockRejectedValue(new Error('services unavailable'));

    render(<SystemHealth />);

    await waitFor(() => {
      expect(screen.getByText('0 / 5')).toBeDefined();
      expect(screen.getAllByText('Unknown')).toHaveLength(5);
      expect(screen.getByText('Service status data is unavailable. Gateway health is shown from /health/live.')).toBeDefined();
    });
  });

  it('does not interpret a 503 error envelope as a service status map', async () => {
    (healthApi.getDetailedOverview as MockFunction).mockRejectedValue(new Error('overview unavailable'));
    (healthApi.getLive as MockFunction).mockResolvedValue({ data: { status: 'Healthy' } });
    (healthApi.getServices as MockFunction).mockRejectedValue({
      response: { status: 503, data: { message: 'services unavailable' } },
    });

    render(<SystemHealth />);

    await waitFor(() => {
      expect(screen.getByText('0 / 5')).toBeDefined();
      expect(screen.getAllByText('Unknown')).toHaveLength(5);
      expect(screen.queryByText('services unavailable')).toBeNull();
    });
  });

  it('labels preserved health data as stale after a later total fallback failure', async () => {
    render(<SystemHealth />);
    await screen.findByText('Gateway');

    (healthApi.getDetailedOverview as MockFunction).mockRejectedValue(new Error('overview unavailable'));
    (healthApi.getLive as MockFunction).mockRejectedValue(new Error('gateway unavailable'));
    (healthApi.getServices as MockFunction).mockRejectedValue(new Error('services unavailable'));
    fireEvent.click(screen.getByRole('button', { name: /force refresh/i }));

    expect(await screen.findByText(/showing last known data/i)).toBeDefined();
    expect(screen.getByText('Gateway')).toBeDefined();
  });

  it('renders an unknown degraded state when every monitoring endpoint fails', async () => {
    (healthApi.getDetailedOverview as MockFunction).mockRejectedValue(new Error('overview unavailable'));
    (healthApi.getLive as MockFunction).mockRejectedValue(new Error('gateway unavailable'));
    (healthApi.getServices as MockFunction).mockRejectedValue(new Error('services unavailable'));

    render(<SystemHealth />);

    await waitFor(() => {
      expect(screen.getAllByText('Unknown')).toHaveLength(6);
      expect(screen.getByText('0 / 5')).toBeDefined();
      expect(screen.getByText(/gateway health and service status data are unavailable/i)).toBeDefined();
    });
  });

  it('uses amber rather than red styling for unknown fallback services', async () => {
    (healthApi.getDetailedOverview as MockFunction).mockRejectedValue(new Error('overview unavailable'));
    (healthApi.getLive as MockFunction).mockResolvedValue({ data: { status: 'Healthy' } });
    (healthApi.getServices as MockFunction).mockRejectedValue(new Error('services unavailable'));

    render(<SystemHealth />);

    const identityCard = (await screen.findByText('Identity Service')).closest('[data-service-status]');
    expect(identityCard?.className).toContain('border-amber');
    expect(identityCard?.className).not.toContain('border-rose');
  });

  it('does not let an older polling response overwrite a newer health snapshot', async () => {
    vi.useFakeTimers();
    let resolveFirst: ((value: unknown) => void) | undefined;
    const firstResponse = new Promise((resolve) => {
      resolveFirst = resolve;
    });
    (healthApi.getDetailedOverview as MockFunction)
      .mockReturnValueOnce(firstResponse)
      .mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            status: 'Healthy',
            checkedAt: '2026-07-18T10:01:00Z',
            environment: 'New snapshot',
            summary: { healthyServices: 1, totalServices: 1, totalFailedOutbox: 0, totalPendingOutbox: 0, criticalAlerts: 0, warningAlerts: 0 },
            services: [{ name: 'New Service', status: 'Healthy', version: '2.0', build: 'new', checkedAt: '2026-07-18T10:01:00Z', dependencies: [], warnings: [] }],
          },
        },
      });

    try {
      render(<SystemHealth />);
      await act(async () => {
        await vi.advanceTimersByTimeAsync(0);
      });
      expect(healthApi.getDetailedOverview).toHaveBeenCalledTimes(1);

      await act(async () => {
        await vi.advanceTimersByTimeAsync(15000);
      });
      expect(healthApi.getDetailedOverview).toHaveBeenCalledTimes(2);
      expect(screen.getByText('New snapshot')).toBeDefined();

      await act(async () => {
        resolveFirst?.({
          data: {
            success: true,
            data: {
              status: 'Healthy',
              checkedAt: '2026-07-18T10:00:00Z',
              environment: 'Old snapshot',
              summary: { healthyServices: 1, totalServices: 1, totalFailedOutbox: 0, totalPendingOutbox: 0, criticalAlerts: 0, warningAlerts: 0 },
              services: [{ name: 'Old Service', status: 'Healthy', version: '1.0', build: 'old', checkedAt: '2026-07-18T10:00:00Z', dependencies: [], warnings: [] }],
            },
          },
        });
        await Promise.resolve();
      });

      expect(screen.getByText('New snapshot')).toBeDefined();
      expect(screen.queryByText('Old snapshot')).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  // --- Priority 5: Series and Chapter Workflow ---

  it('allows creating series with selected studio', async () => {
    render(<SeriesManagement />);

    // Click Create Series
    fireEvent.click(screen.getByText('Create Series'));

    await waitFor(() => {
      expect(screen.getByText('Create Manga Series')).toBeDefined();
    });
  });
});
