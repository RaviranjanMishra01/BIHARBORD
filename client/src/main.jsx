import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { store } from './redux/store';
import { ToastProvider } from './components/ToastContext';
import './index.css';

// Layouts
import AuthLayout from './layouts/AuthLayout';
import StudentLayout from './layouts/StudentLayout';
import AdminLayout from './layouts/AdminLayout';

// Auth Pages
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import ForgotPassword from './pages/Auth/ForgotPassword';
import ResetPassword from './pages/Auth/ResetPassword';

// Student Pages
import StudentDashboard from './pages/Student/Dashboard';
import MyTests from './pages/Student/MyTests';
import AttemptTest from './pages/Student/AttemptTest';
import ResultPage from './pages/Student/ResultPage';
import ReviewAnswers from './pages/Student/ReviewAnswers';
import Leaderboard from './pages/Student/Leaderboard';
import Progress from './pages/Student/Progress';
import Profile from './pages/Student/Profile';

// Admin Pages
import AdminDashboard from './pages/Admin/Dashboard';
import StudentsManagement from './pages/Admin/StudentsManagement';
import QuestionBank from './pages/Admin/QuestionBank';
import TestManagement from './pages/Admin/TestManagement';
import ResultsManagement from './pages/Admin/ResultsManagement';
import AuditLogs from './pages/Admin/AuditLogs';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1
    }
  }
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <BrowserRouter>
            <Routes>
              {/* Root Redirect to Login */}
              <Route path="/" element={<Navigate to="/login" replace />} />

              {/* Authentication Routes */}
              <Route element={<AuthLayout />}>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password/:token" element={<ResetPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
              </Route>

              {/* Student Panel Routes */}
              <Route path="/student" element={<StudentLayout />}>
                <Route path="dashboard" element={<StudentDashboard />} />
                <Route path="tests" element={<MyTests />} />
                <Route path="attempt/:id" element={<AttemptTest />} />
                <Route path="results/:id" element={<ResultPage />} />
                <Route path="results/:id/review" element={<ReviewAnswers />} />
                <Route path="leaderboard" element={<Leaderboard />} />
                <Route path="progress" element={<Progress />} />
                <Route path="profile" element={<Profile />} />
              </Route>

              {/* Admin Panel Routes */}
              <Route path="/admin" element={<AdminLayout />}>
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="students" element={<StudentsManagement />} />
                <Route path="questions" element={<QuestionBank />} />
                <Route path="tests" element={<TestManagement />} />
                <Route path="results" element={<ResultsManagement />} />
                <Route path="audit-logs" element={<AuditLogs />} />
              </Route>

              {/* Fallback 404 Route redirect to Login */}
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </BrowserRouter>
        </ToastProvider>
      </QueryClientProvider>
    </Provider>
  </React.StrictMode>
);
