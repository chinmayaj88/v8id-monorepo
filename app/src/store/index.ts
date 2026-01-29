import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/store/authSlice';
import uiReducer from './uiSlice';
import uploadReducer from './uploadSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    ui: uiReducer,
    upload: uploadReducer,
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
