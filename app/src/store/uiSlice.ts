import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UiState {
  uploadMenuVisible: boolean;
  currentFolderId: string | null;
}

const initialState: UiState = {
  uploadMenuVisible: false,
  currentFolderId: null,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setUploadMenuVisible: (state, action: PayloadAction<boolean>) => {
      state.uploadMenuVisible = action.payload;
    },
    setCurrentFolderId: (state, action: PayloadAction<string | null>) => {
      state.currentFolderId = action.payload;
    },
    toggleUploadMenu: state => {
      state.uploadMenuVisible = !state.uploadMenuVisible;
    },
  },
});

export const { setUploadMenuVisible, setCurrentFolderId, toggleUploadMenu } =
  uiSlice.actions;
export default uiSlice.reducer;
