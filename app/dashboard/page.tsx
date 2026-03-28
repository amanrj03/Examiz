'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';
import Link from 'next/link';

export default function DashboardOverview() {
  const [stats, setStats] = useState({ classes: 0, students: 0, tests: 0, liveTests: 0 });

  useEffect(() => {
    Promise.all([
      axios.get('/api/org/classes'),
      axios.get('/api/tests'),
    ]).then(([classRes, testRes]) => {
      const classes = classRes.data;
      const tests = testRes.data;
      const students = classes.reduce((t: number, c: { _count: { students: number } }) => t + c._count.students, 0);
      setStats({
        classes: classes.length,
        students,
        tests: tests.length,
        liveTests: tests.filter((t: { isLive: boolean }) => t.isLive).length,
      });
    }).catch(console.error);
  }, []);

  const cards = [
    { label: 'Classes', value: stats.classes, color: 'bg-blue-50 text-blue-700', icon: '🏫', href: '/dashboard/classes' },
    { label: 'Students', value: stats.students, color: 'bg-purple-50 text-purple-700', icon: '👥', href: '/dashboard/classes' },
    { label: 'Total Tests', value: stats.tests, color: 'bg-orange-50 text-orange-700', icon: '📝', href: '/dashboard/tests' },
    { label: 'Live Tests', value: stats.liveTests, color: 'bg-green-50 text-green-700', icon: '🟢', href: '/dashboard/tests' },
  ];

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((c) => (
          <Link key={c.label} href={c.href} className={`${c.color} rounded-xl p-5 hover:opacity-90 transition`}>
            <div className="text-2xl mb-2">{c.icon}</div>
            <div className="text-3xl font-bold">{c.value}</div>
            <div className="text-sm font-medium mt-1">{c.label}</div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-800 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Link href="/dashboard/classes" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition text-sm">
              <span className="text-xl">🏫</span>
              <div>
                <p className="font-medium">Manage Classes</p>
                <p className="text-gray-500 text-xs">Create classes and import students</p>
              </div>
            </Link>
            <Link href="/dashboard/tests/create" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition text-sm">
              <span className="text-xl">➕</span>
              <div>
                <p className="font-medium">Create New Test</p>
                <p className="text-gray-500 text-xs">Build and publish a test</p>
              </div>
            </Link>
            <Link href="/dashboard/tests" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition text-sm">
              <span className="text-xl">📋</span>
              <div>
                <p className="font-medium">Manage Tests</p>
                <p className="text-gray-500 text-xs">Toggle live, assign to classes</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
