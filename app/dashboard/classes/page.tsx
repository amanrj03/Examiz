'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';
import Link from 'next/link';

interface Class { id: string; name: string; _count: { students: number }; createdAt: string }

export default function ClassesPage() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const fetchClasses = () => axios.get('/api/org/classes').then((r) => setClasses(r.data));
  useEffect(() => { fetchClasses(); }, []);

  const createClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    try {
      await axios.post('/api/org/classes', { name: newName.trim() });
      setNewName('');
      setShowForm(false);
      fetchClasses();
    } finally {
      setCreating(false);
    }
  };

  const deleteClass = async (id: string, name: string) => {
    if (!confirm(`Delete class "${name}"? All students in this class will also be deleted.`)) return;
    await axios.delete(`/api/org/classes/${id}`);
    fetchClasses();
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Classes</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
        >
          + New Class
        </button>
      </div>

      {showForm && (
        <form onSubmit={createClass} className="bg-white border border-gray-200 rounded-xl p-4 mb-6 flex gap-3">
          <input
            type="text" required
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Class name (e.g. JEE 2026 Batch A)"
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button type="submit" disabled={creating} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
            {creating ? 'Creating...' : 'Create'}
          </button>
          <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100">
            Cancel
          </button>
        </form>
      )}

      {classes.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="text-4xl mb-3">🏫</p>
          <p className="font-medium">No classes yet</p>
          <p className="text-sm">Create your first class to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map((cls) => (
            <div key={cls.id} className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-800">{cls.name}</h3>
                  <p className="text-sm text-gray-500 mt-0.5">{cls._count.students} students</p>
                </div>
                <button
                  onClick={() => deleteClass(cls.id, cls.name)}
                  className="text-red-400 hover:text-red-600 text-sm p-1"
                  title="Delete class"
                >
                  🗑️
                </button>
              </div>
              <Link
                href={`/dashboard/classes/${cls.id}`}
                className="block w-full text-center bg-blue-50 text-blue-700 py-2 rounded-lg text-sm font-medium hover:bg-blue-100 transition"
              >
                Manage Students →
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
