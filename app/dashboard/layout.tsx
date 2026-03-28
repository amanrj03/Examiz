'use client';
import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

const testSubItems = [
  { href: '/dashboard/tests/create',   label: 'Create Test' },
  { href: '/dashboard/tests/all',      label: 'All Tests' },
  { href: '/dashboard/tests/drafts',   label: 'Drafts' },
  { href: '/dashboard/tests/live',     label: 'Live Tests' },
  { href: '/dashboard/tests/results',  label: 'Results' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [testsOpen, setTestsOpen] = useState(pathname.startsWith('/dashboard/tests'));

  useEffect(() => {
    if (pathname.startsWith('/dashboard/tests')) setTestsOpen(true);
  }, [pathname]);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'org')) router.push('/login');
  }, [user, loading, router]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
    </div>
  );
  if (!user || user.role !== 'org') return null;

  const isActive = (href: string) => pathname === href || (href !== '/dashboard' && pathname.startsWith(href.split('?')[0]));

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col fixed h-full z-10">
        {/* Logo + org info */}
        <div className="p-5 border-b border-gray-100">
          <img src="/examizLogo.png" alt="Examiz" className="h-8 mb-3" />
          <p className="font-semibold text-gray-800 text-sm truncate">{user.name}</p>
          <p className="text-xs text-gray-400 truncate">{user.email}</p>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
          {/* Overview */}
          <Link
            href="/dashboard"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
              pathname === '/dashboard' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <span className="text-base">📊</span> Overview
          </Link>

          {/* Classes */}
          <Link
            href="/dashboard/classes"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
              pathname.startsWith('/dashboard/classes') ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <span className="text-base">🏫</span> Classes
          </Link>

          {/* Tests — collapsible */}
          <div>
            <button
              onClick={() => setTestsOpen(!testsOpen)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                pathname.startsWith('/dashboard/tests') ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span className="flex items-center gap-3">
                <span className="text-base">📝</span> Tests
              </span>
              <svg
                className={`w-4 h-4 transition-transform ${testsOpen ? 'rotate-180' : ''}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {testsOpen && (
              <div className="mt-0.5 ml-4 pl-3 border-l border-gray-200 space-y-0.5">
                {testSubItems.map((item) => {
                  const isSubActive = pathname === item.href || pathname.startsWith(item.href + '/');
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`block px-3 py-2 rounded-lg text-sm transition ${
                        isSubActive ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </nav>

        {/* Sign out */}
        <div className="p-3 border-t border-gray-100">
          <button
            onClick={async () => { await logout(); router.push('/login'); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-500 hover:bg-red-50 rounded-lg transition font-medium"
          >
            <span className="text-base">🚪</span> Sign out
          </button>
        </div>
      </aside>

      {/* Main — offset for fixed sidebar */}
      <main className="flex-1 ml-64 overflow-auto min-h-screen">{children}</main>
    </div>
  );
}
