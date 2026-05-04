import type { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '../contexts/ThemeContext';
import MainLayout from '../components/Layout/MainLayout';
import { initializeTheme } from '../lib/themes';
import '../styles/globals.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 10,
    },
  },
});

// Inject Authorization header on all /api/ calls — tenant_id is derived server-side from token
if (typeof window !== 'undefined') {
  const originalFetch = window.fetch;
  window.fetch = function(input, init) {
    const url = typeof input === 'string' ? input : (input as Request).url;
    if (url.startsWith('/api/')) {
      const token = localStorage.getItem('token') || '';
      init = init || {};
      init.headers = {
        ...init.headers,
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      };
    }
    return originalFetch.call(this, input, init);
  };
}

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const isPublicPage = ['/login', '/landing', '/', '/404', '/_error'].includes(router.pathname);

  useEffect(() => {
    // Initialize theme on app load
    initializeTheme();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        {isPublicPage ? (
          <Component {...pageProps} />
        ) : (
          <MainLayout>
            <Component {...pageProps} />
          </MainLayout>
        )}
      </ThemeProvider>
    </QueryClientProvider>
  );
}
