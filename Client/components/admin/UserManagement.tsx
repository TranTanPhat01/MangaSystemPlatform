'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, 
  UserCheck, 
  UserX, 
  Key, 
  ShieldCheck, 
  ShieldAlert, 
  Activity, 
  RefreshCw, 
  Eye, 
  Settings,
  ChevronLeft,
  ChevronRight,
  UserCheck2,
  Lock,
  Unlock,
  AlertTriangle
} from 'lucide-react';
import { adminApi, AdminUserListItem, AdminRoleCatalog } from '@/services/admin-api';
import UserDetailDialog from './UserDetailDialog';
import UserRoleDialog from './UserRoleDialog';

export function UserManagement() {
  // Query Filters State
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  
  // Data State
  const [users, setUsers] = useState<AdminUserListItem[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [rolesCatalog, setRolesCatalog] = useState<AdminRoleCatalog[]>([]);
  
  // Loading & Alert State
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  
  // Modals & Selection State
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isRoleOpen, setIsRoleOpen] = useState(false);
  
  // Password Reset Modal State
  const [isPasswordResetOpen, setIsPasswordResetOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [passwordTargetUserId, setPasswordTargetUserId] = useState<string | null>(null);

  // Fetch Users Function
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const query = {
        page,
        pageSize,
        search: search.trim() || undefined,
        role: role || undefined,
        status: status || undefined,
        sortBy: 'createdAt',
        sortDirection: 'desc'
      };
      
      const res = await adminApi.listUsers(query);
      if (res.data.success) {
        setUsers(res.data.data.items);
        setTotalItems(res.data.data.totalItems);
        setTotalPages(res.data.data.totalPages);
      } else {
        setErrorMsg(res.data.message || 'Failed to retrieve users list.');
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.response?.data?.error || 'Could not fetch users list.');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, role, status]);

  // Fetch Roles Catalog
  const fetchRolesCatalog = async () => {
    try {
      const res = await adminApi.getRoles();
      if (res.data.success) {
        setRolesCatalog(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load roles catalog', err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    fetchRolesCatalog();
  }, []);

  // Show Temp Alerts
  const triggerSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 5000);
  };
  const triggerError = (msg: string) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(null), 5000);
  };

  // Toggle user status: Active (1) <-> Disabled (2)
  const handleToggleStatus = async (userId: string, currentStatus: number) => {
    const nextStatus = currentStatus === 1 ? 2 : 1;
    const actionName = nextStatus === 1 ? 'activate' : 'disable';
    
    if (!confirm(`Are you sure you want to ${actionName} this user?`)) return;
    
    setActionLoading(userId);
    setErrorMsg(null);
    try {
      const res = await adminApi.updateUserStatus(userId, { status: nextStatus });
      if (res.data.success) {
        triggerSuccess(`User successfully ${nextStatus === 1 ? 'activated' : 'disabled'}.`);
        fetchUsers();
      } else {
        triggerError(res.data.message || 'Failed to update user status.');
      }
    } catch (err: any) {
      triggerError(err.response?.data?.message || err.response?.data?.error || 'Failed to execute status action.');
    } finally {
      setActionLoading(null);
    }
  };

  // Lock user status: Lock (3)
  const handleLockUser = async (userId: string) => {
    const reason = prompt('Enter reason for locking this user:');
    if (reason === null) return;
    
    setActionLoading(userId);
    setErrorMsg(null);
    try {
      const lockoutUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // lock 7 days
      const res = await adminApi.lockUser(userId, { lockoutUntil, reason: reason || 'Violation' });
      if (res.data.success) {
        triggerSuccess('User locked successfully.');
        fetchUsers();
      } else {
        triggerError(res.data.message || 'Failed to lock user.');
      }
    } catch (err: any) {
      triggerError(err.response?.data?.message || err.response?.data?.error || 'Failed to lock user.');
    } finally {
      setActionLoading(null);
    }
  };

  // Unlock user status
  const handleUnlockUser = async (userId: string) => {
    if (!confirm('Are you sure you want to unlock this user?')) return;
    
    setActionLoading(userId);
    setErrorMsg(null);
    try {
      const res = await adminApi.unlockUser(userId);
      if (res.data.success) {
        triggerSuccess('User unlocked successfully.');
        fetchUsers();
      } else {
        triggerError(res.data.message || 'Failed to unlock user.');
      }
    } catch (err: any) {
      triggerError(err.response?.data?.message || err.response?.data?.error || 'Failed to unlock user.');
    } finally {
      setActionLoading(null);
    }
  };

  // Revoke all active sessions
  const handleRevokeSessions = async (userId: string) => {
    if (!confirm('Are you sure you want to terminate all active sessions for this user? They will be logged out immediately.')) return;
    
    setActionLoading(userId);
    setErrorMsg(null);
    try {
      const res = await adminApi.revokeUserSessions(userId);
      if (res.data.success) {
        triggerSuccess('All user sessions revoked successfully.');
      } else {
        triggerError(res.data.message || 'Failed to revoke sessions.');
      }
    } catch (err: any) {
      triggerError(err.response?.data?.message || err.response?.data?.error || 'Failed to revoke sessions.');
    } finally {
      setActionLoading(null);
    }
  };

  // Reset password handler
  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword.trim() || !passwordTargetUserId) return;
    
    setActionLoading(passwordTargetUserId);
    setErrorMsg(null);
    try {
      const res = await adminApi.resetUserPassword(passwordTargetUserId, { newPassword });
      if (res.data.success) {
        triggerSuccess('Password reset successfully.');
        setIsPasswordResetOpen(false);
        setNewPassword('');
      } else {
        triggerError(res.data.message || 'Failed to reset password.');
      }
    } catch (err: any) {
      triggerError(err.response?.data?.message || err.response?.data?.error || 'Failed to reset password.');
    } finally {
      setActionLoading(null);
    }
  };

  // Open detail dialog
  const openDetail = (userId: string) => {
    setSelectedUserId(userId);
    setIsDetailOpen(true);
  };

  // Open roles dialog
  const openRoleEdit = (userId: string) => {
    setSelectedUserId(userId);
    setIsRoleOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Notifications Banners */}
      <div className="space-y-3">
        {errorMsg && (
          <div className="flex items-start justify-between p-4 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-xl text-xs font-semibold animate-in fade-in duration-200">
            <div className="flex items-center gap-2">
              <AlertTriangle size={14} className="text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button onClick={() => setErrorMsg(null)} className="text-rose-450 hover:text-rose-300 transition-colors">Close</button>
          </div>
        )}
        {successMsg && (
          <div className="flex items-start justify-between p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded-xl text-xs font-semibold animate-in fade-in duration-200">
            <div className="flex items-center gap-2">
              <ShieldCheck size={14} className="text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
            <button onClick={() => setSuccessMsg(null)} className="text-emerald-450 hover:text-emerald-300 transition-colors">Close</button>
          </div>
        )}
      </div>

      {/* Filter / Actions Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-stretch md:items-center gap-3 flex-1 max-w-2xl">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
            <input
              type="text"
              placeholder="Search by username, email, displayName..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 pl-9 pr-4 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-all font-semibold"
            />
          </div>

          {/* Role Filter */}
          <select
            value={role}
            onChange={(e) => {
              setRole(e.target.value);
              setPage(1);
            }}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-350 focus:outline-none focus:border-indigo-500 font-semibold"
          >
            <option value="">All Roles</option>
            {rolesCatalog.map(r => (
              <option key={r.id} value={r.name}>{r.name}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-350 focus:outline-none focus:border-indigo-500 font-semibold"
          >
            <option value="">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Disabled">Disabled</option>
            <option value="Locked">Locked</option>
          </select>
        </div>

        <button
          onClick={fetchUsers}
          disabled={loading}
          className="flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-850 hover:bg-slate-800 border border-slate-700/60 rounded-lg text-xs font-bold text-slate-300 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Grid/Table Area */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950/40 text-slate-450 border-b border-slate-850 font-bold">
                <th className="p-4 uppercase tracking-wider text-[10px]">User Profile</th>
                <th className="p-4 uppercase tracking-wider text-[10px]">Security / Verify</th>
                <th className="p-4 uppercase tracking-wider text-[10px]">Roles</th>
                <th className="p-4 uppercase tracking-wider text-[10px]">Status</th>
                <th className="p-4 uppercase tracking-wider text-[10px] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850">
              {loading && users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500 font-semibold">
                    <RefreshCw size={16} className="animate-spin mx-auto mb-2 text-indigo-500" />
                    Querying account databases...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500 font-semibold">
                    No accounts found matching current query parameters.
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const isSuspended = u.status === 2;
                  const isLocked = u.status === 3;
                  return (
                    <tr key={u.id} className="hover:bg-slate-850/10 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-slate-200">{u.displayName || 'No Display Name'}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5 font-semibold font-mono">{u.email}</div>
                      </td>
                      <td className="p-4 space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className={`h-1.5 w-1.5 rounded-full ${u.emailVerified ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                          <span className="text-[10px] text-slate-400 font-semibold">
                            {u.emailVerified ? 'Email Verified' : 'Pending Verification'}
                          </span>
                        </div>
                        {u.lastLoginAt && (
                          <div className="text-[9px] text-slate-600 font-semibold font-mono">
                            Last Active: {new Date(u.lastLoginAt).toLocaleDateString()}
                          </div>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1">
                          {u.roles.length === 0 ? (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-950 text-slate-600 border border-slate-850">
                              Guest
                            </span>
                          ) : (
                            u.roles.map(r => (
                              <span key={r} className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-550/10 text-indigo-400 border border-indigo-500/10">
                                {r}
                              </span>
                            ))
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                          u.status === 1 
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                            : isSuspended 
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' 
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }`}>
                          {u.status === 1 ? 'Active' : isSuspended ? 'Disabled' : 'Locked'}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openDetail(u.id)}
                            title="View Detail"
                            className="p-1.5 bg-slate-850 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition-colors"
                          >
                            <Eye size={12} />
                          </button>
                          <button
                            onClick={() => openRoleEdit(u.id)}
                            title="Edit Roles"
                            className="p-1.5 bg-slate-850 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition-colors"
                          >
                            <Settings size={12} />
                          </button>
                          
                          {/* Lock / Unlock status toggle */}
                          {isLocked ? (
                            <button
                              onClick={() => handleUnlockUser(u.id)}
                              disabled={actionLoading === u.id}
                              title="Unlock User"
                              className="p-1.5 bg-slate-850 hover:bg-emerald-500/10 hover:text-emerald-400 rounded-lg text-amber-500 transition-colors"
                            >
                              <Unlock size={12} />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleLockUser(u.id)}
                              disabled={actionLoading === u.id}
                              title="Lock User"
                              className="p-1.5 bg-slate-850 hover:bg-amber-500/10 hover:text-amber-500 rounded-lg text-slate-500 transition-colors"
                            >
                              <Lock size={12} />
                            </button>
                          )}

                          {/* Suspend / Activate toggle */}
                          <button
                            onClick={() => handleToggleStatus(u.id, u.status)}
                            disabled={actionLoading === u.id || isLocked}
                            title={isSuspended ? 'Activate User' : 'Suspend User'}
                            className={`p-1.5 rounded-lg transition-colors ${
                              isSuspended 
                                ? 'bg-slate-850 hover:bg-emerald-500/10 text-slate-500 hover:text-emerald-400' 
                                : 'bg-slate-850 hover:bg-rose-500/10 text-rose-400 hover:text-rose-300'
                            }`}
                          >
                            {isSuspended ? <UserCheck2 size={12} /> : <UserX size={12} />}
                          </button>

                          {/* Reset Password */}
                          <button
                            onClick={() => {
                              setPasswordTargetUserId(u.id);
                              setIsPasswordResetOpen(true);
                            }}
                            title="Reset Password"
                            className="p-1.5 bg-slate-850 hover:bg-slate-800 rounded-lg text-slate-450 hover:text-slate-200 transition-colors"
                          >
                            <Key size={12} />
                          </button>

                          {/* Revoke Sessions */}
                          <button
                            onClick={() => handleRevokeSessions(u.id)}
                            disabled={actionLoading === u.id}
                            title="Revoke Sessions"
                            className="p-1.5 bg-slate-850 hover:bg-rose-500/10 text-slate-500 hover:text-rose-450 rounded-lg transition-colors"
                          >
                            <Activity size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Panel */}
        {totalPages > 1 && (
          <div className="p-4 bg-slate-950/20 border-t border-slate-850 flex items-center justify-between">
            <span className="text-[10px] text-slate-500 font-semibold font-mono">
              Total {totalItems} items · Page {page} of {totalPages}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 bg-slate-850 hover:bg-slate-850 hover:text-slate-100 rounded text-slate-450 disabled:opacity-30 disabled:pointer-events-none transition-colors"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 bg-slate-850 hover:bg-slate-850 hover:text-slate-100 rounded text-slate-450 disabled:opacity-30 disabled:pointer-events-none transition-colors"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* User Detail Dialog */}
      {isDetailOpen && selectedUserId && (
        <UserDetailDialog 
          userId={selectedUserId} 
          onClose={() => {
            setIsDetailOpen(false);
            setSelectedUserId(null);
          }} 
        />
      )}

      {/* User Role Dialog */}
      {isRoleOpen && selectedUserId && (
        <UserRoleDialog 
          userId={selectedUserId}
          rolesCatalog={rolesCatalog}
          onClose={() => {
            setIsRoleOpen(false);
            setSelectedUserId(null);
            fetchUsers();
          }}
        />
      )}

      {/* Password Reset Modal */}
      {isPasswordResetOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity" 
            onClick={() => setIsPasswordResetOpen(false)}
          />
          <div className="relative bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl z-10 animate-in zoom-in-95 duration-250 text-slate-200">
            <h3 className="text-sm font-extrabold tracking-tight flex items-center gap-2 pb-3 border-b border-slate-850">
              <Key size={16} className="text-indigo-400" />
              Reset Account Password
            </h3>
            
            <form onSubmit={handleResetPasswordSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="Enter new strong password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-slate-955 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-semibold"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-850">
                <button
                  type="button"
                  onClick={() => setIsPasswordResetOpen(false)}
                  className="px-3 py-1.5 hover:bg-slate-800 rounded-lg text-xs font-semibold text-slate-400 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading !== null}
                  className="px-3 py-1.5 bg-indigo-750 hover:bg-indigo-850 text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
                >
                  Save New Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
export default UserManagement;
