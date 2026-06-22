import { createContext, useContext, useState } from 'react';
import { authApi } from '../api/index.js';

const Ctx = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('cv_user')); } catch { return null; }
  });
  const [loading, setLoading] = useState(false);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const { data } = await authApi.login(email, password);
      localStorage.setItem('cv_token', data.token);
      localStorage.setItem('cv_user',  JSON.stringify(data.user));
      setUser(data.user);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.response?.data?.error || 'Login failed.' };
    } finally { setLoading(false); }
  };

  const logout = () => {
    localStorage.removeItem('cv_token');
    localStorage.removeItem('cv_user');
    setUser(null);
  };

  return <Ctx.Provider value={{ user, loading, login, logout }}>{children}</Ctx.Provider>;
};

export const useAuth = () => useContext(Ctx);
