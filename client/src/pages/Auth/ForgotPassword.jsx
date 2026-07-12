import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useToast } from '../../components/ToastContext';
import { Mail, ArrowLeft, Loader2, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const ForgotPassword = () => {
  const toast = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);
    try {
      await api.post('/auth/forgot-password', { email: email.trim() });
      setIsSubmitting(false);
      toast.success('Password reset OTP code sent to your email inbox!');
      
      // Redirect to reset password page, passing the email in state
      navigate('/reset-password', { state: { email: email.trim() } });
    } catch (err) {
      setIsSubmitting(false);
      toast.error(err.response?.data?.message || 'Failed to send recovery OTP.');
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
        <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white font-sans tracking-tight">Forgot Password</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Enter your registered email below, and we'll dispatch a 6-digit OTP code to verify your identity.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-1.5">
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-400">
            Email Address
          </label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-primary-550 transition-colors">
              <Mail className="w-5 h-5" />
            </div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-800 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 font-medium"
              placeholder="name@example.com"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3.5 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-850 text-white font-bold rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-75"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Requesting OTP...
            </>
          ) : (
            <>
              Send OTP Code <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>
    </motion.div>
  );
};

export default ForgotPassword;
