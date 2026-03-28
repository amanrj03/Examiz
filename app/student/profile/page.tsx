'use client';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';

export default function StudentProfilePage() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const [gender, setGender] = useState((user as any)?.gender || '');
  const [picPreview, setPicPreview] = useState<string | null>((user as any)?.profilePic || null);
  const [picFile, setPicFile] = useState<File | null>(null);
  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' });
  const [saving, setSaving] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [pwMsg, setPwMsg] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  if (!user || user.role !== 'student') return null;
  const student = user;

  const handlePicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPicFile(file);
    setPicPreview(URL.createObjectURL(file));
  };

  const saveProfile = async () => {
    setSaving(true);
    setMsg('');
    try {
      const fd = new FormData();
      if (gender) fd.append('gender', gender);
      if (picFile) fd.append('profilePic', picFile);
      await axios.patch('/api/student/profile', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      await refreshUser();
      setMsg('Profile updated successfully');
      setPicFile(null);
    } catch {
      setMsg('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwForm.newPw !== pwForm.confirm) { setPwMsg('Passwords do not match'); return; }
    if (pwForm.newPw.length < 6) { setPwMsg('Password must be at least 6 characters'); return; }
    setPwSaving(true);
    setPwMsg('');
    try {
      await axios.patch('/api/student/profile', { currentPassword: pwForm.current, newPassword: pwForm.newPw });
      setPwForm({ current: '', newPw: '', confirm: '' });
      setPwMsg('Password changed successfully');
    } catch (err: unknown) {
      setPwMsg(axios.isAxiosError(err) ? err.response?.data?.error : 'Failed to change password');
    } finally {
      setPwSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navbar */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <button onClick={() => router.push('/student')} className="flex items-center gap-2 text-gray-600 hover:text-gray-800 text-sm">
            ← Back to Dashboard
          </button>
          <img src="/examizLogo.png" alt="Examiz" className="h-10" />
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        {/* Profile Info */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-6">Profile</h2>

          <div className="flex items-center gap-6 mb-6">
            <div className="relative">
              {picPreview ? (
                <img src={picPreview} alt="Profile" className="w-20 h-20 rounded-full object-cover border-2 border-gray-200" />
              ) : (
                <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-2xl border-2 border-gray-200">
                  {student.name.charAt(0).toUpperCase()}
                </div>
              )}
              <button
                onClick={() => fileRef.current?.click()}
                className="absolute bottom-0 right-0 bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-blue-700"
                title="Change photo"
              >
                ✎
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePicChange} />
            </div>
            <div>
              <p className="font-semibold text-gray-800 text-lg">{student.name}</p>
              <p className="text-sm text-gray-500">{student.class.name}</p>
            </div>
          </div>

          {/* Read-only fields */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            {[
              { label: 'Username', value: student.username },
              { label: 'Registration No', value: student.registrationNo },
              { label: 'Name', value: student.name },
              { label: 'Phone', value: student.phone || '—' },
            ].map((f) => (
              <div key={f.label}>
                <label className="block text-xs font-medium text-gray-500 mb-1">{f.label}</label>
                <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700">{f.value}</div>
              </div>
            ))}
          </div>

          {/* Editable: gender */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-700 mb-1">Gender</label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 w-48"
            >
              <option value="">Prefer not to say</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>

          {msg && <p className={`text-sm mb-3 ${msg.includes('success') ? 'text-green-600' : 'text-red-500'}`}>{msg}</p>}

          <button onClick={saveProfile} disabled={saving} className="bg-green-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        {/* Change Password */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Change Password</h2>
          <form onSubmit={changePassword} className="space-y-3 max-w-sm">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Current Password</label>
              <input type="password" required value={pwForm.current} onChange={(e) => setPwForm({ ...pwForm, current: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">New Password</label>
              <input type="password" required minLength={6} value={pwForm.newPw} onChange={(e) => setPwForm({ ...pwForm, newPw: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Confirm New Password</label>
              <input type="password" required value={pwForm.confirm} onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            {pwMsg && <p className={`text-sm ${pwMsg.includes('success') ? 'text-green-600' : 'text-red-500'}`}>{pwMsg}</p>}
            <button type="submit" disabled={pwSaving} className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition">
              {pwSaving ? 'Changing...' : 'Change Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
