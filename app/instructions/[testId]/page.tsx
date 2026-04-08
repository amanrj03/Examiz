'use client';
import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { testAPI, attemptAPI } from '../../../services/api';
import Modal from '../../../components/Modal';
import axios from 'axios';

function useTimeWindow(test: any, hasExistingAttempt: boolean) {
  const [status, setStatus] = useState<'loading' | 'before' | 'open' | 'closed'>('loading');
  const [countdown, setCountdown] = useState('');

  const compute = useCallback(() => {
    if (!test) return;
    // If student has an existing attempt (resuming), always show as open
    if (hasExistingAttempt) { setStatus('open'); return; }
    const now = new Date();
    const start = test.startTime ? new Date(test.startTime) : null;
    const end   = test.endTime   ? new Date(test.endTime)   : null;

    if (end && now > end)          { setStatus('closed'); return; }
    if (start && now < start) {
      setStatus('before');
      const diff = Math.max(0, start.getTime() - now.getTime());
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setCountdown(`${h > 0 ? h + 'h ' : ''}${m}m ${s}s`);
      return;
    }
    setStatus('open');
  }, [test]);

  useEffect(() => {
    compute();
    const t = setInterval(compute, 1000);
    return () => clearInterval(t);
  }, [compute]);

  return { status, countdown };
}

