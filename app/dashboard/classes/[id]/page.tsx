'use client';
import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import axios from 'axios';
import Link from 'next/link';

interface Student { id: string; registrationNo: string; name: string; phone?: string; username: string }

export default function ClassDetailPage() {
  const { id: classId } = useParams<{ id: string }>();
  const [students, setStudents] = useState<Student[]>([]);
  const [className, setClassName] = useState('');
  const [showManual, setShowManual] = useState(false);
  const [form, setForm] = useState({ registrationNo: '', name: '', phone: '' });
  const [importing, setImporting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [importResult, setImportResult] = useState<{ created: number; skipped: number } | null>(null);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchStudents = async () => {
    const [stuRes, clsRes] = await Promise.all([
      axios.get(`/api/org/classes/${classId}/students`),
      axios.get('/api/org/classes'),
    ]);
    setStudents(stuRes.data);
    const cls = clsRes.data.find((c: { id: string; name: string }) => c.id === classId);
    if (cls) setClassName(cls.name);
  };

  useEffect(() => { fetchStudents(); }, [classId]);

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setImportResult(null);
    setError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await axios.post(`/api/org/classes/${classId}/students`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setImportResult(res.data);
      fetchStudents();
    } catch (err: unknown) {
      setError(axios.isAxiosError(err) ? err.response?.data?.error : 'Import failed');
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleManualAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await axios.post(`/api/org/classes/${classId}/students`, form);
      setForm({ registrationNo: '', name: '', phone: '' });
      setShowManual(false);
      fetchStudents();
    } catch (err: unknown) {
      setError(axios.isAxiosError(err) ? err.response?.data?.error : 'Failed to add student');
    } finally {
      setSaving(false);
    }
  };

  const exportCredentials = () => {
    window.open(`/api/org/classes/${classId}/export`, '_blank');
  };

  const deleteStudent = async (id: string, name: string) => {
    if (!confirm(`Remove student "${name}"?`)) return;
    await axios.delete(`/api/org/students/${id}`);
    fetchStudents();
  };

  return (
    <div className="p-8">
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
        <Link href="/dashboard/classes" className="hover:text-blue-600">Classes</Link>
        <span>/</span>
        <span className="text-gray-800 font-medium">{className}</span>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{className}</h1>
          <p className="text-gray-500 text-sm">{students.length} students enrolled</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCredentials} className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition">
            ⬇ Export Credentials
          </button>
          <label className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition cursor-pointer">
            {importing ? 'Importing...' : '📥 Import Excel'}
            <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleImport} disabled={importing} />
          </label>
          <button onClick={() => setShowManual(!showManual)} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition">
            + Add Student
          </button>
        </div>
      </div>

      {/* Excel format hint */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 text-sm text-blue-700">
        Excel format: columns <strong>registrationNo</strong>, <strong>name</strong>, <strong>phone</strong> (phone optional). Default password: <strong>welcome123</strong>
      </div>

      {importResult && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4 text-sm text-green-700">
          Import complete: {importResult.created} added, {importResult.skipped} skipped (already exist)
        </div>
      )}
      {error && <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-sm text-red-700">{error}</div>}

      {showManual && (
        <form onSubmit={handleManualAdd} className="bg-white border border-gray-200 rounded-xl p-4 mb-6 grid grid-cols-3 gap-3">
          <input required value={form.registrationNo} onChange={(e) => setForm({ ...form, registrationNo: e.target.value })}
            placeholder="Registration No" className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Full Name" className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="Phone (optional)" className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          <div className="col-span-3 flex gap-2">
            <button type="submit" disabled={saving} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50">
              {saving ? 'Adding...' : 'Add Student'}
            </button>
            <button type="button" onClick={() => setShowManual(false)} className="px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100">Cancel</button>
          </div>
        </form>
      )}

      {students.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="text-4xl mb-3">👥</p>
          <p className="font-medium">No students yet</p>
          <p className="text-sm">Import an Excel sheet or add students manually</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Reg. No</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Phone</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Username</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {students.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-gray-700">{s.registrationNo}</td>
                  <td className="px-4 py-3 text-gray-800">{s.name}</td>
                  <td className="px-4 py-3 text-gray-500">{s.phone || '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{s.username}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => deleteStudent(s.id, s.name)} className="text-red-400 hover:text-red-600 text-xs">Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
