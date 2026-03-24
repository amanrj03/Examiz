'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { testAPI, attemptAPI } from '../../services/api';
import Modal from '../../components/Modal';

const CANDIDATE_NAME = 'Ansh Ranjan';
const CANDIDATE_IMAGE = '/ANSHPHOTO.jpg';

export default function StudentPanel() {
  const router = useRouter();
  const [liveTests, setLiveTests] = useState<any[]>([]);
  const [attemptedTests, setAttemptedTests] = useState<any[]>([]);
  const [modal, setModal] = useState({ show: false, title: '', message: '' });

  const calculateAccuracy = (attempt: any) => {
    if (!attempt.answers?.length) return '0.0';
    let correct = 0, attempted = 0;
    attempt.answers.forEach((a: any) => {
      if (a.isCorrect !== null) { attempted++; if (a.isCorrect === true) correct++; }
    });
    return attempted === 0 ? '0.0' : ((correct / attempted) * 100).toFixed(1);
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('candidateName', CANDIDATE_NAME);
      localStorage.setItem('candidateImage', CANDIDATE_IMAGE);
    }
    fetchTests();
  }, []);

  const fetchTests = async () => {
    try {
      const [liveRes, attemptedRes] = await Promise.all([
        testAPI.getLiveTests(),
        attemptAPI.getUserAttempts(CANDIDATE_NAME),
      ]);
      const completedIds = attemptedRes.data.filter((a: any) => a.isCompleted).map((a: any) => a.testId);
      setLiveTests(liveRes.data.filter((t: any) => !completedIds.includes(t.id)));
      setAttemptedTests(attemptedRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  const startTest = (testId: string) => router.push(`/instructions/${testId}`);
  const analyseTest = (attemptId: string) => window.open(`/analyse/${attemptId}`, '_blank');

  return (
    <>
      <div className="min-h-screen bg-gray-100">
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
            <img src="/nta-logo.png" alt="NTA Logo" className="h-12" />
            <div className="flex items-center gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={CANDIDATE_IMAGE} alt="Candidate" className="w-10 h-10 rounded-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = '/api/placeholder/40/40'; }} />
              <div className="text-right">
                <p className="font-medium">{CANDIDATE_NAME}</p>
                <p className="text-sm text-gray-500">Student</p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-semibold mb-6 text-green-700">Live Tests</h2>
              {liveTests.length === 0 ? (
                <div className="text-center py-8"><p className="text-gray-500 mb-4">No live tests available</p><div className="text-sm text-gray-400">Live tests will appear here when activated by administrators</div></div>
              ) : (
                <div className="space-y-4">
                  {liveTests.map((test) => (
                    <div key={test.id} className="border border-green-200 bg-green-50 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-800">{test.name}</h3>
                          <div className="text-sm text-gray-600 space-y-1">
                            <p>Duration: {Math.floor(test.duration / 60)}h {test.duration % 60}m</p>
                            <p>Total Marks: {test.totalMarks}</p>
                          </div>
                        </div>
                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">LIVE</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="text-sm text-gray-600">Questions: {test.sections.reduce((t: number, s: any) => t + s.questions.length, 0)}</div>
                        <button onClick={() => startTest(test.id)} className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 font-medium">Start Test</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-semibold mb-6 text-blue-700">Attempted Tests</h2>
              {attemptedTests.length === 0 ? (
                <div className="text-center py-8"><p className="text-gray-500 mb-4">No attempted tests</p><div className="text-sm text-gray-400">Your completed tests will appear here for analysis</div></div>
              ) : (
                <div className="space-y-4">
                  {attemptedTests.map((attempt) => (
                    <div key={attempt.id} className="border border-blue-200 bg-blue-50 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-800">{attempt.test.name}</h3>
                          <div className="text-sm text-gray-600 space-y-1">
                            <p>Test Date: {new Date(attempt.endTime).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-blue-700">{attempt.totalMarks}/{attempt.test.totalMarks}</div>
                          <div className="text-sm text-gray-600">Accuracy: {calculateAccuracy(attempt)}%</div>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="text-sm text-gray-600">Completed on {new Date(attempt.endTime).toLocaleString()}</div>
                        <button onClick={() => analyseTest(attempt.id)} className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 font-medium">Analyse</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="mt-8 bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">Important Instructions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-700">
              <div>
                <h4 className="font-medium mb-2">Before Starting Test:</h4>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Ensure stable internet connection</li>
                  <li>Close all other applications</li>
                  <li>Use Chrome or Firefox browser</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">During Test:</h4>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Do not exit fullscreen mode</li>
                  <li>Answers are auto-saved every 15 seconds</li>
                  <li>Test will auto-submit after 5 warnings</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Modal isOpen={modal.show} onClose={() => setModal({ show: false, title: '', message: '' })} title={modal.title}>
        <div className="text-center">
          <p className="text-gray-700 mb-4">{modal.message}</p>
          <button onClick={() => setModal({ show: false, title: '', message: '' })} className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700">OK</button>
        </div>
      </Modal>
    </>
  );
}
