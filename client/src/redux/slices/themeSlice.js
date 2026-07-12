import { createSlice } from '@reduxjs/toolkit';

const getInitialThemeState = () => {
  const localTheme = localStorage.getItem('darkMode');
  if (localTheme !== null) {
    return { darkMode: localTheme === 'true' };
  }
  const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  return { darkMode: systemPrefersDark };
};

const themeSlice = createSlice({
  name: 'theme',
  initialState: getInitialThemeState(),
  reducers: {
    toggleTheme: (state) => {
      state.darkMode = !state.darkMode;
      localStorage.setItem('darkMode', state.darkMode.toString());
      if (state.darkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    },
    initTheme: (state) => {
      if (state.darkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }
});

export const { toggleTheme, initTheme } = themeSlice.actions;
export default themeSlice.reducer;
