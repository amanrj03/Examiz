'use client';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import axios from 'axios';

type OrgUser = { role: 'org'; id: string; name: string; email: string; logo?: string };
type StudentUser = {
  role: 'student';
  id: string;
  name: string;
  username: string;
  registrationNo: string;
  phone?: string;
  profilePic?: string;
  gender?: string;
  class: { id: string; name: string };
};
type AuthUser = OrgUser | StudentUser | null;

interface AuthContextType {
  user: AuthUser;
  loading: boolean;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  logout: async () => {},
  refreshUser: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    try {
      // try org first — 401 is expected when a student is logged in, suppress console error
      const orgRes = await axios.get('/api/org/me').catch(() => null);
      if (orgRes?.data) { setUser({ role: 'org', ...orgRes.data }); return; }
      // try student
      const stuRes = await axios.get('/api/student/me').catch(() => null);
      if (stuRes?.data) { setUser({ role: 'student', ...stuRes.data }); return; }
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUser(); }, []);

  const logout = async () => {
    await axios.post('/api/auth/logout');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout, refreshUser: fetchUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
