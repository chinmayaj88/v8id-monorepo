import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { apiClient } from '@/lib/api';

export interface VaultSecret {
  id: string;
  name: string;
  username?: string;
  url?: string;
  category: string;
  updatedAt: string;
  notes?: string;
  // password is usually not returned in list view
}

export interface VaultSecretDetail extends VaultSecret {
  password?: string;
  decryptedPassword?: string;
}

interface VaultState {
  secrets: VaultSecret[];
  isLoading: boolean;
  error: string | null;
  isUnlocked: boolean; // simple client-side toggle for now (mock unlock)
}

const initialState: VaultState = {
  secrets: [],
  isLoading: false,
  error: null,
  isUnlocked: false,
};

export const fetchSecrets = createAsyncThunk<VaultSecret[], void, { rejectValue: string }>(
  'vault/fetchSecrets',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get('/vault');
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch secrets');
    }
  }
);

export const addSecret = createAsyncThunk<
  VaultSecret,
  {
    name: string;
    username?: string;
    password?: string;
    url?: string;
    notes?: string;
    category?: string;
  },
  { rejectValue: string }
>('vault/addSecret', async (data, { rejectWithValue }) => {
  try {
    const response = await apiClient.post('/vault', data);
    return response.data.data;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Failed to add secret');
  }
});

export const deleteSecret = createAsyncThunk<string, string, { rejectValue: string }>(
  'vault/deleteSecret',
  async (id, { rejectWithValue }) => {
    try {
      await apiClient.delete(`/vault/${id}`);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete secret');
    }
  }
);

export const getSecretDetails = createAsyncThunk<
  VaultSecretDetail,
  string,
  { rejectValue: string }
>('vault/getSecretDetails', async (id, { rejectWithValue }) => {
  try {
    const response = await apiClient.get(`/vault/${id}`);
    return response.data.data;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Failed to get secret details');
  }
});

const vaultSlice = createSlice({
  name: 'vault',
  initialState,
  reducers: {
    unlockVault: state => {
      state.isUnlocked = true;
    },
    lockVault: state => {
      state.isUnlocked = false;
      state.secrets = [];
    },
    clearVaultData: state => {
      state.secrets = [];
      state.isUnlocked = false;
      state.error = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchSecrets.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchSecrets.fulfilled, (state, action) => {
        state.isLoading = false;
        state.secrets = action.payload;
      })
      .addCase(fetchSecrets.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(addSecret.fulfilled, (state, action) => {
        state.secrets.push(action.payload);
      })
      .addCase(deleteSecret.fulfilled, (state, action) => {
        state.secrets = state.secrets.filter(s => s.id !== action.payload);
      })
      .addCase('auth/logout', state => {
        state.secrets = [];
        state.isUnlocked = false;
      });
  },
});

export const { unlockVault, lockVault, clearVaultData } = vaultSlice.actions;
export default vaultSlice.reducer;
