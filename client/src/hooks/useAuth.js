import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
  loginStart as startLogin,
  loginSuccess as successLogin,
  loginFailure as failLogin,
  logout as clearAuth,
  updateUser as editUser
} from '../redux/slices/authSlice';

export const useAuth = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading, error } = useSelector((state) => state.auth);

  const login = async (email, password) => {
    dispatch(startLogin());
    try {
      const response = await api.post('/auth/login', { email, password });
      const { user, accessToken, refreshToken } = response.data;
      dispatch(successLogin({ user, accessToken, refreshToken }));
      
      // Redirect based on role
      if (user.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/student/dashboard');
      }
      return { success: true };
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Login failed. Please check your credentials.';
      dispatch(failLogin(errMsg));
      return { success: false, error: errMsg };
    }
  };

  const register = async (studentDetails) => {
    dispatch(startLogin());
    try {
      const response = await api.post('/auth/register', studentDetails);
      const { user, accessToken, refreshToken } = response.data;
      dispatch(successLogin({ user, accessToken, refreshToken }));
      navigate('/student/dashboard');
      return { success: true };
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Registration failed.';
      dispatch(failLogin(errMsg));
      return { success: false, error: errMsg };
    }
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    try {
      await api.post('/auth/logout', { refreshToken });
    } catch (e) {
      console.warn("Logout request failed on server side, logging out locally.");
    } finally {
      dispatch(clearAuth());
      navigate('/login');
    }
  };

  const refreshProfile = async () => {
    try {
      const response = await api.get('/students/profile');
      dispatch(editUser(response.data.data));
    } catch (e) {
      console.error('Failed to sync user profile: ', e);
    }
  };

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    refreshProfile
  };
};
