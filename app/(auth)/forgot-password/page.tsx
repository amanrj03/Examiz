'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Link from 'next/link';

type Step = 'email' | 'otp' | 'done';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  const startCooldown = () => {
    setResendCooldown(60);
    const t = setInterval(() => {
      setResendCooldown((c) => { if (c <= 1) { clearInterval(t); return 0; } return c - 1; });
    }, 1000);
  };

  const sendOtp = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError('');
    setLoading(true);
    try {
      await axios.post('/api/auth/org/send-otp', { email });
      setStep('otp');
      startCooldown();
    } catch (err: unknown) {
      setError(axios.isAxiosError(err) ? err.response?.data?.error : 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirm) { setError('Passwords do not match'); return; }
    if (newPassword.length < 6) { setError('Password must be at least 6 characters'); return; }
    setError('');
    setLoading(true);
    try {
      await axios.post('/api/auth/org/reset-password', { email, otp, newPassword });
      setStep('done');
    } catch (err: unknown) {
      setError(axios.isAxiosError(err) ? err.response?.data?.error : 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  const stepIndex = step === 'email' ? 0 : step === 'otp' ? 1 : 2;

  return (
    <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-8 shadow-[0_8px_30px_rgb(0,0,0,0.06)]">
      <div className="mb-6 flex justify-center md:hidden">
        <img src="/examizLogo.png" alt="Examiz" className="h-10" />
      </div>

      <h2 className="mb-1 text-2xl font-bold text-gray-900">Reset Password</h2>
      <p className="mb-6 text-sm text-gray-500">For organization accounts</p>

      <div className="mb-8 flex items-center justify-center gap-2">
        {['Email', 'OTP', 'Done'].map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${i <= stepIndex ? 'bg-[#034b3c] text-white' : 'bg-gray-200 text-gray-500'}`}>
              {i < stepIndex ? '✓' : i + 1}
            </div>
            <span className={`text-xs ${i <= stepIndex ? 'font-medium text-[#034b3c]' : 'text-gray-400'}`}>{label}</span>
            {i < 2 && <div className={`h-0.5 w-8 ${i < stepIndex ? 'bg-[#034b3c]' : 'bg-gray-200'}`} />}
          </div>
        ))}
      </div>

      {step === 'email' && (
        <form onSubmit={sendOtp} className="space-y-5">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-gray-700">Organization Email</label>
            <input
              type="email" required value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@college.com"
              className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm outline-none transition-all focus:border-[#034b3c] focus:ring-1 focus:ring-[#034b3c]"
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full rounded-md bg-[#034b3c] py-3 text-sm font-semibold text-white transition-colors hover:bg-[#023d30] disabled:opacity-50">
            {loading ? 'Sending OTP...' : 'Send OTP'}
          </button>
        </form>
      )}

      {step === 'otp' && (
        <form onSubmit={resetPassword} className="space-y-5">
          <div className="rounded-md border border-[#034b3c]/20 bg-[#034b3c]/5 p-3 text-sm text-[#034b3c]">
            OTP sent to <strong>{email}</strong>. Check your inbox.
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-gray-700">Enter OTP</label>
            <input
              type="text" required maxLength={6} value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-center text-2xl font-bold tracking-widest outline-none transition-all focus:border-[#034b3c] focus:ring-1 focus:ring-[#034b3c]"
              placeholder="000000"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-gray-700">New Password</label>
            <input
              type="password" required minLength={6} value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm outline-none transition-all focus:border-[#034b3c] focus:ring-1 focus:ring-[#034b3c]"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-gray-700">Confirm Password</label>
            <input
              type="password" required value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm outline-none transition-all focus:border-[#034b3c] focus:ring-1 focus:ring-[#034b3c]"
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full rounded-md bg-[#034b3c] py-3 text-sm font-semibold text-white transition-colors hover:bg-[#023d30] disabled:opacity-50">
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
          <button type="button" onClick={() => sendOtp()} disabled={resendCooldown > 0 || loading}
            className="w-full text-sm text-[#034b3c] hover:underline disabled:text-gray-400 disabled:no-underline">
            {resendCooldown > 0 ? `Resend OTP in ${resendCooldown}s` : 'Resend OTP'}
          </button>
        </form>
      )}

      {step === 'done' && (
        <div className="space-y-4 text-center">
          <div className="text-5xl">✅</div>
          <p className="font-semibold text-gray-800">Password reset successfully!</p>
          <button onClick={() => router.push('/login')}
            className="w-full rounded-md bg-[#034b3c] py-3 text-sm font-semibold text-white transition-colors hover:bg-[#023d30]">
            Back to Login
          </button>
        </div>
      )}

      {step !== 'done' && (
        <div className="mt-6 text-center">
          <Link href="/login" className="text-sm text-gray-500 hover:text-[#034b3c]">← Back to Login</Link>
        </div>
      )}
    </div>
  );
}
