import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import fileReducer from './slices/fileSlice';
import vaultReducer from './slices/vaultSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    files: fileReducer,
    vault: vaultReducer,
  },
  devTools: process.env.NODE_ENV !== 'production',
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
