import { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import { useToast } from '../../components/ToastContext';
import { Lock, Eye, EyeOff, Loader2, ArrowLeft, Mail, KeyRound } from 'lucide-react';
import { motion } from 'framer-motion';

const ResetPassword = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();

  // Retrieve prefilled email from state if redirected from forgot password
  const prefilledEmail = location.state?.email || '';

  const [email, setEmail] = useState(prefilledEmail);
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !otp || !newPassword) {
      toast.error('Please enter all required fields');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/auth/reset-password', {
        email: email.trim(),
        otp: otp.trim(),
        newPassword
      });
      setIsSubmitting(false);
      toast.success('Password updated successfully! You can login now.');
      navigate('/login');
    } catch (err) {
      setIsSubmitting(false);
      toast.error(err.response?.data?.message || 'Password reset failed. Invalid or expired OTP.');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-white/20 dark:border-gray-800/60 relative overflow-hidden"
    >
      <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary-500 via-secondary-500 to-primary-600"></div>

      <div className="mb-6">
        <Link to="/login" className="inline-flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-primary-600 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Login
        </Link>
      </div>

      <div className="text-center mb-8">
        <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white font-sans tracking-tight">Reset Password</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Enter the verification code sent to your email and select your new password.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Email Address */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-400">
            Email Address
          </label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-primary-550 transition-colors">
              <Mail className="w-4 h-4" />
            </div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-800 rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 font-medium"
              placeholder="name@example.com"
              required
            />
          </div>
        </div>

        {/* OTP Code */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-400">
            6-Digit Verification Code (OTP)
          </label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-primary-550 transition-colors">
              <KeyRound className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              maxLength={6}
              className="w-full pl-11 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-800 rounded-2xl text-xs tracking-widest font-black focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-center text-gray-800 dark:text-white"
              placeholder="123456"
              required
            />
          </div>
        </div>

        {/* New Password */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-400">
            New Password
          </label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-primary-550 transition-colors">
              <Lock className="w-4 h-4" />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full pl-11 pr-11 py-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-800 rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 font-medium"
              placeholder="••••••••"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Confirm Password */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-400">
            Confirm New Password
          </label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-primary-550 transition-colors">
              <Lock className="w-4 h-4" />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full pl-11 pr-11 py-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-800 rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 font-medium"
              placeholder="••••••••"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3.5 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-850 text-white font-bold rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 text-xs disabled:opacity-75"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Resetting Password...
            </>
          ) : (
            'Reset Password'
          )}
        </button>
      </form>
    </motion.div>
  );
};

export default ResetPassword;
