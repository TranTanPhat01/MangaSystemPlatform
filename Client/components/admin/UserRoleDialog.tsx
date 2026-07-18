'use client';

import React, { useState, useEffect } from 'react';
import { X, Shield, RefreshCw, AlertTriangle, CheckSquare, Square } from 'lucide-react';
import { adminApi, AdminRoleCatalog } from '@/services/admin-api';

interface UserRoleDialogProps {
  userId: string;
  rolesCatalog: AdminRoleCatalog[];
  onClose: () => void;
}

export default function UserRoleDialog({ userId, rolesCatalog, onClose }: UserRoleDialogProps) {
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState('');

  useEffect(() => {
    const fetchUserRoles = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await adminApi.getUserDetail(userId);
        if (res.data.success) {
          setSelectedRoles(res.data.data.roles);
          setDisplayName(res.data.data.displayName);
        } else {
          setError(res.data.message || 'Failed to fetch user roles.');
        }
      } catch (err: any) {
        setError(err.response?.data?.message || err.response?.data?.error || 'Could not fetch user details.');
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchUserRoles();
    }
  }, [userId]);

  const handleToggleRole = (roleName: string) => {
    setSelectedRoles(prev => 
      prev.includes(roleName) 
        ? prev.filter(r => r !== roleName) 
        : [...prev, roleName]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await adminApi.updateUserRoles(userId, { roles: selectedRoles });
      if (res.data.success) {
        onClose();
      } else {
        setError(res.data.message || 'Failed to update user roles.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Failed to save updated roles.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity" 
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl z-10 animate-in zoom-in-95 duration-200 text-slate-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-850 flex items-center justify-between shrink-0">
          <h3 className="text-sm font-extrabold tracking-tight flex items-center gap-2">
            <Shield size={16} className="text-indigo-400" />
            Manage Roles: {displayName || '...'}
          </h3>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4">
          {loading ? (
            <div className="py-8 text-center text-slate-500 font-semibold text-xs">
              <RefreshCw className="animate-spin h-6 w-6 text-indigo-500 mx-auto mb-2" />
              Loading current roles...
            </div>
          ) : error ? (
            <div className="flex items-start gap-2.5 p-4 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-xl text-xs font-semibold">
              <AlertTriangle size={14} className="text-rose-455 shrink-0" />
              <span>{error}</span>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Select Roles to Assign</p>
              
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {rolesCatalog.map((role) => {
                  const isChecked = selectedRoles.includes(role.name);
                  return (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => handleToggleRole(role.name)}
                      className={`w-full flex items-start gap-3 p-3 rounded-xl border text-left transition-all ${
                        isChecked 
                          ? 'bg-indigo-600/10 border-indigo-500/30 hover:bg-indigo-600/20' 
                          : 'bg-slate-950/40 border-slate-850 hover:bg-slate-950/70 hover:border-slate-800'
                      }`}
                    >
                      <div className={`mt-0.5 shrink-0 ${isChecked ? 'text-indigo-400' : 'text-slate-600'}`}>
                        {isChecked ? <CheckSquare size={16} /> : <Square size={16} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-slate-200">{role.name}</div>
                        <div className="text-[10px] text-slate-500 font-semibold mt-0.5 leading-relaxed truncate">
                          {role.description || 'No description provided.'}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950/25 border-t border-slate-850 flex justify-end gap-2 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 hover:bg-slate-800 text-slate-400 font-semibold text-xs rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="px-4 py-2 bg-indigo-700 hover:bg-indigo-850 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-650/10 transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Roles'}
          </button>
        </div>
      </div>
    </div>
  );
}
