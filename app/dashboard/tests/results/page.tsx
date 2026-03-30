'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

interface StudentStatus {
  studentId: string;
  name: string;
  registrationNo: string;
  status: 'not_started' | 'attempting' | 'disconnected' | 'needs_resume' | 'completed';
  attemptId: string | null;
  totalMarks: number | null;
  needsResume: boolean;
  canResume: boolean;
}

interface MonitorData {
  counts: { total: number; notStarted: number; attempting: number; disconnected: number; completed: number };
  students: StudentStatus[];
}

interface Test {
  id: string; name: string; duration: number; totalMarks: number;
  isLive: boolean; isDraft: boolean; startTime?: string; endTime?: string;
  sections: { questions: unknown[] }[];
  attempts: { isCompleted: boolean }[];
  testClasses: { classId: string }[];
}

const statusColor: Record<string, string> = {
  not_started: 'bg-gray-100 text-gray-600',
  attempting: 'bg-blue-100 text-blue-700',
  disconnected: 'bg-orange-100 text-orange-700',
  needs_resume: 'bg-red-100 text-red-700',
  completed: 'bg-green-100 text-green-700',
};
const statusLabel: Record<string, string> = {
  not_started: 'Not Started',
  attempting: 'Attempting',
  disconnected: 'Disconnected',
  needs_resume: 'Needs Resume',
  completed: 'Completed',
};

function StudentStatusModal({ test, onClose }: { test: Test; onClose: () => void }) {
  const router = useRouter();
  const [data, setData] = useState<MonitorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [resuming, setResuming] = useState<string | null>(null);

  const fetchMonitor = useCallback(async () => {
    try {
      const res = await axios.get(`/api/tests/${test.id}/monitor`);
      setData(res.data);
    } catch {} finally {
      setLoading(false);
    }
  }, [test.id]);

  useEffect(() => {
    fetchMonitor();
    const interval = setInterval(fetchMonitor, 15000); // refresh every 15s
    return () => clearInterval(interval);
  }, [fetchMonitor]);

  const giveResume = async (attemptId: string) => {
    setResuming(attemptId);
    try {
      await axios.post('/api/attempts/allow-resume', { attemptId });
      fetchMonitor();
    } finally {
      setResuming(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="font-bold text-gray-800">Student Status</h2>
            <p className="text-xs text-gray-500 mt-0.5">{test.name} · auto-refreshes every 15s</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : data ? (
          <>
            {/* Count pills */}
            <div className="flex flex-wrap gap-2 px-6 py-3 border-b border-gray-100">
              {[
                { label: 'Total', value: data.counts.total, cls: 'bg-gray-100 text-gray-700' },
                { label: 'Not Started', value: data.counts.notStarted, cls: 'bg-gray-100 text-gray-600' },
                { label: 'Attempting', value: data.counts.attempting, cls: 'bg-blue-100 text-blue-700' },
                { label: 'Disconnected', value: data.counts.disconnected, cls: 'bg-orange-100 text-orange-700' },
                { label: 'Completed', value: data.counts.completed, cls: 'bg-green-100 text-green-700' },
              ].map((c) => (
                <span key={c.label} className={`${c.cls} text-xs font-semibold px-3 py-1 rounded-full`}>
                  {c.label}: {c.value}
                </span>
              ))}
            </div>

            {/* Student table */}
            <div className="overflow-y-auto flex-1">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100 sticky top-0">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Reg. No</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Marks</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {data.students.map((s) => (
                    <tr key={s.studentId} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-800">{s.name}</td>
                      <td className="px-4 py-3 font-mono text-gray-500 text-xs">{s.registrationNo}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[s.status]}`}>
                          {statusLabel[s.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {s.totalMarks !== null ? `${s.totalMarks}/${test.totalMarks}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center gap-2 justify-end">
                          {(s.status === 'disconnected' || s.status === 'needs_resume') && s.attemptId && (
                            <button
                              onClick={() => giveResume(s.attemptId!)}
                              disabled={resuming === s.attemptId}
                              className="text-xs bg-emerald-600 text-white px-3 py-1 rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition"
                            >
                              {resuming === s.attemptId ? 'Granting...' : 'Give Resume'}
                            </button>
                          )}
                          {s.status === 'completed' && s.attemptId && (
                            <a
                              href={`/analyse/${s.attemptId}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 transition"
                            >
                              Analyse
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <p className="text-center py-8 text-gray-500">Failed to load data</p>
        )}
      </div>
    </div>
  );
}

export default function ResultsPage() {
  const router = useRouter();
  const [tests, setTests] = useState<Test[]>([]);
  const [monitorTarget, setMonitorTarget] = useState<Test | null>(null);

  const fetchTests = useCallback(async () => {
    try {
      const res = await axios.get('/api/tests');
      const now = new Date();
      // Show tests that are live OR whose endTime has passed (started at some point)
      setTests(res.data.filter((t: Test) =>
        !t.isDraft && (t.isLive || (t.endTime && new Date(t.endTime) <= now))
      ));
    } catch {}
  }, []);

  useEffect(() => {
    fetchTests();
    const interval = setInterval(fetchTests, 30000);
    return () => clearInterval(interval);
  }, [fetchTests]);

  const now = new Date();
  const fmtTime = (iso?: string) => iso ? new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold text-gray-800">Results & Monitoring</h1>
        <button onClick={() => router.push('/dashboard/tests/create')}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition">
          + Create Test
        </button>
      </div>
      <p className="text-sm text-gray-500 mb-6">Live and completed tests — monitor students in real time.</p>

      {tests.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-5xl mb-3">📊</p>
          <p className="font-medium text-gray-500">No active or completed tests yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {tests.map((test) => {
            const questions = test.sections.reduce((t, s) => t + s.questions.length, 0);
            const completed = test.attempts.filter((a) => a.isCompleted).length;
            const isExpired = test.endTime && new Date(test.endTime) <= now;

            return (
              <div key={test.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition">
                <div className={`h-1.5 w-full ${isExpired ? 'bg-gray-300' : 'bg-green-500'}`} />
                <div className="p-5">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-semibold text-gray-800 truncate">{test.name}</h3>
                    {!isExpired && test.isLive && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse inline-block" />Live
                      </span>
                    )}
                    {isExpired && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Ended</span>}
                  </div>

                  <div className="flex flex-wrap gap-3 text-xs text-gray-500 mb-2">
                    <span>⏱ {Math.floor(test.duration / 60)}h {test.duration % 60}m</span>
                    <span>📊 {test.totalMarks} marks</span>
                    <span>❓ {questions} questions</span>
                    <span className="text-green-700 font-medium">✓ {completed} submitted</span>
                  </div>

                  {(test.startTime || test.endTime) && (
                    <div className="text-xs text-gray-400 mb-3">
                      🕐 {fmtTime(test.startTime)} → {fmtTime(test.endTime)}
                    </div>
                  )}

                  <button
                    onClick={() => setMonitorTarget(test)}
                    className="w-full py-2 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 text-sm font-medium hover:bg-indigo-100 transition"
                  >
                    👥 Student Status
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {monitorTarget && (
        <StudentStatusModal test={monitorTarget} onClose={() => setMonitorTarget(null)} />
      )}
    </div>
  );
}
