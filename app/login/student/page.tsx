'use client';
import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import axios from 'axios';
import Link from 'next/link';

function StudentLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/student';
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await axios.post('/api/auth/student', form);
      window.location.href = redirect;
    } catch (err: unknown) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.error : 'Login failed';
      setError(msg || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/examizLogo.png" alt="Examiz" className="h-12 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800">Student Login</h1>
          <p className="text-gray-500 text-sm mt-1">Use credentials provided by your institution</p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username or Phone Number</label>
            <input
              type="text" required
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="reg123@examiz.com or 9876543210"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password" required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit" disabled={loading}
            className="w-full bg-green-600 text-white py-2.5 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 transition"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Organization?{' '}
            <Link href="/login" className="text-blue-600 hover:underline font-medium">Login here</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function StudentLoginPage() {
  return (
    <Suspense>
      <StudentLoginForm />
    </Suspense>
  );
}
