import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { authApi } from '@/services/auth-api';
import { UserProfile } from '@/types/auth';

export default function MangakaSettingsTab() {
  const storedUser = useAuthStore((state) => state.user);
  const [user, setUser] = useState<UserProfile | null>(storedUser);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await authApi.getMe();
        if (response.data.success) setUser(response.data.data);
      } finally {
        setLoading(false);
      }
    };
    void loadProfile();
  }, []);
  return (
    <div className="space-y-6 animate-in fade-in duration-350">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Studio Profile & Integration Settings</h1>
        <p className="text-sm text-slate-500 font-semibold mt-1">Account information loaded from the Identity API.</p>
      </div>

      <div className="bg-white border border-slate-150 rounded-xl p-6 shadow-sm max-w-2xl">
        <h3 className="font-bold text-slate-800 text-sm mb-4 pb-1 border-b border-slate-100">Current Account</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-655 mb-1">Full name</label>
            <input type="text" value={loading ? 'Loading…' : user?.fullName || '—'} readOnly className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-700 focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-655 mb-1">Email</label>
            <input type="email" value={loading ? 'Loading…' : user?.email || '—'} readOnly className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-750 focus:outline-none font-mono" />
          </div>
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <div>
              <h4 className="text-xs font-bold text-slate-755">Roles</h4>
              <p className="text-[10px] text-slate-450 mt-0.5">Roles are managed by the Identity service.</p>
              <p className="text-xs font-bold text-slate-700 mt-1">{user?.roles?.join(', ') || '—'}</p>
            </div>
          </div>
          <p className="text-[10px] text-slate-500 font-medium pt-2">Profile values are read-only in this workspace.</p>
        </div>
      </div>
    </div>
  );
}
