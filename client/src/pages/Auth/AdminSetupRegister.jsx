import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import { useToast } from '../../components/ToastContext';
import { User, Mail, Lock, KeyRound, Loader2, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

const AdminSetupRegister = () => {
  const toast = useToast();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    secretToken: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/auth/setup-super-admin-bseb-portal-2026', {
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        password: formData.password,
        secretToken: formData.secretToken.trim()
      });
      setIsSubmitting(false);
      toast.success('Super Admin registered successfully! Default admin deleted.');
      navigate('/login');
    } catch (err) {
      setIsSubmitting(false);
      if (err.response?.status === 404) {
        toast.error('Invalid setup token or Admin already configured.');
      } else {
        toast.error(err.response?.data?.message || 'Admin setup failed.');
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-white/20 dark:border-gray-800/60 relative overflow-hidden max-w-md w-full mx-auto"
    >
      <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-red-500 via-amber-500 to-red-600"></div>

      <div className="mb-6">
        <Link to="/login" className="inline-flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-red-550 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Login
        </Link>
      </div>

      <div className="text-center mb-8">
        <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white font-sans tracking-tight">Admin System Init</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Initialize your customized Super Administrator credentials.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Full Name */}
        <div className="space-y-1.5">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">Full Name</label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-red-550 transition-colors">
              <User className="w-4 h-4" />
            </div>
            <input
              type="text"
              name="fullName"
              required
              value={formData.fullName}
              onChange={handleChange}
              className="w-full pl-11 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-800 rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 font-medium"
              placeholder="Administrator Name"
            />
          </div>
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">Email Address</label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-red-550 transition-colors">
              <Mail className="w-4 h-4" />
            </div>
            <input
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="w-full pl-11 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-800 rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 font-medium"
              placeholder="admin@example.com"
            />
          </div>
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">Password</label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-red-550 transition-colors">
              <Lock className="w-4 h-4" />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              required
              value={formData.password}
              onChange={handleChange}
              className="w-full pl-11 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-800 rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 font-medium"
              placeholder="••••••••"
            />
          </div>
        </div>

        {/* Confirm Password */}
        <div className="space-y-1.5">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">Confirm Password</label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-red-550 transition-colors">
              <Lock className="w-4 h-4" />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              name="confirmPassword"
              required
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full pl-11 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-800 rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 font-medium"
              placeholder="••••••••"
            />
          </div>
        </div>

        {/* Secret Setup Token */}
        <div className="space-y-1.5">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">Security Token</label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-red-550 transition-colors">
              <KeyRound className="w-4 h-4" />
            </div>
            <input
              type="text"
              name="secretToken"
              required
              value={formData.secretToken}
              onChange={handleChange}
              className="w-full pl-11 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-800 rounded-2xl text-xs font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
              placeholder="Enter security initialization token"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full mt-2 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 text-xs disabled:opacity-75"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Registering Admin...
            </>
          ) : (
            'Setup Administrator'
          )}
        </button>
      </form>
    </motion.div>
  );
};

export default AdminSetupRegister;
