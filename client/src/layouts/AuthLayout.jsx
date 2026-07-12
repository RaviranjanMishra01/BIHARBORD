import { Outlet, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';

const AuthLayout = () => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  // If already authenticated, redirect to respective dashboard
  if (isAuthenticated && user) {
    if (user.role === 'admin') {
      return <Navigate to="/admin/dashboard" replace />;
    } else {
      return <Navigate to="/student/dashboard" replace />;
    }
  }

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* Left Column - Decorative Info Panel (Hidden on mobile/tablet) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-tr from-primary-700 to-secondary-700 text-white p-12 flex-col justify-between relative overflow-hidden">
        {/* Background micro circles */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-x-12 -translate-y-12"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl translate-x-12 translate-y-12"></div>

        <div className="flex items-center gap-3 relative z-10">
          <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <span className="text-2xl font-bold tracking-tight font-sans">BSEB Class 10 Portal</span>
        </div>

        <div className="my-auto max-w-md relative z-10">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl font-extrabold leading-tight mb-6"
          >
            बिहार बोर्ड मैट्रिक परीक्षा की तैयारी, अब हुई आसान!
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-lg text-primary-100 mb-8"
          >
            Practice chapter-wise quizzes, attempt full syllabus mock tests, track progress in real-time, and compete on the state-wide leaderboard.
          </motion.p>
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/10">
              <h3 className="text-3xl font-bold">10,000+</h3>
              <p className="text-sm text-primary-200">Practice Questions</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/10">
              <h3 className="text-3xl font-bold">100%</h3>
              <p className="text-sm text-primary-200">Syllabus Covered</p>
            </div>
          </div>
        </div>

        <div className="text-sm text-primary-200 relative z-10">
          © 2026 Bihar School Examination Board Support Portal. All rights reserved.
        </div>
      </div>

      {/* Right Column - Authentication Forms */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md">
          {/* Mobile logo header */}
          <div className="flex lg:hidden items-center justify-center gap-2 mb-8">
            <div className="bg-primary-600 p-2 rounded-lg text-white">
              <BookOpen className="w-6 h-6" />
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">BSEB Class 10 Portal</span>
          </div>
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
