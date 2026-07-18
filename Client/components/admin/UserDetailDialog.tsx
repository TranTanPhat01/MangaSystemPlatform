'use client';

import React, { useState, useEffect } from 'react';
import { X, User, Mail, Shield, ShieldCheck, Clock, ListFilter, AlertCircle } from 'lucide-react';
import { adminApi, AdminUserDetail } from '@/services/admin-api';

interface UserDetailDialogProps {
  userId: string;
  onClose: () => void;
}

export default function UserDetailDialog({ userId, onClose }: UserDetailDialogProps) {
  const [detail, setDetail] = useState<AdminUserDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await adminApi.getUserDetail(userId);
        if (res.data.success) {
          setDetail(res.data.data);
        } else {
          setError(res.data.message || 'Failed to load user profile detail.');
        }
      } catch (err: any) {
        setError(err.response?.data?.message || err.response?.data?.error || 'Could not load user detail from gateway.');
      } finally {
        setLoading(false);
      }
    };
    
    if (userId) {
      fetchDetail();
    }
  }, [userId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity" 
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl z-10 animate-in zoom-in-95 duration-200 text-slate-200 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-850 flex items-center justify-between shrink-0">
          <h3 className="text-sm font-extrabold tracking-tight flex items-center gap-2">
            <User size={16} className="text-indigo-400" />
            Account Detail Profile
          </h3>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {loading ? (
            <div className="py-12 text-center text-slate-500 font-semibold text-xs">
              <div className="h-6 w-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              Loading profile details...
            </div>
          ) : error ? (
            <div className="flex items-start gap-2.5 p-4 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-xl text-xs font-semibold">
              <AlertCircle size={14} className="text-rose-455 shrink-0" />
              <span>{error}</span>
            </div>
          ) : detail ? (
            <div className="space-y-6">
              {/* Profile Card Summary */}
              <div className="flex items-center gap-4 bg-slate-950/40 p-4 border border-slate-850 rounded-xl">
                <div className="h-12 w-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center shadow-inner">
                  <User size={22} className="text-slate-400" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-100">{detail.displayName || 'No Name'}</h4>
                  <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Username: {detail.username || 'N/A'}</p>
                  <p className="text-[10px] text-slate-500 font-semibold mt-0.5 flex items-center gap-1 font-mono">
                    <Mail size={10} />
                    {detail.email}
                  </p>
                </div>
              </div>

              {/* Status and Metadata Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-950/20 border border-slate-850 p-3 rounded-lg space-y-1">
                  <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Account status</div>
                  <div className="text-xs font-bold text-slate-300">
                    {detail.status === 1 ? 'Active' : detail.status === 2 ? 'Disabled' : 'Locked'}
                  </div>
                </div>

                <div className="bg-slate-950/20 border border-slate-850 p-3 rounded-lg space-y-1">
                  <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Registered At</div>
                  <div className="text-xs font-bold text-slate-300 font-mono">
                    {new Date(detail.createdAt).toLocaleDateString()}
                  </div>
                </div>

                <div className="bg-slate-950/20 border border-slate-850 p-3 rounded-lg space-y-1">
                  <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Email Verification</div>
                  <div className="text-xs font-bold text-slate-300 flex items-center gap-1">
                    {detail.emailVerified ? (
                      <>
                        <ShieldCheck size={12} className="text-emerald-400" />
                        Verified
                      </>
                    ) : (
                      <>
                        <X size={12} className="text-amber-500" />
                        Unverified
                      </>
                    )}
                  </div>
                </div>

                <div className="bg-slate-950/20 border border-slate-850 p-3 rounded-lg space-y-1">
                  <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Lockout Expiry</div>
                  <div className="text-xs font-bold text-slate-300 font-mono">
                    {detail.lockoutUntil ? new Date(detail.lockoutUntil).toLocaleString() : 'Not locked'}
                  </div>
                </div>
              </div>

              {/* Roles Summary */}
              <div className="space-y-2">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Shield size={12} className="text-indigo-400" />
                  Assigned Roles
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {detail.roles.length === 0 ? (
                    <span className="text-xs text-slate-550 italic font-semibold">No roles assigned.</span>
                  ) : (
                    detail.roles.map(r => (
                      <span key={r} className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/10">
                        {r}
                      </span>
                    ))
                  )}
                </div>
              </div>

              {/* Permissions Audit */}
              <div className="space-y-2">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <ListFilter size={12} className="text-indigo-400" />
                  Security Permissions ({detail.permissions.length})
                </div>
                {detail.permissions.length === 0 ? (
                  <p className="text-xs text-slate-550 italic font-semibold bg-slate-950/25 p-3 rounded-lg border border-slate-850">
                    No active permissions granted. Inherits default guests claims.
                  </p>
                ) : (
                  <div className="max-h-28 overflow-y-auto bg-slate-950/25 border border-slate-850 p-3 rounded-lg grid grid-cols-2 gap-1.5 font-mono text-[9px] text-slate-400">
                    {detail.permissions.map(p => (
                      <div key={p} className="flex items-center gap-1 truncate" title={p}>
                        <span className="text-emerald-500 font-bold">•</span>
                        {p}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Security Audit Events log */}
              <div className="space-y-2">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock size={12} className="text-indigo-400" />
                  Recent Security Events
                </div>
                {detail.recentSecurityEvents.length === 0 ? (
                  <p className="text-xs text-slate-550 italic font-semibold bg-slate-950/25 p-3 rounded-lg border border-slate-850">
                    No recent login or profile security events logged.
                  </p>
                ) : (
                  <div className="max-h-28 overflow-y-auto bg-slate-950/25 border border-slate-850 rounded-lg divide-y divide-slate-850">
                    {detail.recentSecurityEvents.map((evt, idx) => (
                      <div key={idx} className="p-2.5 flex justify-between items-center text-[10px] hover:bg-slate-850/10 transition-colors">
                        <span className="font-bold text-slate-300">{evt.action}</span>
                        <span className="font-mono text-slate-550">{new Date(evt.createdAt).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-slate-500">No profile details parsed.</div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950/25 border-t border-slate-850 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold text-xs rounded-xl border border-slate-700/60 transition-colors"
          >
            Close Panel
          </button>
        </div>
      </div>
    </div>
  );
}
