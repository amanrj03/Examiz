'use client';
import { useState } from 'react';
import axios from 'axios';
import Link from 'next/link';
import EyeIcon from '../../../components/EyeIcon';

export default function OrgLoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await axios.post('/api/auth/org?action=login', form);
      window.location.href = '/dashboard';
    } catch (err: unknown) {
      setError(axios.isAxiosError(err) ? err.response?.data?.error || 'Login failed' : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-8 shadow-[0_8px_30px_rgb(0,0,0,0.06)]">
      <div className="mb-6 flex justify-center md:hidden">
        <img src="/examizLogo.png" alt="Examiz" className="h-10" />
      </div>

      <h2 className="mb-1 text-2xl font-bold text-gray-900">Welcome back!</h2>
      <p className="mb-6 text-sm text-gray-500">Sign in to your organization account</p>

      <div className="mb-6 flex rounded-lg bg-gray-50 p-1">
        <span className="flex-1 rounded-md bg-white py-2 text-center text-sm font-semibold text-gray-800 shadow-sm">Organization</span>
        <Link href="/login/student" className="flex-1 py-2 text-center text-sm font-semibold text-gray-500 transition-all hover:text-gray-700">Student</Link>
      </div>

      <form className="space-y-5" onSubmit={submit}>
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-gray-700">Email</label>
          <input
            type="email" required value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="you@college.com"
            className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm outline-none transition-all focus:border-[#034b3c] focus:ring-1 focus:ring-[#034b3c]"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-gray-700">Password</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'} required value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••"
              className="w-full rounded-md border border-gray-300 px-3 py-2.5 pr-10 text-sm outline-none transition-all focus:border-[#034b3c] focus:ring-1 focus:ring-[#034b3c]"
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <EyeIcon open={showPassword} />
            </button>
          </div>
        </div>
        <Link href="/forgot-password" className="block text-xs font-medium text-gray-600 hover:text-gray-900">Forgot password?</Link>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button type="submit" disabled={loading}
          className="w-full rounded-md bg-[#034b3c] py-3 text-sm font-semibold text-white transition-colors hover:bg-[#023d30] disabled:opacity-50">
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-600">
        New organization?{' '}
        <Link href="/register" className="font-medium text-[#034b3c] hover:underline">Register here</Link>
      </p>
    </div>
  );
}
