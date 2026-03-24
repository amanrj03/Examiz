'use client';
import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend, PieChart, Pie, Cell, ReferenceArea
} from 'recharts';
import { attemptAPI } from '../../../services/api';
import { formatTime } from '../../../hooks/useTimeTracking';
import { groupSectionsBySubject, generateQuestionWiseData } from '../../../utils/subjectUtils';
import { getDetailedJeeMainsStats } from '../../../data/jeeMainsStats';
import {
  Target, CheckCircle2, XCircle, MinusCircle, TrendingUp, Award, BookOpen,
  ChevronDown, Sparkles, Trophy, Clock, BarChart3,
  TrendingUp as TrendingUpIcon
} from 'lucide-react';

export default function AnalysePage() {
  const { attemptId } = useParams<{ attemptId: string }>();
  const [attempt, setAttempt] = useState<any>(null);
  const [selectedSection, setSelectedSection] = useState(0);
  const [analysisFilter, setAnalysisFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());

  useEffect(() => { setExpandedQuestions(new Set()); }, [selectedSection, analysisFilter]);

  useEffect(() => {
    attemptAPI.getAttempt(attemptId).then((res: any) => {
      setAttempt(res.data);
      const t = setTimeout(() => setLoading(false), 800);
      return () => clearTimeout(t);
    }).catch(() => setLoading(false));
  }, [attemptId]);

  const getAnswerForQuestion = (questionId: string) =>
    attempt?.answers?.find((a: any) => a.questionId === questionId);

  const getFilteredQuestions = (sectionQuestions: any[]) => {
    if (analysisFilter === 'all') return sectionQuestions;
    return sectionQuestions.filter((question) => {
      const answer = getAnswerForQuestion(question.id);
      const isCorrect = answer?.isCorrect;
      if (analysisFilter === 'wrong') return isCorrect === false;
      if (analysisFilter === 'unattempted') return isCorrect === null;
      return true;
    });
  };

  const getSectionStats = (sectionQuestions: any[]) => {
    const stats = { total: sectionQuestions.length, correct: 0, wrong: 0, unattempted: 0, marks: 0, totalTime: 0 };
    sectionQuestions.forEach((question) => {
      const answer = getAnswerForQuestion(question.id);
      if (answer && answer.isCorrect !== null) {
        if (answer.isCorrect === true) { stats.correct++; stats.marks += answer.marksAwarded; }
        else if (answer.isCorrect === false) { stats.wrong++; stats.marks += answer.marksAwarded; }
      } else { stats.unattempted++; }
      if (answer && answer.timeSpent) stats.totalTime += answer.timeSpent;
    });
    const attemptedQuestions = stats.correct + stats.wrong;
    const accuracy = attemptedQuestions > 0 ? ((stats.correct / attemptedQuestions) * 100).toFixed(1) : '0.0';
    return { ...stats, accuracy };
  };

  const getOverallStats = () => {
    if (!attempt) return null;
    const stats = {
      total: 0, correct: 0, wrong: 0, unattempted: 0,
      totalMarks: attempt.totalMarks, maxMarks: attempt.test.totalMarks,
      percentage: ((attempt.totalMarks / attempt.test.totalMarks) * 100).toFixed(1),
      accuracy: '0.0'
    };
    attempt.test.sections.forEach((section: any) => {
      const ss = getSectionStats(section.questions);
      stats.total += ss.total; stats.correct += ss.correct;
      stats.wrong += ss.wrong; stats.unattempted += ss.unattempted;
    });
    const attempted = stats.correct + stats.wrong;
    stats.accuracy = attempted > 0 ? ((stats.correct / attempted) * 100).toFixed(1) : '0.0';
    return stats;
  };

  const subjectGroups = useMemo(() =>
    attempt?.test?.enableGraphicalAnalysis && attempt?.test?.sections
      ? groupSectionsBySubject(attempt.test.sections, attempt.answers)
      : null,
    [attempt]);

  const processedChartData = useMemo(() =>
    subjectGroups ? Object.values(subjectGroups).map((s: any) => ({
      subject: s.name, correct: s.stats.correct, wrong: s.stats.wrong,
      unattempted: s.stats.unattempted, accuracy: parseFloat(s.stats.accuracy.toFixed(1)),
      marks: s.stats.marks, maxMarks: s.stats.maxMarks,
      timeMinutes: Math.round(s.stats.totalTime / 60)
    })) : null,
    [subjectGroups]);

  const timeDistributionData = useMemo(() => {
    if (!processedChartData || !attempt?.test?.duration) return null;
    const totalUsed = processedChartData.reduce((sum: number, s: any) => sum + s.timeMinutes, 0);
    const remaining = Math.max(0, attempt.test.duration - totalUsed);
    const data: any[] = [...processedChartData];
    if (remaining > 0) data.push({ subject: 'Remaining Time', timeMinutes: remaining, isRemainingTime: true });
    return data;
  }, [processedChartData, attempt]);

  const lineChartData = useMemo(() => {
    if (!attempt?.test?.sections) return null;
    const questionData = generateQuestionWiseData(attempt.test.sections, attempt.answers);
    let cumulativeMarks = 0, cumulativeCorrect = 0, cumulativeAttempted = 0;
    return questionData.map((q: any) => {
      cumulativeMarks += q.marks;
      if (q.isCorrect !== null) { cumulativeAttempted++; if (q.isCorrect === true) cumulativeCorrect++; }
      const accuracy = cumulativeAttempted > 0 ? (cumulativeCorrect / cumulativeAttempted) * 100 : 0;
      return { ...q, cumulativeMarks, accuracy: parseFloat(accuracy.toFixed(1)) };
    });
  }, [attempt]);

  const CHART_COLORS: Record<string, string> = {
    Physics: '#3B82F6', Chemistry: '#10B981', Mathematics: '#8B5CF6',
    correct: '#10B981', wrong: '#EF4444', unattempted: '#F59E0B', maxMarks: '#D1D5DB'
  };
  const PIE_COLORS = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444', '#06B6D4'];
  const REMAINING_TIME_COLOR = '#9CA3AF';

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass rounded-xl p-4 border border-border/50 shadow-lg">
          <p className="text-foreground font-medium">{label}</p>
          {payload.map((entry: any, i: number) => (
            <p key={i} style={{ color: entry.color }} className="text-sm">{`${entry.dataKey}: ${entry.value}`}</p>
          ))}
        </div>
      );
    }
    return null;
  };

  const PieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="glass rounded-xl p-4 border border-border/50 shadow-lg">
          <p className="text-foreground font-medium">{data.subject}</p>
          <p className="text-sm" style={{ color: payload[0].color }}>
            {payload[0].dataKey === 'accuracy' ? `Accuracy: ${data.accuracy}%` : `Time: ${data.timeMinutes} min`}
          </p>
        </div>
      );
    }
    return null;
  };

  const createSubjectAreas = (data: any[]) => {
    if (!data || data.length === 0) return [];
    const areas: any[] = [];
    let currentSubject: string | null = null;
    let startQuestion: number | null = null;
    data.forEach((point, index) => {
      if (currentSubject !== point.subject) {
        if (currentSubject && startQuestion !== null)
          areas.push({ subject: currentSubject, x1: startQuestion, x2: data[index - 1].questionNumber, color: CHART_COLORS[currentSubject] });
        currentSubject = point.subject;
        startQuestion = point.questionNumber;
      }
    });
    if (currentSubject && startQuestion !== null)
      areas.push({ subject: currentSubject, x1: startQuestion, x2: data[data.length - 1].questionNumber, color: CHART_COLORS[currentSubject] });
    return areas;
  };

  const SubjectLegend = () => (
    <div className="flex justify-center gap-6 mt-4 pt-4 border-t border-border/20">
      {['Physics', 'Chemistry', 'Mathematics'].map((s) => (
        <div key={s} className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: CHART_COLORS[s] }} />
          <span className="text-sm text-muted-foreground">{s}</span>
        </div>
      ))}
    </div>
  );

  const makeDot = (defaultColor: string) => (props: any) => {
    const { payload, cx, cy } = props;
    const subjectColor = CHART_COLORS[payload?.subject] || defaultColor;
    const color = payload?.isCorrect === true ? subjectColor : payload?.isCorrect === false ? '#EF4444' : '#9CA3AF';
    return <circle cx={cx} cy={cy} r={4} fill={color} stroke={color} strokeWidth={2} />;
  };

  const makeActiveDot = (defaultColor: string) => (props: any) => {
    const { payload, cx, cy } = props;
    const subjectColor = CHART_COLORS[payload?.subject] || defaultColor;
    const color = payload?.isCorrect === true ? subjectColor : payload?.isCorrect === false ? '#EF4444' : '#9CA3AF';
    return <circle cx={cx} cy={cy} r={6} fill={color} stroke={color} strokeWidth={2} />;
  };

  const SubjectPerformanceChart = () => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass rounded-2xl p-6 card-hover">
      <div className="flex items-center gap-2 mb-4"><BarChart3 className="w-5 h-5 text-primary" /><h3 className="text-lg font-semibold text-foreground">Subject Performance</h3></div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={processedChartData || undefined}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
          <XAxis dataKey="subject" stroke="hsl(var(--muted-foreground))" />
          <YAxis stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
          <Tooltip content={<CustomTooltip />} /><Legend />
          <Bar dataKey="correct" fill={CHART_COLORS.correct} radius={[4,4,0,0]} />
          <Bar dataKey="wrong" fill={CHART_COLORS.wrong} radius={[4,4,0,0]} />
          <Bar dataKey="unattempted" fill={CHART_COLORS.unattempted} radius={[4,4,0,0]} />
        </BarChart>
      </ResponsiveContainer>
    </motion.div>
  );

  const SubjectAccuracyChart = () => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass rounded-2xl p-6 card-hover">
      <div className="flex items-center gap-2 mb-4"><Target className="w-5 h-5 text-primary" /><h3 className="text-lg font-semibold text-foreground">Subject Accuracy</h3></div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={processedChartData || undefined}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
          <XAxis dataKey="subject" stroke="hsl(var(--muted-foreground))" />
          <YAxis stroke="hsl(var(--muted-foreground))" domain={[0,100]} tickFormatter={(v: number) => `${v}%`} />
          <Tooltip content={<CustomTooltip />} /><Legend />
          <Bar dataKey="accuracy" fill="#06B6D4" radius={[4,4,0,0]} name="Accuracy %" />
        </BarChart>
      </ResponsiveContainer>
    </motion.div>
  );

  const MarksDistributionChart = () => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass rounded-2xl p-6 card-hover">
      <div className="flex items-center gap-2 mb-4"><Award className="w-5 h-5 text-primary" /><h3 className="text-lg font-semibold text-foreground">Marks Distribution</h3></div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={processedChartData || undefined}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
          <XAxis dataKey="subject" stroke="hsl(var(--muted-foreground))" />
          <YAxis stroke="hsl(var(--muted-foreground))" />
          <Tooltip content={<CustomTooltip />} /><Legend />
          <Bar dataKey="marks" fill="#10B981" radius={[4,4,0,0]} name="Obtained Marks" />
          <Bar dataKey="maxMarks" fill={CHART_COLORS.maxMarks} radius={[4,4,0,0]} name="Maximum Marks" />
        </BarChart>
      </ResponsiveContainer>
    </motion.div>
  );

  const TimeSpentChart = () => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass rounded-2xl p-6 card-hover">
      <div className="flex items-center gap-2 mb-4"><Clock className="w-5 h-5 text-primary" /><h3 className="text-lg font-semibold text-foreground">Time Spent Distribution</h3></div>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie data={timeDistributionData || undefined} cx="50%" cy="50%" labelLine={false} label={({ subject, timeMinutes }: any) => `${subject}: ${timeMinutes}min`} outerRadius={80} dataKey="timeMinutes">
            {timeDistributionData?.map((entry: any, index: number) => (
              <Cell key={`cell-${index}`} fill={entry.isRemainingTime ? REMAINING_TIME_COLOR : PIE_COLORS[index % PIE_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<PieTooltip />} />
          <Legend formatter={(_: any, entry: any) => entry.payload.subject} />
        </PieChart>
      </ResponsiveContainer>
    </motion.div>
  );

  const ScoreVsQuestionChart = () => {
    const subjectAreas = createSubjectAreas(lineChartData || []);
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="glass rounded-2xl p-6 card-hover">
        <div className="flex items-center gap-2 mb-4"><TrendingUpIcon className="w-5 h-5 text-primary" /><h3 className="text-lg font-semibold text-foreground">Score vs Question Number</h3></div>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={lineChartData || undefined}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
            {subjectAreas.map((area: any, i: number) => <ReferenceArea key={i} x1={area.x1} x2={area.x2} fill={area.color} fillOpacity={0.1} stroke="none" />)}
            <XAxis dataKey="questionNumber" stroke="hsl(var(--muted-foreground))" domain={[1,'dataMax']} />
            <YAxis stroke="hsl(var(--muted-foreground))" domain={[0, attempt?.test?.totalMarks || 300]} />
            <Tooltip content={({ active, payload, label }: any) => {
              if (active && payload?.length) {
                const data = payload[0].payload;
                return (
                  <div className="glass rounded-xl p-4 border border-border/50 shadow-lg">
                    <p className="text-foreground font-medium">Question {label}</p>
                    <p className="text-sm" style={{ color: CHART_COLORS[data.subject] }}>Subject: {data.subject}</p>
                    <p className="text-sm">Cumulative Score: {data.cumulativeMarks}</p>
                    <p className="text-sm">This Question: {data.marks > 0 ? '+' : ''}{data.marks}</p>
                  </div>
                );
              }
              return null;
            }} />
            <Line type="monotone" dataKey="cumulativeMarks" stroke="#06B6D4" strokeWidth={3} dot={makeDot('#3B82F6')} activeDot={makeActiveDot('#3B82F6')} connectNulls={false} />
          </LineChart>
        </ResponsiveContainer>
        <SubjectLegend />
      </motion.div>
    );
  };

  const AccuracyProgressionChart = () => {
    const subjectAreas = createSubjectAreas(lineChartData || []);
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="glass rounded-2xl p-6 card-hover">
        <div className="flex items-center gap-2 mb-4"><Target className="w-5 h-5 text-primary" /><h3 className="text-lg font-semibold text-foreground">Accuracy Progression During Test</h3></div>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={lineChartData || undefined}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
            {subjectAreas.map((area: any, i: number) => <ReferenceArea key={i} x1={area.x1} x2={area.x2} fill={area.color} fillOpacity={0.1} stroke="none" />)}
            <XAxis dataKey="questionNumber" stroke="hsl(var(--muted-foreground))" domain={[1,'dataMax']} />
            <YAxis stroke="hsl(var(--muted-foreground))" domain={[0,100]} tickFormatter={(v: number) => `${v}%`} />
            <Tooltip content={({ active, payload, label }: any) => {
              if (active && payload?.length) {
                const data = payload[0].payload;
                return (
                  <div className="glass rounded-xl p-4 border border-border/50 shadow-lg">
                    <p className="text-foreground font-medium">After Question {label}</p>
                    <p className="text-sm" style={{ color: CHART_COLORS[data.subject] }}>Subject: {data.subject}</p>
                    <p className="text-sm">Overall Accuracy: {data.accuracy}%</p>
                    <p className="text-sm">This Question: {data.isCorrect === true ? 'Correct ✅' : data.isCorrect === false ? 'Wrong ❌' : 'Unattempted ⏸️'}</p>
                  </div>
                );
              }
              return null;
            }} />
            <Line type="monotone" dataKey="accuracy" stroke="#06B6D4" strokeWidth={3} dot={makeDot('#10B981')} activeDot={makeActiveDot('#10B981')} connectNulls={false} />
          </LineChart>
        </ResponsiveContainer>
        <SubjectLegend />
      </motion.div>
    );
  };

  const TimePerQuestionChart = () => {
    const subjectAreas = createSubjectAreas(lineChartData || []);
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }} className="glass rounded-2xl p-6 card-hover">
        <div className="flex items-center gap-2 mb-4"><Clock className="w-5 h-5 text-primary" /><h3 className="text-lg font-semibold text-foreground">Time Spent per Question</h3></div>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={lineChartData || undefined}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
            {subjectAreas.map((area: any, i: number) => <ReferenceArea key={i} x1={area.x1} x2={area.x2} fill={area.color} fillOpacity={0.1} stroke="none" />)}
            <XAxis dataKey="questionNumber" stroke="hsl(var(--muted-foreground))" domain={[1,'dataMax']} />
            <YAxis stroke="hsl(var(--muted-foreground))" tickFormatter={(v: number) => `${v}s`} />
            <Tooltip content={({ active, payload, label }: any) => {
              if (active && payload?.length) {
                const data = payload[0].payload;
                return (
                  <div className="glass rounded-xl p-4 border border-border/50 shadow-lg">
                    <p className="text-foreground font-medium">Question {label}</p>
                    <p className="text-sm" style={{ color: CHART_COLORS[data.subject] }}>Subject: {data.subject}</p>
                    <p className="text-sm">Time Spent: {data.timeSpent} seconds</p>
                    <p className="text-sm">Result: {data.isCorrect === true ? 'Correct ✅' : data.isCorrect === false ? 'Wrong ❌' : 'Unattempted ⏸️'}</p>
                  </div>
                );
              }
              return null;
            }} />
            <Line type="monotone" dataKey="timeSpent" stroke="#06B6D4" strokeWidth={3} dot={makeDot('#8B5CF6')} activeDot={makeActiveDot('#8B5CF6')} connectNulls={false} />
          </LineChart>
        </ResponsiveContainer>
        <SubjectLegend />
      </motion.div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-16 h-16 rounded-full border-4 border-gray-200 border-t-blue-600 mx-auto mb-6" />
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <p className="text-xl font-medium text-foreground">Analyzing your performance...</p>
            <p className="text-muted-foreground mt-2">Preparing detailed insights</p>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  if (!attempt) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Failed to load test analysis</p>
          <button onClick={() => window.close()} className="bg-blue-600 text-white px-4 py-2 rounded">Close</button>
        </div>
      </div>
    );
  }

  const overallStats = getOverallStats();
  const currentSection = attempt.test.sections[selectedSection];
  const filteredQuestions = getFilteredQuestions(currentSection.questions);
  const sectionStats = getSectionStats(currentSection.questions);
  const jeeStats = getDetailedJeeMainsStats(overallStats?.totalMarks || 0);

  const statCards = [
    { label: 'Total Questions', value: overallStats?.total || 0, icon: BookOpen, color: 'primary' },
    { label: 'Correct', value: overallStats?.correct || 0, icon: CheckCircle2, color: 'success' },
    { label: 'Wrong', value: overallStats?.wrong || 0, icon: XCircle, color: 'error' },
    { label: 'Unattempted', value: overallStats?.unattempted || 0, icon: MinusCircle, color: 'warning' },
    { label: 'Accuracy', value: `${overallStats?.accuracy}%`, icon: Target, color: 'info' },
  ];

  const sectionStatCards = [
    { label: 'Total', value: sectionStats.total, color: 'primary' },
    { label: 'Correct', value: sectionStats.correct, color: 'success' },
    { label: 'Wrong', value: sectionStats.wrong, color: 'error' },
    { label: 'Unattempted', value: sectionStats.unattempted, color: 'warning' },
    { label: 'Marks', value: sectionStats.marks, color: 'info' },
    { label: 'Accuracy', value: `${sectionStats.accuracy}%`, color: 'purple' },
    { label: 'Time', value: formatTime(sectionStats.totalTime), color: 'primary' },
  ];

  const filterButtons = [
    { key: 'all', label: 'All Questions', icon: BookOpen },
    { key: 'wrong', label: 'Wrong', icon: XCircle },
    { key: 'unattempted', label: 'Unattempted', icon: MinusCircle },
  ];

  const getColorClasses = (color: string) => {
    const colors: Record<string, any> = {
      primary: { text: 'text-primary', light: 'bg-primary/10' },
      success: { text: 'text-success', light: 'bg-success-light' },
      error: { text: 'text-error', light: 'bg-error-light' },
      warning: { text: 'text-warning', light: 'bg-warning-light' },
      info: { text: 'text-info', light: 'bg-info-light' },
      purple: { text: 'text-purple', light: 'bg-purple-light' },
    };
    return colors[color] || colors.primary;
  };

  return (
    <div className="min-h-screen bg-background analysis-page" style={{ fontFamily: "'Outfit', sans-serif", fontWeight: '400' }}>
      {/* Decorative Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-info/3 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <motion.header initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="relative glass-strong border-b border-border/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <img src="/nta-small-logo.jpg" alt="NTA Logo" className="w-10 h-10 object-contain" />
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-foreground">{attempt.test.name}</h1>
                <p className="text-muted-foreground text-sm">Analysis Report • {attempt.candidateName}</p>
              </div>
            </div>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="flex items-center gap-4">
              <div className="text-right">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
                  className="text-3xl sm:text-4xl font-bold gradient-text">
                  {overallStats?.totalMarks}/{overallStats?.maxMarks}
                </motion.div>
                <p className="text-sm text-muted-foreground">{overallStats?.percentage}% Score</p>
              </div>
              <motion.div whileHover={{ rotate: 10 }}
                className="hidden sm:flex w-14 h-14 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 items-center justify-center shadow-lg">
                <Trophy className="w-7 h-7 text-white" />
              </motion.div>
            </motion.div>
          </div>
        </div>
      </motion.header>

      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Overall Performance */}
        <motion.section initial={{ opacity: 1 }} animate={{ opacity: 1 }}>
          <div className="flex items-center gap-2 mb-6">
            <Sparkles className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold text-foreground">Overall Performance</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {statCards.map((stat, index) => {
              const colorClasses = getColorClasses(stat.color);
              return (
                <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + index * 0.05 }} whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  className="glass rounded-2xl p-5 card-hover cursor-default">
                  <div className={`w-10 h-10 rounded-xl ${colorClasses.light} flex items-center justify-center mb-3`}>
                    <stat.icon className={`w-5 h-5 ${colorClasses.text}`} />
                  </div>
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 + index * 0.05 }}
                    className={`text-2xl sm:text-3xl font-bold ${colorClasses.text}`}>
                    {stat.value}
                  </motion.div>
                  <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
                </motion.div>
              );
            })}
          </div>
        </motion.section>

        {/* JEE Mains Prediction */}
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="relative overflow-hidden rounded-2xl">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-info/10 to-purple/10" />
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-card/50" />
          <div className="relative glass rounded-2xl p-6 sm:p-8 border-2 border-primary/20">
            <div className="flex items-center gap-2 mb-6">
              <motion.div animate={{ rotate: [0, 360] }} transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}>
                <Award className="w-6 h-6 text-primary" />
              </motion.div>
              <h2 className="text-xl font-semibold text-foreground">JEE Mains Expected Performance</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <motion.div whileHover={{ scale: 1.02 }} className="bg-card/80 rounded-xl p-6 text-center shadow-soft">
                <Trophy className="w-8 h-8 text-primary mx-auto mb-3" />
                <div className="text-3xl sm:text-4xl font-bold text-primary mb-1">{overallStats?.totalMarks}</div>
                <p className="text-sm text-muted-foreground font-medium">Your Score</p>
              </motion.div>
              <motion.div whileHover={{ scale: 1.02 }} className="bg-card/80 rounded-xl p-6 text-center shadow-soft">
                <TrendingUp className="w-8 h-8 text-success mx-auto mb-3" />
                <div className="text-2xl sm:text-3xl font-bold text-success mb-1">
                  {(jeeStats as any).estimatedPercentile || (jeeStats as any).percentileRange}
                </div>
                <p className="text-sm text-muted-foreground font-medium">
                  {(jeeStats as any).estimatedPercentile ? 'Estimated Percentile' : 'Expected Percentile'}
                </p>
                {(jeeStats as any).estimatedPercentile && (
                  <p className="text-xs text-muted-foreground mt-1">Range: {(jeeStats as any).percentileRange}</p>
                )}
              </motion.div>
              <motion.div whileHover={{ scale: 1.02 }} className="bg-card/80 rounded-xl p-6 text-center shadow-soft">
                <Trophy className="w-8 h-8 text-purple mx-auto mb-3" />
                <div className="text-2xl sm:text-3xl font-bold text-purple mb-1">
                  {(jeeStats as any).estimatedRank || (jeeStats as any).rankRange}
                </div>
                <p className="text-sm text-muted-foreground font-medium">
                  {(jeeStats as any).estimatedRank ? 'Estimated AIR' : 'Expected AIR Range'}
                </p>
                {(jeeStats as any).estimatedRank && (
                  <p className="text-xs text-muted-foreground mt-1">Range: {(jeeStats as any).rankRange}</p>
                )}
              </motion.div>
            </div>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
              className="mt-6 p-4 bg-warning/10 border border-warning/30 rounded-xl">
              <p className="text-sm text-foreground/80">
                <span className="font-semibold text-warning">Note:</span> These are estimated values based on previous JEE Mains data.
                Actual results may vary depending on exam difficulty and overall performance.
              </p>
            </motion.div>
          </div>
        </motion.section>

        {/* Graphical Analysis */}
        {attempt?.test?.enableGraphicalAnalysis && subjectGroups && Object.keys(subjectGroups).length > 1 && (
          <motion.section initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.6 }}>
            <div className="flex items-center gap-2 mb-6">
              <motion.div animate={{ rotate: [0, 360] }} transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}>
                <BarChart3 className="w-6 h-6 text-primary" />
              </motion.div>
              <h2 className="text-xl font-semibold text-foreground">Graphical Analysis</h2>
            </div>
            <div className="mb-8">
              <motion.h3 initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}
                className="text-lg font-medium text-foreground mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />Performance Overview
              </motion.h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <SubjectPerformanceChart />
                <SubjectAccuracyChart />
                <MarksDistributionChart />
                <TimeSpentChart />
              </div>
            </div>
            <div className="mb-8">
              <motion.h3 initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.8 }}
                className="text-lg font-medium text-foreground mb-4 flex items-center gap-2">
                <TrendingUpIcon className="w-5 h-5 text-primary" />Detailed Analysis
              </motion.h3>
              <div className="grid grid-cols-1 gap-6">
                <ScoreVsQuestionChart />
                <AccuracyProgressionChart />
                <TimePerQuestionChart />
              </div>
            </div>
          </motion.section>
        )}

        {/* Section Analysis */}
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <div className="flex items-center gap-2 mb-6">
            <BookOpen className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold text-foreground">Section Analysis</h2>
          </div>
          <div className="glass rounded-2xl p-6">
            {/* Section Tabs */}
            <div className="flex flex-wrap gap-2 mb-6">
              {attempt.test.sections.map((section: any, index: number) => {
                const stats = getSectionStats(section.questions);
                const isSelected = selectedSection === index;
                return (
                  <motion.button key={section.id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedSection(index)}
                    className={`relative px-5 py-3 rounded-xl font-medium transition-all duration-300 ${
                      isSelected ? 'bg-primary text-primary-foreground shadow-glow' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                    }`}>
                    <span>{section.name}</span>
                    <span className={`ml-2 text-sm ${isSelected ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                      ({stats.correct}/{stats.total})
                    </span>
                    {isSelected && (
                      <motion.div layoutId="activeSection" className="absolute inset-0 bg-primary rounded-xl -z-10" />
                    )}
                  </motion.button>
                );
              })}
            </div>
            {/* Section Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 mb-6">
              {sectionStatCards.map((stat, index) => {
                const colorClasses = getColorClasses(stat.color);
                return (
                  <motion.div key={stat.label} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.03 }} className={`${colorClasses.light} rounded-xl p-4 text-center`}>
                    <div className={`text-xl font-bold ${colorClasses.text}`}>{stat.value}</div>
                    <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
                  </motion.div>
                );
              })}
            </div>
            {/* Filter Buttons */}
            <div className="flex flex-wrap gap-2 mb-6">
              {filterButtons.map((filter) => {
                const isActive = analysisFilter === filter.key;
                return (
                  <motion.button key={filter.key} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={() => setAnalysisFilter(filter.key)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all duration-300 ${
                      isActive
                        ? filter.key === 'wrong' ? 'bg-error text-error-foreground'
                          : filter.key === 'unattempted' ? 'bg-warning text-warning-foreground'
                          : 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                    }`}>
                    <filter.icon className="w-4 h-4" />
                    {filter.label}
                  </motion.button>
                );
              })}
            </div>
          </div>
        </motion.section>

        {/* Questions List */}
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <div className="glass rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              {currentSection.name} - {analysisFilter === 'all' ? 'All Questions' : analysisFilter === 'wrong' ? 'Wrong Questions' : 'Unattempted Questions'}
              <span className="text-sm font-normal text-muted-foreground">({filteredQuestions.length})</span>
            </h3>

            {filteredQuestions.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
                <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 2, repeat: Infinity }} className="text-6xl mb-4">
                  {analysisFilter === 'wrong' ? '🎉' : analysisFilter === 'unattempted' ? '👍' : '📚'}
                </motion.div>
                <p className="text-xl font-medium text-foreground">
                  {analysisFilter === 'wrong' ? 'No wrong questions in this section!' : analysisFilter === 'unattempted' ? 'No unattempted questions!' : 'No questions found.'}
                </p>
                <p className="text-muted-foreground mt-2">
                  {analysisFilter === 'wrong' ? 'Great job! Keep it up!' : analysisFilter === 'unattempted' ? 'You attempted all questions!' : 'Try selecting a different filter.'}
                </p>
              </motion.div>
            ) : (
              <div className="space-y-4">
                <AnimatePresence>
                  {filteredQuestions.map((question: any, index: number) => {
                    const answer = getAnswerForQuestion(question.id);
                    const isCorrect = answer?.isCorrect;
                    const marksAwarded = answer?.marksAwarded || 0;
                    const timeSpent = answer?.timeSpent || 0;
                    const originalIndex = currentSection.questions.findIndex((q: any) => q.id === question.id);
                    const isExpanded = expandedQuestions.has(question.id);

                    const toggleExpanded = () => {
                      setExpandedQuestions((prev) => {
                        const next = new Set(prev);
                        if (next.has(question.id)) next.delete(question.id); else next.add(question.id);
                        return next;
                      });
                    };

                    const statusConfig = isCorrect === true
                      ? { bg: 'bg-success-light', text: 'text-success', border: 'border-success/30', label: 'Correct', icon: CheckCircle2 }
                      : isCorrect === false
                        ? { bg: 'bg-error-light', text: 'text-error', border: 'border-error/30', label: 'Wrong', icon: XCircle }
                        : { bg: 'bg-warning-light', text: 'text-warning', border: 'border-warning/30', label: 'Unattempted', icon: MinusCircle };

                    const getYourAnswer = () => {
                      const qType = currentSection.questionType;
                      if (qType === 'SINGLE_CORRECT' || qType === 'MATRIX_MATCH')
                        return answer?.selectedOption ? `Option ${answer.selectedOption}` : 'Not attempted';
                      if (qType === 'MULTIPLE_CORRECT') {
                        if (!answer?.selectedOptions) return 'Not attempted';
                        const opts = typeof answer.selectedOptions === 'string'
                          ? answer.selectedOptions.split(',').map((o: string) => o.trim())
                          : answer.selectedOptions;
                        return opts.map((o: string) => `Option ${o}`).join(', ');
                      }
                      if (qType === 'INTEGER')
                        return (answer?.integerAnswer !== null && answer?.integerAnswer !== undefined) ? answer.integerAnswer.toString() : 'Not attempted';
                      return 'Not attempted';
                    };

                    const getCorrectAnswer = () => {
                      const qType = currentSection.questionType;
                      if (qType === 'SINGLE_CORRECT' || qType === 'MATRIX_MATCH')
                        return question.correctOption ? `Option ${question.correctOption}` : 'N/A';
                      if (qType === 'MULTIPLE_CORRECT') {
                        if (!question.correctOptions) return 'N/A';
                        const opts = typeof question.correctOptions === 'string'
                          ? question.correctOptions.split(',').map((o: string) => o.trim())
                          : question.correctOptions;
                        return opts.map((o: string) => `Option ${o}`).join(', ');
                      }
                      if (qType === 'INTEGER')
                        return (question.correctInteger !== null && question.correctInteger !== undefined) ? question.correctInteger.toString() : 'N/A';
                      return 'N/A';
                    };

                    return (
                      <motion.div key={question.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }} transition={{ delay: index * 0.02 }}
                        className={`border-2 ${statusConfig.border} rounded-xl overflow-hidden bg-card/50 hover:bg-card transition-colors`}>
                        <button onClick={toggleExpanded} className="w-full p-5 flex items-center justify-between gap-4 text-left">
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-xl ${statusConfig.bg} flex items-center justify-center`}>
                              <statusConfig.icon className={`w-5 h-5 ${statusConfig.text}`} />
                            </div>
                            <div>
                              <h4 className="font-semibold text-foreground">Question {originalIndex + 1}</h4>
                              <p className="text-sm text-muted-foreground">{currentSection.questionType}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className={`px-3 py-1.5 rounded-lg text-sm font-medium ${statusConfig.bg} ${statusConfig.text}`}>{statusConfig.label}</span>
                            <span className={`font-bold text-lg ${marksAwarded > 0 ? 'text-success' : marksAwarded < 0 ? 'text-error' : 'text-muted-foreground'}`}>
                              {marksAwarded > 0 ? '+' : ''}{marksAwarded}
                            </span>
                            {timeSpent > 0 && (
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Clock className="w-4 h-4" />
                                <span>{formatTime(timeSpent)}</span>
                              </div>
                            )}
                            <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}>
                              <ChevronDown className="w-5 h-5 text-muted-foreground" />
                            </motion.div>
                          </div>
                        </button>

                        <AnimatePresence mode="wait">
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1, transition: { height: { duration: 0.4, ease: [0.04, 0.62, 0.23, 0.98] }, opacity: { duration: 0.3, delay: 0.1 } } }}
                              exit={{ height: 0, opacity: 0, transition: { height: { duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }, opacity: { duration: 0.2 } } }}
                              className="overflow-hidden question-expand" style={{ willChange: 'height, opacity' }}>
                              <div className="px-5 pb-5 pt-2 border-t border-border/50">
                                {question.questionImage && (
                                  <div className="mb-4">
                                    <img src={question.questionImage} alt={`Question ${originalIndex + 1}`} className="max-w-full h-auto border border-border rounded" />
                                  </div>
                                )}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  <div className="bg-secondary/50 rounded-xl p-4">
                                    <h5 className="font-medium text-foreground mb-2">Your Answer</h5>
                                    <p className={`text-lg font-semibold ${isCorrect === true ? 'text-success' : isCorrect === false ? 'text-error' : 'text-muted-foreground'}`}>
                                      {getYourAnswer()}
                                    </p>
                                  </div>
                                  <div className="bg-success-light rounded-xl p-4">
                                    <h5 className="font-medium text-foreground mb-2">Correct Answer</h5>
                                    <p className="text-lg font-semibold text-success">{getCorrectAnswer()}</p>
                                  </div>
                                </div>
                                {question.solutionImage && (
                                  <div className="mt-4">
                                    <h5 className="font-medium text-foreground mb-2">Solution</h5>
                                    <img src={question.solutionImage} alt={`Solution ${originalIndex + 1}`} className="max-w-full h-auto border border-border rounded" />
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </div>
        </motion.section>

        {/* Footer */}
        <motion.footer initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          className="text-center py-8 text-muted-foreground text-sm">
          <p>Keep practicing and improving! 🚀</p>
        </motion.footer>
      </main>
    </div>
  );
}
