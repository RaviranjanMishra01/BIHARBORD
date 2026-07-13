import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../components/ToastContext';
import { DISTRICTS } from '../../constants';
import api from '../../services/api';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

const Register = () => {
  const { register } = useAuth();
  const toast = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // OTP State
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    rollNumber: '',
    schoolName: '',
    district: '',
    block: '',
    mobileNumber: '',
    parentName: '',
    parentMobile: '',
    otp: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validateEmail = (emailVal) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal);
  };

  // Trigger registration OTP dispatch
  const handleSendRegisterOtp = async () => {
    const trimmedEmail = formData.email.trim();
    if (!trimmedEmail) {
      toast.error('Please enter an email address first');
      return;
    }
    if (!validateEmail(trimmedEmail)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsSendingOtp(true);
    try {
      await api.post('/auth/send-otp', { email: trimmedEmail, purpose: 'register' });
      setOtpSent(true);
      toast.success('Verification OTP code sent to your email inbox!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send OTP.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const trimmedEmail = formData.email.trim();
    const trimmedName = formData.fullName.trim();

    // Validations
    if (!trimmedName || !trimmedEmail || !formData.password) {
      toast.error('Name, Email and Password are required');
      return;
    }

    if (!validateEmail(trimmedEmail)) {
      toast.error('Please enter a valid email address');
      return;
    }

    if (!formData.otp) {
      toast.error('Please verify your email using OTP code first');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.mobileNumber && formData.mobileNumber.length !== 10) {
      toast.error('Mobile Number must be a valid 10-digit number');
      return;
    }

    if (formData.parentMobile && formData.parentMobile.length !== 10) {
      toast.error('Parent Mobile Number must be a valid 10-digit number');
      return;
    }

    setIsSubmitting(true);
    const result = await register({
      fullName: trimmedName,
      email: trimmedEmail,
      password: formData.password,
      rollNumber: formData.rollNumber.trim(),
      schoolName: formData.schoolName.trim(),
      district: formData.district,
      block: formData.block.trim(),
      mobileNumber: formData.mobileNumber.trim(),
      parentName: formData.parentName.trim(),
      parentMobile: formData.parentMobile.trim(),
      otp: formData.otp.trim()
    });
    setIsSubmitting(false);

    if (result.success) {
      toast.success('Registration successful! Welcome to the portal.');
    } else {
      toast.error(result.error);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-white/20 dark:border-gray-800/60 max-h-[85vh] overflow-y-auto relative"
    >
      <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary-500 via-secondary-500 to-primary-600"></div>

      <div className="text-center mb-8">
        <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white font-sans tracking-tight">
          Create Account
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
          Register for BSEB Class 10 preparation portal
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Personal Details */}
        <h3 className="text-xs font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400 border-b border-gray-150 dark:border-gray-800 pb-1.5">
          1. Basic & Security Details
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-bold text-gray-400 dark:text-gray-500 mb-1">Full Name *</label>
            <input
              type="text"
              name="fullName"
              required
              value={formData.fullName}
              onChange={handleChange}
              placeholder="Rahul Kumar"
              className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-850 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 font-medium"
            />
          </div>
          
          {/* Email Address with Send OTP Trigger */}
          <div>
            <label className="block text-[11px] font-bold text-gray-400 dark:text-gray-500 mb-1">Email Address *</label>
            <div className="flex gap-2">
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="rahul@example.com"
                className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-855 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 font-medium"
              />
              <button
                type="button"
                onClick={handleSendRegisterOtp}
                disabled={isSendingOtp || !formData.email}
                className="px-4 py-2 bg-secondary-600 hover:bg-secondary-700 text-white rounded-xl text-[10px] font-extrabold whitespace-nowrap transition-all shadow-md shadow-secondary-500/10 disabled:opacity-50"
              >
                {isSendingOtp ? 'Sending...' : otpSent ? 'Resend' : 'Send Code'}
              </button>
            </div>
          </div>

          {/* Registration Verification OTP */}
          {otpSent && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="md:col-span-2"
            >
              <label className="block text-[11px] font-bold text-gray-400 dark:text-gray-500 mb-1">6-Digit Email OTP *</label>
              <input
                type="text"
                name="otp"
                required
                value={formData.otp}
                onChange={handleChange}
                placeholder="Paste code here"
                maxLength={6}
                className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-855 rounded-xl text-sm tracking-widest font-black focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-center text-gray-855 dark:text-white"
              />
            </motion.div>
          )}

          <div>
            <label className="block text-[11px] font-bold text-gray-400 dark:text-gray-500 mb-1">Password *</label>
            <input
              type="password"
              name="password"
              required
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-855 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 font-medium"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-gray-400 dark:text-gray-500 mb-1">Confirm Password *</label>
            <input
              type="password"
              name="confirmPassword"
              required
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-855 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 font-medium"
            />
          </div>
        </div>

        {/* Step 2: BSEB Metric Info */}
        <h3 className="text-xs font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400 border-b border-gray-150 dark:border-gray-800 pb-1.5 pt-2">
          2. Bihar Board Registration
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-bold text-gray-400 dark:text-gray-500 mb-1">Roll Number</label>
            <input
              type="text"
              name="rollNumber"
              value={formData.rollNumber}
              onChange={handleChange}
              placeholder="e.g. 260012"
              className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-855 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 font-medium"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-[11px] font-bold text-gray-400 dark:text-gray-500 mb-1">School Name</label>
            <input
              type="text"
              name="schoolName"
              value={formData.schoolName}
              onChange={handleChange}
              placeholder="e.g. Zila High School, Patna"
              className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-855 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 font-medium"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-gray-400 dark:text-gray-500 mb-1">District</label>
            <select
              name="district"
              value={formData.district}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-855 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 font-medium"
            >
              <option value="">Select District</option>
              {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-gray-400 dark:text-gray-500 mb-1">Block (प्रखंड)</label>
            <input
              type="text"
              name="block"
              value={formData.block}
              onChange={handleChange}
              placeholder="e.g. Patna Sadar"
              className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-855 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 font-medium"
            />
          </div>
        </div>

        {/* Step 3: Contact & Parent Details */}
        <h3 className="text-xs font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400 border-b border-gray-150 dark:border-gray-800 pb-1.5 pt-2">
          3. Contact & Parent Info
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-bold text-gray-400 dark:text-gray-500 mb-1">Mobile Number</label>
            <input
              type="text"
              name="mobileNumber"
              value={formData.mobileNumber}
              onChange={handleChange}
              placeholder="10 digit number"
              className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-855 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 font-medium"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-gray-400 dark:text-gray-500 mb-1">Parent Name</label>
            <input
              type="text"
              name="parentName"
              value={formData.parentName}
              onChange={handleChange}
              placeholder="Father's/Mother's name"
              className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-855 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 font-medium"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-[11px] font-bold text-gray-400 dark:text-gray-500 mb-1">Parent Mobile Number</label>
            <input
              type="text"
              name="parentMobile"
              value={formData.parentMobile}
              onChange={handleChange}
              placeholder="Parent's mobile number"
              className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-855 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 font-medium"
            />
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-805 text-white font-bold py-3.5 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 text-sm mt-4 disabled:opacity-75"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Registering Account...
            </>
          ) : (
            'Register'
          )}
        </button>
      </form>

      <p className="text-sm text-center text-gray-500 dark:text-gray-400 mt-6">
        Already have an account?{' '}
        <Link to="/login" className="font-bold text-primary-600 dark:text-primary-400 hover:underline">
          Sign In
        </Link>
      </p>
    </motion.div>
  );
};

export default Register;