export default function InstructionPage() {
  const { testId } = useParams<{ testId: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [test, setTest] = useState<any>(null);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasExistingAttempt, setHasExistingAttempt] = useState(false);
  const [errorModal, setErrorModal] = useState({ show: false, title: '', message: '', redirectToDashboard: false });

  const candidateName = user?.role === 'student' ? user.name : '';
  const candidateImage = user?.role === 'student' ? (user.profilePic || '') : '';

  const { status, countdown } = useTimeWindow(test, hasExistingAttempt);

  useEffect(() => { fetchTest(); }, [testId]);

  const fetchTest = async () => {
    try {
      const res = await testAPI.getTestById(testId);
      setTest(res.data);
      // Check if student has an existing incomplete attempt (for resume bypass)
      if (user?.role === 'student') {
        try {
          const attRes = await axios.get('/api/attempts/user/me');
          const incomplete = attRes.data.find((a: any) => a.testId === testId && !a.isCompleted);
          setHasExistingAttempt(!!incomplete);
        } catch {}
      }
    } catch {
      setErrorModal({ show: true, title: 'Test Not Found', message: 'Test not found. Redirecting to dashboard.', redirectToDashboard: true });
      setTimeout(() => router.push('/student'), 3000);
    }
  };

  const startTest = async () => {
    if (!agreed) { setErrorModal({ show: true, title: 'Agreement Required', message: 'Please agree to all instructions before starting.', redirectToDashboard: false }); return; }
    setLoading(true);
    try {
      const res = await attemptAPI.startTest({ testId, candidateName, candidateImage });
      router.push(`/test/${res.data.id}`);
    } catch (error: any) {
      if (error.response?.status === 403 && error.response?.data?.needsResume) {
        setErrorModal({ show: true, title: 'Resume Permission Required', message: 'Your test was interrupted. Please contact your institute to get resume permission before you can continue.', redirectToDashboard: true });
      } else if (error.response?.status === 400) {
        setErrorModal({ show: true, title: 'Cannot Start Test', message: error.response.data.error + ' Redirecting to dashboard.', redirectToDashboard: true });
        setTimeout(() => router.push('/student'), 3000);
      } else {
        setErrorModal({ show: true, title: 'Failed to Start Test', message: 'Unable to start the test. Please try again.', redirectToDashboard: false });
      }
    } finally { setLoading(false); }
  };

  if (!test) return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="text-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div><p>Loading test instructions...</p></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <img src="/examizLogo.png" alt="Examiz" className="h-12" />
          <div className="flex items-center gap-4">
            {candidateImage && <img src={candidateImage} alt="Candidate" className="w-10 h-10 rounded-full object-cover" />}
            <p className="font-medium">{candidateName}</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">{test.name}</h2>
            <div className="flex justify-center gap-8 text-sm text-gray-600">
              <span>Duration: {Math.floor(test.duration / 60)}h {test.duration % 60}m</span>
              <span>Total Marks: {test.totalMarks}</span>
              <span>Questions: {test.sections.reduce((t: number, s: any) => t + s.questions.length, 0)}</span>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4 text-blue-700">General Instructions</h3>
              <div className="bg-blue-50 p-4 rounded-lg">
                <ul className="space-y-2 text-sm text-gray-700">
                  {['The test will be conducted in fullscreen mode. Do not attempt to exit fullscreen during the test.',
                    'You will receive warnings for exiting fullscreen. After 5 warnings, the test will be auto-submitted.',
                    'Your answers are automatically saved every 15 seconds.',
                    'You can navigate between questions and sections freely during the test.',
                    'The timer will be displayed at the top right. The test will auto-submit when time expires.'
                  ].map((inst, i) => (
                    <li key={i} className="flex items-start"><span className="font-medium mr-2">{i + 1}.</span><span>{inst}</span></li>
                  ))}
                </ul>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4 text-green-700">Marking Scheme</h3>
              <div className="bg-green-50 p-4 rounded-lg space-y-3">
                {test.sections.map((section: any, idx: number) => (
                  <div key={idx} className="bg-white p-3 rounded border">
                    <h4 className="font-medium text-gray-800 mb-2">{section.name}</h4>
                    <p className="text-xs text-gray-600 mb-2">
                      {section.questionType === 'SINGLE_CORRECT' ? 'Single Correct Type' : section.questionType === 'INTEGER' ? 'Integer Type' : section.questionType === 'MULTIPLE_CORRECT' ? 'One or More Correct Type' : section.questionType === 'NUMERICAL_VALUE' ? 'Numerical Value Type' : 'Matrix Match Type'}
                    </p>
                    {section.questionType === 'MULTIPLE_CORRECT' ? (
                      <p className="text-xs text-gray-700">+4 (all correct), +3/+2/+1 (partial), 0 (unanswered), -2 (wrong)</p>
                    ) : (
                      <div className="flex gap-4 text-xs">
                        <span className="font-bold text-green-700">+{section.marks ?? section.questions[0]?.marks ?? 4} Correct</span>
                        <span className="font-bold text-red-700">{section.marks != null ? section.negativeMarks : (section.questions[0]?.negativeMarks ?? -1)} Wrong</span>
                        <span className="font-bold text-gray-700">0 Not Attempted</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4 text-orange-700">Question Status Colors</h3>
              <div className="bg-orange-50 p-4 rounded-lg grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                {[
                  { cls: 'bg-gray-100 border-gray-300 text-gray-700', label: 'Not Visited', desc: "Questions you haven't opened yet" },
                  { cls: 'bg-red-100 border-red-300 text-red-700', label: 'Not Answered', desc: 'Visited but not answered' },
                  { cls: 'bg-green-100 border-green-500 text-green-700', label: 'Answered', desc: 'Questions you have answered' },
                  { cls: 'bg-yellow-100 border-yellow-500 text-yellow-700', label: 'Marked for Review', desc: 'Marked for later review' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className={`w-8 h-8 ${item.cls} border-2 rounded flex items-center justify-center text-sm font-medium`}>{i + 1}</div>
                    <div><div className="font-medium">{item.label}</div><div className="text-xs text-gray-600">{item.desc}</div></div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4 text-red-700">Important Warnings</h3>
              <div className="bg-red-50 p-4 rounded-lg border-l-4 border-red-500">
                <ul className="space-y-2 text-sm text-gray-700">
                  {['Do not close the browser or navigate away from the test page.', 'Do not use browser back/forward buttons during the test.', 'Ensure stable internet connection throughout the test duration.'].map((w, i) => (
                    <li key={i} className="flex items-start"><span className="text-red-500 mr-2">⚠️</span><span>{w}</span></li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <label className="flex items-start gap-3">
              <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded" />
              <span className="text-sm text-gray-700">I have read and understood all the instructions. I agree to follow all guidelines.</span>
            </label>
          </div>

          {/* Time window status */}
          {status === 'before' && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
              <p className="text-yellow-800 font-semibold text-sm">⏳ Test hasn't started yet</p>
              <p className="text-yellow-700 text-xs mt-1">
                Starts at {new Date(test.startTime).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </p>
              <p className="text-2xl font-bold text-yellow-800 mt-2">{countdown}</p>
            </div>
          )}
          {status === 'closed' && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-center">
              <p className="text-red-700 font-semibold text-sm">🚫 The window to start this test has closed.</p>
              <p className="text-red-600 text-xs mt-1">
                It ended at {new Date(test.endTime).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          )}

          <div className="mt-8 flex justify-center gap-4">
            <button onClick={() => router.push('/student')} className="px-6 py-3 bg-gray-500 text-white rounded-md hover:bg-gray-600 font-medium">Back to Dashboard</button>
            <button
              onClick={startTest}
              disabled={!agreed || loading || status === 'before' || status === 'closed'}
              className="px-8 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Starting Test...' : status === 'before' ? 'Not Started Yet' : status === 'closed' ? 'Window Closed' : 'Start Test'}
            </button>
          </div>
        </div>
      </div>

      <Modal isOpen={errorModal.show} onClose={() => { if (errorModal.redirectToDashboard) router.push('/student'); else setErrorModal({ show: false, title: '', message: '', redirectToDashboard: false }); }} title={errorModal.title}>
        <div className="text-center">
          <p className="text-gray-700 mb-4">{errorModal.message}</p>
          {!loading && (
            <button onClick={() => { if (errorModal.redirectToDashboard) router.push('/student'); else setErrorModal({ show: false, title: '', message: '', redirectToDashboard: false }); }} className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700">OK</button>
          )}
        </div>
      </Modal>
    </div>
  );
}
