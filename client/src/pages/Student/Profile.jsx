import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';
import { useToast } from '../../components/ToastContext';
import { DISTRICTS } from '../../constants';
import { User, Lock, Upload, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

const Profile = () => {
  const { user, refreshProfile } = useAuth();
  const toast = useToast();

  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Profile Form state
  const [profileData, setProfileData] = useState({
    fullName: user?.fullName || '',
    schoolName: user?.schoolName || '',
    district: user?.district || '',
    block: user?.block || '',
    section: user?.section || '',
    mobileNumber: user?.mobileNumber || '',
    parentName: user?.parentName || '',
    parentMobile: user?.parentMobile || '',
    profilePhoto: user?.profilePhoto || ''
  });

  // Password state
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleProfileChange = (e) => {
    setProfileData({ ...profileData, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  // Image Upload handler (Base64 converter)
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Image size must be less than 2MB');
        return;
      }
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = () => {
        setProfileData(prev => ({ ...prev, profilePhoto: reader.result }));
      };
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      await api.put('/students/profile', profileData);
      await refreshProfile(); // Refresh context
      setIsSavingProfile(false);
      toast.success('Profile settings updated!');
    } catch (err) {
      setIsSavingProfile(false);
      toast.error(err.response?.data?.message || 'Failed to update settings.');
    }
  };

  const handleChangePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    setIsChangingPassword(true);
    try {
      await api.put('/auth/change-password', {
        oldPassword: passwordData.oldPassword,
        newPassword: passwordData.newPassword
      });
      setIsChangingPassword(false);
      setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
      toast.success('Password changed successfully!');
    } catch (err) {
      setIsChangingPassword(false);
      toast.error(err.response?.data?.message || 'Password update failed.');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Left Panel: Profile Picture & Security summary */}
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-2xl p-6 shadow-sm text-center">
          <div className="relative w-28 h-28 mx-auto mb-4 group">
            {profileData.profilePhoto ? (
              <img
                src={profileData.profilePhoto}
                alt="Profile"
                className="w-full h-full rounded-full object-cover border-2 border-primary-500"
              />
            ) : (
              <div className="w-full h-full rounded-full bg-primary-100 dark:bg-primary-950/40 text-primary-750 font-bold text-3xl flex items-center justify-center border-2 border-primary-300">
                {user?.fullName.slice(0, 2).toUpperCase()}
              </div>
            )}
            
            {/* Upload hover label */}
            <label className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white text-[10px] font-bold uppercase">
              <Upload className="w-4 h-4 mr-1" /> Upload
              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            </label>
          </div>

          <h3 className="font-extrabold text-lg text-gray-850 dark:text-white">{user?.fullName}</h3>
          <span className="text-xs text-gray-400 block mt-1">Roll No: {user?.rollNumber || 'Not assigned'}</span>

          <div className="border-t border-gray-100 dark:border-gray-850 pt-4 mt-6 text-left text-xs text-gray-500 space-y-2">
            <div className="flex justify-between">
              <span>Class Section:</span>
              <strong className="text-gray-800 dark:text-gray-200">10-{user?.section || 'A'}</strong>
            </div>
          </div>
        </div>

        {/* Change Password Panel */}
        <div className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
          <h3 className="font-bold text-base flex items-center gap-2 mb-4"><Lock className="w-5 h-5 text-primary-500" /> Change Password</h3>
          
          <form onSubmit={handleChangePasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Current Password</label>
              <input
                type="password"
                required
                value={passwordData.oldPassword}
                onChange={handlePasswordChange}
                name="oldPassword"
                placeholder="••••••••"
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-850 border border-gray-250 dark:border-gray-700 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">New Password</label>
              <input
                type="password"
                required
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
                name="newPassword"
                placeholder="••••••••"
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-855 border border-gray-250 dark:border-gray-700 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Confirm New Password</label>
              <input
                type="password"
                required
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange}
                name="confirmPassword"
                placeholder="••••••••"
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-855 border border-gray-250 dark:border-gray-700 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>

            <button
              type="submit"
              disabled={isChangingPassword}
              className="w-full py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-xs font-bold shadow transition-all flex items-center justify-center gap-1.5"
            >
              {isChangingPassword ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Update Password'}
            </button>
          </form>
        </div>
      </div>

      {/* Right Panel: Detailed Profile settings forms */}
      <div className="lg:col-span-2 bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
        <h3 className="font-bold text-base flex items-center gap-2 mb-6 border-b border-gray-100 dark:border-gray-850 pb-3"><User className="w-5 h-5 text-primary-500" /> Student Profile Details</h3>

        <form onSubmit={handleSaveProfile} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Full Name</label>
              <input
                type="text"
                name="fullName"
                required
                value={profileData.fullName}
                onChange={handleProfileChange}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-850 border border-gray-250 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">School Name</label>
              <input
                type="text"
                name="schoolName"
                value={profileData.schoolName}
                onChange={handleProfileChange}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-855 border border-gray-250 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">District</label>
              <select
                name="district"
                value={profileData.district}
                onChange={handleProfileChange}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-850 border border-gray-250 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
              >
                <option value="">Select District</option>
                {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Block (प्रखंड)</label>
              <input
                type="text"
                name="block"
                value={profileData.block}
                onChange={handleProfileChange}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-855 border border-gray-250 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Section</label>
              <input
                type="text"
                name="section"
                value={profileData.section}
                onChange={handleProfileChange}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-855 border border-gray-250 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Mobile Number</label>
              <input
                type="text"
                name="mobileNumber"
                value={profileData.mobileNumber}
                onChange={handleProfileChange}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-855 border border-gray-250 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
          </div>

          <h4 className="text-xs font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400 border-b border-gray-100 dark:border-gray-850 pb-1 pt-2">
            Parents Contact Details
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Parent Name</label>
              <input
                type="text"
                name="parentName"
                value={profileData.parentName}
                onChange={handleProfileChange}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-855 border border-gray-250 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Parent Mobile Number</label>
              <input
                type="text"
                name="parentMobile"
                value={profileData.parentMobile}
                onChange={handleProfileChange}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-855 border border-gray-250 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={isSavingProfile}
              className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold shadow-md shadow-primary-500/10 hover:shadow-lg transition-all flex items-center gap-1.5"
            >
              {isSavingProfile ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>

    </div>
  );
};

export default Profile;
