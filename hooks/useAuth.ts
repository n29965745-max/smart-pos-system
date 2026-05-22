import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import axios from 'axios';

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  phone?: string;
  role?: string;
  system_role?: string;
  tenant_id?: string | null;
}

export const useAuth = () => {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token) {
      setLoading(false);
      return;
    }

    if (userData) {
      try {
        setUser(JSON.parse(userData));
      } catch {
        localStorage.removeItem('user');
      }
    }

    setLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setError(null);
      const response = await axios.post('/api/auth/login', { email, password });

      if (response.data.success) {
        const authUser: AuthUser = {
          id: response.data.user.id,
          username: response.data.user.full_name,
          email: response.data.user.email,
          phone: response.data.user.phone,
          role: response.data.user.role || 'Admin',
          system_role: response.data.user.system_role || 'user',
          tenant_id: response.data.user.tenant_id ?? null,
        };

        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(authUser));
        localStorage.setItem('tenant_id', authUser.tenant_id || '');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');

        setUser(authUser);
        return true;
      }
      return false;
    } catch (err: any) {
      const message = err.response?.data?.error || 'Login failed';
      setError(message);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('tenant_id');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
    router.push('/login');
  };

  const getToken = () => {
    return localStorage.getItem('token');
  };

  return {
    user,
    loading,
    error,
    login,
    logout,
    getToken,
    isAuthenticated: !!user,
  };
};
