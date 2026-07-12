import { useSelector, useDispatch } from 'react-redux';
import { toggleTheme, initTheme } from '../redux/slices/themeSlice';
import { useEffect } from 'react';

export const useTheme = () => {
  const dispatch = useDispatch();
  const darkMode = useSelector((state) => state.theme.darkMode);

  const toggle = () => {
    dispatch(toggleTheme());
  };

  useEffect(() => {
    dispatch(initTheme());
  }, [dispatch]);

  return {
    darkMode,
    toggleTheme: toggle
  };
};
