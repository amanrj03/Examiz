'use client';
import { useState } from 'react';
import axios from 'axios';
import Link from 'next/link';
import EyeIcon from '../../../components/EyeIcon';

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirm) { setError('Passwords do not match'); return; }
    setError('');
    setLoading(true);
    try {
      await axios.post('/api/auth/org?action=register', {
        name: form.name, email: form.email, password: form.password,
      });
      window.location.href = '/dashboard';
    } catch (err: unknown) {
      setError(axios.isAxiosError(err) ? err.response?.data?.error || 'Registration failed' : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-8 shadow-[0_8px_30px_rgb(0,0,0,0.06)]">
      <div className="mb-6 flex justify-center md:hidden">
        <img src="/examizLogo.png" alt="Examiz" className="h-10" />
      </div>

      <h2 className="mb-1 text-2xl font-bold text-gray-900">Create account</h2>
      <p className="mb-6 text-sm text-gray-500">Register your college, institute or teaching account</p>

      <form className="space-y-5" onSubmit={submit}>
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-gray-700">Organization Name</label>
          <input
            type="text" required value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="ABC Coaching Institute"
            className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm outline-none transition-all focus:border-[#034b3c] focus:ring-1 focus:ring-[#034b3c]"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-gray-700">Email</label>
          <input
            type="email" required value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="admin@college.com"
            className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm outline-none transition-all focus:border-[#034b3c] focus:ring-1 focus:ring-[#034b3c]"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-gray-700">Password</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'} required minLength={6} value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••"
              className="w-full rounded-md border border-gray-300 px-3 py-2.5 pr-10 text-sm outline-none transition-all focus:border-[#034b3c] focus:ring-1 focus:ring-[#034b3c]"
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <EyeIcon open={showPassword} />
            </button>
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-gray-700">Confirm Password</label>
          <input
            type="password" required value={form.confirm}
            onChange={(e) => setForm({ ...form, confirm: e.target.value })}
            placeholder="••••••••"
            className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm outline-none transition-all focus:border-[#034b3c] focus:ring-1 focus:ring-[#034b3c]"
          />
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button type="submit" disabled={loading}
          className="w-full rounded-md bg-[#034b3c] py-3 text-sm font-semibold text-white transition-colors hover:bg-[#023d30] disabled:opacity-50">
          {loading ? 'Creating account...' : 'Create Account'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-600">
        Already registered?{' '}
        <Link href="/login" className="font-medium text-[#034b3c] hover:underline">Sign in</Link>
      </p>
    </div>
  );
}
