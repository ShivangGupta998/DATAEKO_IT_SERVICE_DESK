import React, { useState, useEffect, useRef } from 'react';
import {
  User as UserIcon,
  Shield,
  Mail,
  Building,
  CheckCircle2,
  Lock,
  Camera,
  Trash2,
  Phone,
  Briefcase,
  Globe,
  Bell,
  Sun,
  Moon,
  Plane,
  Save,
  KeyRound,
  Eye,
  EyeOff,
  Server,
  Send,
  Activity,
  Cpu,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { useTheme } from '../../hooks/useTheme';
import { RoleBadge } from '../../components/common/Badge';
import { authService } from '../../services/AuthService';
import { slackService } from '../../services/slackService';
import { parseApiError } from '../../api/client';
import { LoadingSpinner } from '../../components/common/LoadingState';

export const ProfilePage: React.FC = () => {
  const {
    user,
    roleId,
    roleName,
    isAdmin,
    isManager,
    isTechnician,
    refreshProfile,
    backendUrl,
    setBackendUrl,
  } = useAuth();
  const { success, error: toastError } = useToast();
  const { theme, toggleTheme } = useTheme();

  // Active Tab: 'info' | 'security' | 'preferences'
  const [activeTab, setActiveTab] = useState<'info' | 'security' | 'preferences'>('info');

  // Avatar state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarImage, setAvatarImage] = useState<string | null>(() => {
    if (user?.avatar_url) return user.avatar_url;
    if (user?.id) {
      return localStorage.getItem(`itsm_avatar_${user.id}`);
    }
    return null;
  });

  // Profile Info Form State
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phone_number || '');
  const [jobTitle, setJobTitle] = useState(user?.job_title || '');
  const [timezone, setTimezone] = useState(user?.timezone || 'UTC');
  const [isSavingInfo, setIsSavingInfo] = useState(false);

  // Security / Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Preferences State
  const [emailTicketUpdates, setEmailTicketUpdates] = useState<boolean>(() => {
    const saved = localStorage.getItem(`pref_ticket_updates_${user?.id}`);
    return saved !== null ? saved === 'true' : true;
  });
  const [emailSLABreaches, setEmailSLABreaches] = useState<boolean>(() => {
    const saved = localStorage.getItem(`pref_sla_breaches_${user?.id}`);
    return saved !== null ? saved === 'true' : true;
  });
  const [outOfOffice, setOutOfOffice] = useState<boolean>(() => {
    const saved = localStorage.getItem(`pref_ooo_${user?.id}`);
    return saved !== null ? saved === 'true' : false;
  });
  const [oooReturnDate, setOooReturnDate] = useState<string>(() => {
    return localStorage.getItem(`pref_ooo_date_${user?.id}`) || '';
  });
  const [isSavingPreferences, setIsSavingPreferences] = useState(false);

  // System Diagnostics State
  const [customUrl, setCustomUrl] = useState(backendUrl);
  const [testingSlack, setTestingSlack] = useState(false);

  // Sync state when user prop updates
  useEffect(() => {
    if (user) {
      setFullName(user.full_name || '');
      setPhoneNumber(user.phone_number || '');
      setJobTitle(user.job_title || '');
      setTimezone(user.timezone || 'UTC');

      const savedAvatar = user.avatar_url || localStorage.getItem(`itsm_avatar_${user.id}`);
      if (savedAvatar) {
        setAvatarImage(savedAvatar);
      }
    }
  }, [user]);

  // Initials generator
  const getInitials = (name?: string, username?: string) => {
    const target = name?.trim() || username?.trim() || 'USER';
    const parts = target.split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return target.slice(0, 2).toUpperCase();
  };

  const getDepartmentName = () => {
    if (!user?.department) return 'General IT';
    if (typeof user.department === 'object') return user.department.name || 'General IT';
    return user.department;
  };

  // Avatar Upload Handler
  const handleAvatarFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toastError('Invalid File', 'Please upload a valid image file (JPG, PNG, WEBP).');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toastError('File Too Large', 'Please upload an image smaller than 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      setAvatarImage(dataUrl);

      if (user?.id) {
        localStorage.setItem(`itsm_avatar_${user.id}`, dataUrl);
      }

      window.dispatchEvent(new CustomEvent('itsm:avatar-updated', { detail: { avatarUrl: dataUrl } }));

      try {
        await authService.updateProfile({ avatar_url: dataUrl });
        await refreshProfile();
        success('Profile Picture Updated', 'Your new avatar is live across the application.');
      } catch {
        // Cached in localStorage even if backend column fails
        success('Profile Picture Updated', 'Saved locally for this browser session.');
      }
    };
    reader.readAsDataURL(file);
  };

  // Avatar Removal Handler
  const handleRemovePhoto = async () => {
    setAvatarImage(null);
    if (user?.id) {
      localStorage.removeItem(`itsm_avatar_${user.id}`);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    window.dispatchEvent(new CustomEvent('itsm:avatar-updated', { detail: { avatarUrl: null } }));

    try {
      await authService.updateProfile({ avatar_url: '' });
      await refreshProfile();
      success('Profile Photo Removed', 'Default initials avatar restored.');
    } catch {
      success('Profile Photo Removed', 'Default initials avatar restored.');
    }
  };

  // Save Profile Information
  const handleSaveProfileInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingInfo(true);

    try {
      await authService.updateProfile({
        full_name: fullName.trim(),
        phone_number: phoneNumber.trim(),
        job_title: jobTitle.trim(),
        timezone: timezone.trim(),
      });
      await refreshProfile();
      success('Profile Updated', 'Personal details saved successfully.');
    } catch (err: any) {
      const parsed = parseApiError(err);
      toastError('Failed to Update Profile', parsed.message);
    } finally {
      setIsSavingInfo(false);
    }
  };

  // Change Password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPassword) {
      toastError('Validation Error', 'Please enter your current password.');
      return;
    }

    if (newPassword.length < 8) {
      toastError('Weak Password', 'New password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      toastError('Password Mismatch', 'New password and confirmation do not match.');
      return;
    }

    setIsChangingPassword(true);

    try {
      await authService.changePassword(currentPassword, newPassword);
      success('Password Changed Successfully', 'Your account credentials have been updated.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      const parsed = parseApiError(err);
      toastError('Password Change Failed', parsed.message);
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Save Preferences
  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingPreferences(true);

    if (user?.id) {
      localStorage.setItem(`pref_ticket_updates_${user.id}`, String(emailTicketUpdates));
      localStorage.setItem(`pref_sla_breaches_${user.id}`, String(emailSLABreaches));
      localStorage.setItem(`pref_ooo_${user.id}`, String(outOfOffice));
      localStorage.setItem(`pref_ooo_date_${user.id}`, oooReturnDate);
    }

    setTimeout(() => {
      setIsSavingPreferences(false);
      success('Preferences Saved', 'Notification, status, and theme settings updated.');
    }, 300);
  };

  // Slack Diagnostics Test
  const handleTestSlack = async () => {
    setTestingSlack(true);
    try {
      const res = await slackService.sendTestNotification();
      success('Slack Notification Sent', res.message || 'Notification queued successfully.');
    } catch (err: any) {
      const parsed = parseApiError(err);
      toastError('Slack Test Failed', parsed.message);
    } finally {
      setTestingSlack(false);
    }
  };

  const handleUpdateBackendUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrl.trim()) return;
    setBackendUrl(customUrl.trim());
    success('Backend API Endpoint Updated', customUrl.trim());
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      {/* 1. Profile Header & Avatar Card */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-xl relative overflow-hidden transition-colors">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-72 h-72 bg-indigo-600/10 dark:bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
          {/* Circular Avatar */}
          <div className="relative group shrink-0">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-4 border-indigo-600/20 dark:border-indigo-500/30 shadow-2xl bg-linear-to-tr from-indigo-600 to-sky-500 flex items-center justify-center text-white relative">
              {avatarImage ? (
                <img
                  src={avatarImage}
                  alt={user?.username || 'Avatar'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <svg
                  className="w-full h-full"
                  viewBox="0 0 100 100"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle cx="50" cy="50" r="50" fill="url(#avatarGradient)" />
                  <defs>
                    <linearGradient id="avatarGradient" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#4f46e5" />
                      <stop offset="1" stopColor="#0284c7" />
                    </linearGradient>
                  </defs>
                  <text
                    x="50%"
                    y="55%"
                    dominantBaseline="middle"
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize="34"
                    fontWeight="800"
                    fontFamily="system-ui, -apple-system, sans-serif"
                    letterSpacing="1"
                  >
                    {getInitials(user?.full_name, user?.username)}
                  </text>
                </svg>
              )}
            </div>

            {/* Quick Upload Hover Icon */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 p-2 rounded-full bg-indigo-600 text-white shadow-lg border-2 border-white dark:border-slate-900 hover:bg-indigo-500 transition-colors"
              title="Upload New Picture"
              aria-label="Upload New Picture"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* User Meta & Action Buttons */}
          <div className="flex-1 space-y-3 min-w-0">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {user?.full_name || user?.username}
              </h1>
              <RoleBadge roleId={roleId || 4} />
              {outOfOffice && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-700">
                  Out of Office
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-slate-600 dark:text-slate-400 font-medium">
              <span className="flex items-center gap-1.5 font-mono text-slate-700 dark:text-slate-300">
                <UserIcon className="w-3.5 h-3.5 text-indigo-500" />
                <span>@{user?.username}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-indigo-500" />
                <span>{user?.email || 'No email specified'}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-indigo-500" />
                <span>{getDepartmentName()}</span>
              </span>
            </div>

            {/* Avatar Action Buttons */}
            <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png, image/jpeg, image/jpg, image/webp"
                onChange={handleAvatarFileSelect}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition-all shadow-md shadow-indigo-600/20"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Upload New Picture</span>
              </button>

              {avatarImage && (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 border border-rose-200 dark:border-rose-900/60 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove Photo</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Tabs Bar */}
      <div className="flex items-center border-b border-slate-200 dark:border-slate-800 space-x-1 sm:space-x-3">
        <button
          type="button"
          onClick={() => setActiveTab('info')}
          className={`flex items-center gap-2 py-3 px-4 border-b-2 font-bold text-xs transition-colors ${
            activeTab === 'info'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <UserIcon className="w-4 h-4" />
          <span>Profile Info</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-2 py-3 px-4 border-b-2 font-bold text-xs transition-colors ${
            activeTab === 'security'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>Security & Password</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('preferences')}
          className={`flex items-center gap-2 py-3 px-4 border-b-2 font-bold text-xs transition-colors ${
            activeTab === 'preferences'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>Preferences & Status</span>
        </button>
      </div>

      {/* 3. Tab Contents */}
      {activeTab === 'info' && (
        <div className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xl space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <UserIcon className="w-4 h-4 text-indigo-500" />
              <span>Personal Information</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Update your public display identity and workplace contact credentials.
            </p>
          </div>

          <form onSubmit={handleSaveProfileInfo} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Abhishek Singh"
                    className="w-full pl-10 pr-3 py-2.5 text-xs bg-slate-50 dark:bg-slate-950/80 border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium"
                  />
                </div>
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Phone Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+1 (555) 019-2834"
                    className="w-full pl-10 pr-3 py-2.5 text-xs bg-slate-50 dark:bg-slate-950/80 border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium"
                  />
                </div>
              </div>

              {/* Job Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Job Title
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Briefcase className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    placeholder="e.g. Systems Administrator / IT Support Lead"
                    className="w-full pl-10 pr-3 py-2.5 text-xs bg-slate-50 dark:bg-slate-950/80 border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium"
                  />
                </div>
              </div>

              {/* Timezone */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Timezone
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Globe className="w-4 h-4" />
                  </div>
                  <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 text-xs bg-slate-50 dark:bg-slate-950/80 border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium cursor-pointer"
                  >
                    <option value="UTC">UTC (Coordinated Universal Time)</option>
                    <option value="America/New_York">Eastern Time (US & Canada)</option>
                    <option value="America/Chicago">Central Time (US & Canada)</option>
                    <option value="America/Denver">Mountain Time (US & Canada)</option>
                    <option value="America/Los_Angeles">Pacific Time (US & Canada)</option>
                    <option value="Europe/London">London (GMT / BST)</option>
                    <option value="Europe/Paris">Paris / Berlin (CET)</option>
                    <option value="Asia/Kolkata">India Standard Time (IST, UTC+5:30)</option>
                    <option value="Asia/Tokyo">Tokyo / Japan Standard Time (JST)</option>
                    <option value="Australia/Sydney">Sydney (AEST)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Read-Only Fields: Email & Role */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Read-Only System Fields
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 flex items-center justify-between">
                    <span>Work Email</span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Locked
                    </span>
                  </label>
                  <input
                    type="email"
                    disabled
                    value={user?.email || ''}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-100 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-500 dark:text-slate-400 font-medium cursor-not-allowed"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Contact your IT Administrator to change your registered email address.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 flex items-center justify-between">
                    <span>Assigned Role</span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Lock className="w-3 h-3" /> System Managed
                    </span>
                  </label>
                  <div className="flex items-center gap-3 px-3.5 py-2 text-xs bg-slate-100 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl cursor-not-allowed">
                    <RoleBadge roleId={roleId || 4} />
                    <span className="text-slate-500 font-medium">({roleName || 'Employee'})</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Role permissions are assigned and managed by IT leadership.
                  </p>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={isSavingInfo}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-50 transition-all shadow-lg shadow-indigo-600/30"
              >
                {isSavingInfo ? (
                  <>
                    <LoadingSpinner size="sm" />
                    <span>Saving Changes...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Profile Changes</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {activeTab === 'security' && (
        <div className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xl space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Lock className="w-4 h-4 text-indigo-500" />
              <span>Security & Password Management</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Keep your account secure by using a strong password of at least 8 characters.
            </p>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-4 max-w-xl">
            {/* Current Password */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Current Password *
              </label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter your current password"
                  className="w-full px-3.5 pr-10 py-2.5 text-xs bg-slate-50 dark:bg-slate-950/80 border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                New Password *
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  className="w-full px-3.5 pr-10 py-2.5 text-xs bg-slate-50 dark:bg-slate-950/80 border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Confirm New Password *
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  className={`w-full px-3.5 pr-10 py-2.5 text-xs bg-slate-50 dark:bg-slate-950/80 border rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none transition-all font-mono ${
                    confirmPassword && newPassword !== confirmPassword
                      ? 'border-rose-400 focus:border-rose-500'
                      : 'border-slate-300 dark:border-slate-800 focus:border-indigo-500'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="text-[11px] text-rose-500 font-medium mt-1">
                  Passwords do not match.
                </p>
              )}
            </div>

            <div className="pt-3">
              <button
                type="submit"
                disabled={isChangingPassword || !currentPassword || !newPassword || newPassword !== confirmPassword}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-50 transition-all shadow-lg shadow-indigo-600/30"
              >
                {isChangingPassword ? (
                  <>
                    <LoadingSpinner size="sm" />
                    <span>Updating Password...</span>
                  </>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" />
                    <span>Change Password</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {activeTab === 'preferences' && (
        <div className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xl space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Bell className="w-4 h-4 text-indigo-500" />
              <span>Application & Notification Preferences</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Customize your alerts, workflow availability status, and theme appearance.
            </p>
          </div>

          <form onSubmit={handleSavePreferences} className="space-y-6 max-w-2xl">
            {/* Theme Toggle Section */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/60 dark:border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-500 dark:text-indigo-400">
                  {theme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    Interface Theme Mode
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Currently set to <span className="font-bold uppercase">{theme}</span> mode.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={toggleTheme}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750 transition-colors shadow-xs"
              >
                Switch to {theme === 'dark' ? 'Light' : 'Dark'} Mode
              </button>
            </div>

            {/* Email Notifications */}
            <div className="space-y-3">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Notification Subscriptions
              </span>

              {/* Ticket Updates Toggle */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/60 dark:border-slate-800/80 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    Ticket Status & Comment Updates
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Receive email and pop-up alerts whenever your tickets are updated or assigned.
                  </p>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={emailTicketUpdates}
                    onChange={(e) => setEmailTicketUpdates(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600" />
                </label>
              </div>

              {/* SLA Breaches Toggle */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/60 dark:border-slate-800/80 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    SLA Warning & Breach Alerts
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Get high-priority notifications when SLA timers are nearing violation.
                  </p>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={emailSLABreaches}
                    onChange={(e) => setEmailSLABreaches(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600" />
                </label>
              </div>
            </div>

            {/* Out of Office Status */}
            <div className="space-y-3">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Workplace Availability
              </span>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/60 dark:border-slate-800/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
                      <Plane className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                        Out of Office (OOO) Status
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Signal to colleagues and managers that you are on leave or unavailable.
                      </p>
                    </div>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={outOfOffice}
                      onChange={(e) => setOutOfOffice(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600" />
                  </label>
                </div>

                {outOfOffice && (
                  <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/60 flex flex-col sm:flex-row items-center gap-3">
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-300 whitespace-nowrap">
                      Estimated Return Date:
                    </label>
                    <input
                      type="date"
                      value={oooReturnDate}
                      onChange={(e) => setOooReturnDate(e.target.value)}
                      className="px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Save Preferences Button */}
            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={isSavingPreferences}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-50 transition-all shadow-lg shadow-indigo-600/30"
              >
                {isSavingPreferences ? (
                  <>
                    <LoadingSpinner size="sm" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Preferences</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* RBAC Privileges Matrix & Diagnostic Section */}
      <div className="bg-slate-900/40 p-6 sm:p-8 rounded-3xl border border-slate-800/60 backdrop-blur-2xl shadow-xl space-y-6">
        <div>
          <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block mb-1">
            PRIVILEGE MATRIX
          </span>
          <h3 className="text-base font-extrabold text-white flex items-center gap-2">
            <Shield className="w-4 h-4 text-indigo-400" />
            <span>Role Permissions & Access Matrix</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Your account is assigned to <strong className="text-indigo-300 font-bold">{roleName} (Role ID {roleId})</strong>.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-3.5 rounded-2xl bg-slate-950/50 border border-slate-800">
            <span className="text-[11px] font-bold text-white block mb-1">Ticket Queue</span>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              {isAdmin || isManager ? 'All enterprise tickets' : isTechnician ? 'Assigned tickets' : 'Self-service tickets'}
            </p>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-950/50 border border-slate-800">
            <span className="text-[11px] font-bold text-white block mb-1">Ticket Reassignment</span>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              {isAdmin || isManager ? 'Authorized' : 'Restricted'}
            </p>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-950/50 border border-slate-800">
            <span className="text-[11px] font-bold text-white block mb-1">Asset Lifecycle</span>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              {isAdmin || isManager ? 'Manage hardware & offboarding' : 'Personal device view'}
            </p>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-950/50 border border-slate-800">
            <span className="text-[11px] font-bold text-white block mb-1">Reports & Analytics</span>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              {isAdmin || isManager ? 'Executive SLA reports' : 'Restricted'}
            </p>
          </div>
        </div>

        {/* System Endpoint & Slack Diagnostics (Collapsible or compact) */}
        <div className="pt-4 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-wider block">
              System Endpoint
            </span>
            <form onSubmit={handleUpdateBackendUrl} className="flex gap-2">
              <input
                type="text"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                className="flex-1 px-3 py-2 text-xs bg-slate-950 border border-slate-800 text-indigo-300 rounded-xl font-mono focus:outline-none"
              />
              <button
                type="submit"
                className="px-3 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shrink-0"
              >
                Update
              </button>
            </form>
          </div>

          <div className="space-y-2">
            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-wider block">
              Slack Webhook Diagnostics
            </span>
            <button
              type="button"
              onClick={handleTestSlack}
              disabled={testingSlack}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-750 rounded-xl border border-slate-700 transition-colors"
            >
              <Send className="w-3.5 h-3.5 text-indigo-400" />
              <span>{testingSlack ? 'Sending...' : 'Send Test Slack Ping'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};