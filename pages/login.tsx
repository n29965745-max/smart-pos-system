import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Generic branding for universal login
  const settings = {
    business_name: 'Smart POS System',
    business_tagline: 'Multi-Tenant Business Management',
    logo_url: null
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    if (router.query.registered) {
      setSuccess('Shop created! Sign in with your new credentials.');
    }
  }, [router.query]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email || '', password })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const user = {
          id: data.user.id,
          username: data.user.full_name,
          email: data.user.email,
          phone: data.user.phone,
          role: data.user.role || 'Admin',
          system_role: data.user.system_role || 'user',
          tenant_id: data.tenant_id || data.user.tenant_id,
        };
        
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('tenant_id', user.tenant_id || '');

        // Store first login flag for welcome banner
        if (data.is_first_login) {
          localStorage.setItem('is_first_login', 'true');
        }

        // Superadmin → admin panel; everyone else → dashboard
        if (data.is_super_admin) {
          router.push('/admin');
        } else {
          router.push('/dashboard-pro');
        }
      } else {
        throw new Error(data.error || 'Login failed');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ 
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    }}>
      {/* Left Panel - Illustration */}
      <div className="hidden lg:flex lg:w-1/2 p-12 flex-col justify-between relative overflow-hidden">
        {/* Subtle animated background */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 bg-blue-500 rounded-full filter blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500 rounded-full filter blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-2">
            {settings.logo_url ? (
              <>
                <img 
                  src={settings.logo_url} 
                  alt={settings.business_name}
                  className="w-16 h-16 object-contain rounded-full bg-white p-2 shadow-lg transition-transform duration-300 hover:scale-110"
                  style={{ maxWidth: '64px', maxHeight: '64px' }}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                    if (fallback) fallback.style.display = 'flex';
                  }}
                />
                <div className="w-16 h-16 rounded-full items-center justify-center hidden shadow-lg" style={{ 
                  background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)'
                }}>
                  <span className="text-2xl font-bold text-white">{settings.business_name.charAt(0)}</span>
                </div>
              </>
            ) : (
              <div className="w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-transform duration-300 hover:scale-110" style={{ 
                background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)'
              }}>
                <span className="text-2xl font-bold text-white">{settings.business_name.charAt(0)}</span>
              </div>
            )}
            <div>
              <h1 className="text-indigo-100 text-3xl font-bold">{settings.business_name}</h1>
              {settings.business_tagline && (
                <p className="text-purple-200 text-sm">{settings.business_tagline}</p>
              )}
            </div>
          </div>
        </div>

        <div className="relative z-10 flex-1 flex items-center justify-center">
          <div className="text-center space-y-6">
            <div className="w-64 h-64 mx-auto relative">
              {/* Floating card effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-3xl transform rotate-6 transition-transform duration-500 hover:rotate-12" style={{ boxShadow: '0 20px 60px rgba(59, 130, 246, 0.3)' }}></div>
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-3xl transform -rotate-6 transition-transform duration-500 hover:-rotate-12" style={{ boxShadow: '0 20px 60px rgba(139, 92, 246, 0.3)' }}></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <svg className="w-32 h-32 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-indigo-100">Business Management System</h2>
            <p className="text-purple-200 max-w-md mx-auto">
              Streamline your inventory, boost sales, and grow your business with our modern POS solution
            </p>
          </div>
        </div>

        <div className="relative z-10 space-y-3 text-indigo-200">
          <div className="flex items-center gap-3 transition-transform duration-200 hover:translate-x-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-lg">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
              </svg>
            </div>
            <span>Real-time inventory tracking</span>
          </div>
          <div className="flex items-center gap-3 transition-transform duration-200 hover:translate-x-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-lg">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
              </svg>
            </div>
            <span>Customer management & SMS</span>
          </div>
          <div className="flex items-center gap-3 transition-transform duration-200 hover:translate-x-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-lg">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
              </svg>
            </div>
            <span>Advanced analytics & reports</span>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex flex-col items-center mb-8">
            {settings.logo_url ? (
              <img 
                src={settings.logo_url} 
                alt={settings.business_name}
                className="w-16 h-16 object-contain rounded-full bg-white p-2 shadow-lg mb-4"
                style={{ maxWidth: '64px', maxHeight: '64px' }}
              />
            ) : (
              <div className="w-16 h-16 rounded-full flex items-center justify-center shadow-lg mb-4" style={{ 
                background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)'
              }}>
                <span className="text-2xl font-bold text-white">{settings.business_name.charAt(0)}</span>
              </div>
            )}
            <h1 className="text-indigo-100 text-2xl font-bold">{settings.business_name}</h1>
          </div>

          {/* Login Card */}
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-white/10 transition-all duration-300 hover:shadow-blue-500/20">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-indigo-100 mb-2">Welcome back</h2>
              <p className="text-purple-200">Sign in to your account to continue</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-indigo-200 mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 text-indigo-100 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 placeholder-gray-500 hover:bg-white/10"
                  placeholder="Enter your email"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-indigo-200 mb-2">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 text-indigo-100 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 placeholder-gray-500 hover:bg-white/10"
                  placeholder="Enter your password"
                />
              </div>

              {success && (
                <div className="p-4 rounded-xl text-sm mb-2" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', color: '#6ee7b7' }}>
                  {success}
                </div>
              )}

              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 disabled:opacity-50 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                style={{ 
                  background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                  opacity: loading ? 0.5 : 1
                }}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <div className="mt-6 text-center space-y-3">
              <a 
                href="#" 
                className="text-sm text-blue-400 hover:text-blue-300 transition-colors duration-200 block"
              >
                Forgot your password?
              </a>
            </div>
          </div>

          <p className="text-center text-purple-300 text-sm mt-6">
            Protected by enterprise-grade security
          </p>
        </div>
      </div>
    </div>
  );
}
