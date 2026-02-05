'use client';

import { Provider } from 'react-redux';
import { store } from '@/store';
import { useEffect } from 'react';
import { apiClient } from '@/lib/api';
import { useAppDispatch } from '@/store/hooks';
import { type User } from '@/store/slices/authSlice';
import { setAuthenticatedUser, setLoading, setInitialized } from '@/store/slices/authSlice';
import { useAppSelector } from '@/store/hooks';
import PremiumLoader from '@/components/ui/PremiumLoader';

function AuthInitializer({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const isInitialized = useAppSelector(state => state.auth.isInitialized);

  useEffect(() => {
    let cancelled = false;

    const bootstrapAuth = async () => {
      try {
        const response = await apiClient.get('/users/me/profile');
        const user = (response.data?.data ?? null) as User | null;
        if (!cancelled && user) {
          dispatch(setAuthenticatedUser(user));
        } else {
          dispatch(setLoading(false));
          dispatch(setInitialized(true));
        }
      } catch {
        // Not authenticated or call failed
        if (!cancelled) {
          dispatch(setLoading(false));
          dispatch(setInitialized(true));
        }
      }
    };

    void bootstrapAuth();

    return () => {
      cancelled = true;
    };
  }, [dispatch]);

  if (!isInitialized) {
    return <PremiumLoader />;
  }

  return <>{children}</>;
}

export default function StoreProvider({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <AuthInitializer>{children}</AuthInitializer>
    </Provider>
  );
}
