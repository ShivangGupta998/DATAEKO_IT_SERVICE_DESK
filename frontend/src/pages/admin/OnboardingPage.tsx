import React, { useState, useEffect, useCallback } from 'react';
import {
  UserPlus,
  Users,
  ShieldCheck,
  Mail,
  User as UserIcon,
  KeyRound,
  Eye,
  EyeOff,
  Copy,
  Check,
  RefreshCw,
  Search,
  Sparkles,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { adminService, AdminUserItem } from '../../services/adminService';
import { parseApiError } from '../../api/client';
import { RoleBadge } from '../../components/common/Badge';
import { LoadingSpinner, TableSkeleton } from '../../components/common/LoadingState';
import { UserRole } from '../../types/auth';

export const OnboardingPage: React.FC = () => {
  const { user: currentUser, roleId } = useAuth();
  const { success, error: toastError } = useToast();

  const [activeTab, setActiveTab] = useState<'onboard' | 'directory'>('onboard');

  // Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [departmentId, setDepartmentId] = useState<number>(1);
  const [selectedRoleId, setSelectedRoleId] = useState<number>(UserRole.EMPLOYEE);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Status State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [createdCredentials, setCreatedCredentials] = useState<{
    user: AdminUserItem;
    tempPassword: string;
  } | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Directory State
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Dropdown Options
  const [departments, setDepartments] = useState<{ id: number; name: string }[]>([
    { id: 1, name: 'IT' },
    { id: 2, name: 'HR' },
    { id: 3, name: 'Finance' },
    { id: 4, name: 'Operations' },
  ]);

  const isAdmin = roleId === UserRole.ADMIN;

  // Generate strong random password
  const generateRandomPassword = useCallback(() => {
    const uppercase = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const lowercase = 'abcdefghijkmnopqrstuvwxyz';
    const numbers = '23456789';
    const symbols = '!@#$%^&*-_+=';

    const allChars = uppercase + lowercase + numbers + symbols;
    let result = '';

    // Guarantee at least 1 of each category
    result += uppercase[Math.floor(Math.random() * uppercase.length)];
    result += lowercase[Math.floor(Math.random() * lowercase.length)];
    result += numbers[Math.floor(Math.random() * numbers.length)];
    result += symbols[Math.floor(Math.random() * symbols.length)];

    for (let i = 4; i < 12; i++) {
      result += allChars[Math.floor(Math.random() * allChars.length)];
    }

    // Shuffle characters
    const shuffled = result
      .split('')
      .sort(() => 0.5 - Math.random())
      .join('');

    setPassword(shuffled);
    setShowPassword(true);
  }, []);

  // Auto-suggest username from email or full name
  const handleAutoFillUsername = () => {
    if (email && email.includes('@')) {
      const emailPrefix = email.split('@')[0].toLowerCase().replace(/[^a-z0-9._-]/g, '');
      if (emailPrefix) {
        setUsername(emailPrefix);
        return;
      }
    }
    if (fullName.trim()) {
      const parts = fullName.trim().toLowerCase().split(/\s+/);
      if (parts.length >= 2) {
        setUsername(`${parts[0][0]}${parts[1]}`.replace(/[^a-z0-9._-]/g, ''));
      } else {
        setUsername(parts[0].replace(/[^a-z0-9._-]/g, ''));
      }
    }
  };

  // Fetch departments & users
  const fetchDirectory = useCallback(async () => {
    setIsLoadingUsers(true);
    try {
      const [usersData, deptsData] = await Promise.all([
        adminService.getUsers(),
        adminService.getDepartments(),
      ]);
      setUsers(usersData || []);
      if (deptsData && deptsData.length > 0) {
        setDepartments(deptsData);
      }
    } catch (err: any) {
      const parsed = parseApiError(err);
      toastError('Failed to load user directory', parsed.message);
    } finally {
      setIsLoadingUsers(false);
    }
  }, [toastError]);

  useEffect(() => {
    fetchDirectory();
  }, [fetchDirectory]);

  // Form submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedUsername = username.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPassword = password.trim();

    if (!trimmedUsername || !trimmedEmail || !trimmedPassword) {
      setErrorMessage('Please fill in all required fields (Username, Email, Password).');
      return;
    }

    if (trimmedPassword.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }

    setIsSubmitting(true);

    try {
      const createdUser = await adminService.createUser({
        username: trimmedUsername,
        email: trimmedEmail,
        full_name: fullName.trim() || undefined,
        password: trimmedPassword,
        role_id: selectedRoleId,
        department_id: departmentId,
      });

      // Show success toast with created credentials info
      success(
        'User Onboarded Successfully!',
        `Account created for ${createdUser.username} (${createdUser.role}).`
      );

      // Record credentials for card display
      setCreatedCredentials({
        user: createdUser,
        tempPassword: trimmedPassword,
      });

      // Refresh directory list in background
      fetchDirectory();
    } catch (err: any) {
      const parsed = parseApiError(err);
      setErrorMessage(parsed.message);
      toastError('Onboarding Failed', parsed.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset form to onboard another user
  const handleOnboardAnother = () => {
    setFullName('');
    setEmail('');
    setUsername('');
    setPassword('');
    setCreatedCredentials(null);
    setErrorMessage(null);
    setSelectedRoleId(UserRole.EMPLOYEE);
    setActiveTab('onboard');
  };

  // Copy to clipboard helper
  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => {
      setCopiedKey(null);
    }, 2000);
  };

  // Format full welcome credential email / message
  const getFullCredentialMessage = () => {
    if (!createdCredentials) return '';
    const { user, tempPassword } = createdCredentials;
    return (
      `Hello ${user.full_name || user.username},\n\n` +
      `Your IT Service Desk account has been provisioned:\n` +
      `• Portal URL: ${window.location.origin}/login\n` +
      `• Username: ${user.username}\n` +
      `• Email: ${user.email}\n` +
      `• Temporary Password: ${tempPassword}\n` +
      `• Role: ${user.role}\n` +
      `• Department: ${user.department || 'General'}\n\n` +
      `Please sign in and update your password upon first login.`
    );
  };

  // Filtered users for directory view
  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase();
    return (
      u.username.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.full_name && u.full_name.toLowerCase().includes(q)) ||
      (u.role && u.role.toLowerCase().includes(q)) ||
      (u.department && u.department.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-200 dark:border-indigo-800/50 shadow-inner">
            <UserPlus className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Employee Onboarding & User Management
            </h1>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-0.5">
              Provision role-based employee accounts and issue secure initial access credentials.
            </p>
          </div>
        </div>

        {/* Tab Toggle */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-950/80 rounded-xl border border-slate-200 dark:border-slate-800 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('onboard')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'onboard'
                ? 'bg-white dark:bg-indigo-600 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Onboard User</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('directory');
              fetchDirectory();
            }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'directory'
                ? 'bg-white dark:bg-indigo-600 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>User Directory</span>
            <span className="px-1.5 py-0.2 rounded-md bg-slate-200 dark:bg-slate-800 text-[10px] font-black text-slate-700 dark:text-slate-300">
              {users.length}
            </span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {activeTab === 'onboard' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Form & Success Card */}
          <div className="lg:col-span-8 space-y-6">
            {/* Success Credential Card (When User is Created) */}
            {createdCredentials && (
              <div className="p-6 rounded-2xl bg-emerald-50/90 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-600/60 shadow-xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-md">
                      <Check className="w-5 h-5 stroke-[3]" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        Account Successfully Provisioned!
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-emerald-300 font-medium">
                        Share these initial credentials securely with the employee.
                      </p>
                    </div>
                  </div>
                  <RoleBadge roleId={createdCredentials.user.role_id} />
                </div>

                {/* Credential Data Box */}
                <div className="mt-4 p-4 rounded-xl bg-white/95 dark:bg-slate-900/90 border border-emerald-200 dark:border-emerald-900/50 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500 font-semibold">Full Name:</span>
                    <span className="font-bold text-slate-800 dark:text-white">
                      {createdCredentials.user.full_name || 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500 font-semibold">Username:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                        {createdCredentials.user.username}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(createdCredentials.user.username, 'cred-username')}
                        className="p-1 hover:text-indigo-600 text-slate-400 transition-colors"
                        title="Copy Username"
                      >
                        {copiedKey === 'cred-username' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500 font-semibold">Work Email:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {createdCredentials.user.email}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(createdCredentials.user.email, 'cred-email')}
                        className="p-1 hover:text-indigo-600 text-slate-400 transition-colors"
                        title="Copy Email"
                      >
                        {copiedKey === 'cred-email' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500 font-semibold">Initial Password:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/80 px-2.5 py-0.5 rounded border border-indigo-200 dark:border-indigo-800">
                        {createdCredentials.tempPassword}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(createdCredentials.tempPassword, 'cred-pw')}
                        className="p-1 hover:text-indigo-600 text-slate-400 transition-colors"
                        title="Copy Password"
                      >
                        {copiedKey === 'cred-pw' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-semibold">Department:</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {createdCredentials.user.department || 'General'}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleCopy(getFullCredentialMessage(), 'cred-full')}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition-all shadow-md shadow-indigo-600/20"
                  >
                    {copiedKey === 'cred-full' ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Copied Welcome Email!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Full Credentials Note</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleOnboardAnother}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 transition-all"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Onboard Another User</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('directory');
                      fetchDirectory();
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 transition-all ml-auto"
                  >
                    <span>View User Directory</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Onboarding Form */}
            <div className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xl transition-all">
              <div className="mb-6 pb-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <UserPlus className="w-4 h-4 text-indigo-500" />
                    <span>User Account Information</span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    All fields marked with an asterisk (*) are mandatory.
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    Operating as:{' '}
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {currentUser?.username} ({isAdmin ? 'Admin' : 'Manager'})
                    </span>
                  </span>
                </div>
              </div>

              {errorMessage && (
                <div className="mb-6 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 text-xs flex items-start gap-2.5">
                  <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="font-medium leading-relaxed">{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Full Name & Work Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                        placeholder="e.g. Alex Morgan"
                        className="w-full pl-10 pr-3 py-2.5 text-xs bg-slate-50 dark:bg-slate-950/80 border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Work Email *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="alex.morgan@company.com"
                        className="w-full pl-10 pr-3 py-2.5 text-xs bg-slate-50 dark:bg-slate-950/80 border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium"
                      />
                    </div>
                  </div>
                </div>

                {/* Username with Auto-Fill helper */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      System Username *
                    </label>
                    {(email || fullName) && (
                      <button
                        type="button"
                        onClick={handleAutoFillUsername}
                        className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>Suggest from Name/Email</span>
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-bold text-xs">
                      @
                    </div>
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="alex.morgan"
                      className="w-full pl-10 pr-3 py-2.5 text-xs bg-slate-50 dark:bg-slate-950/80 border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium font-mono"
                    />
                  </div>
                </div>

                {/* Department & Role Dropdowns */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Department *
                    </label>
                    <select
                      value={departmentId}
                      onChange={(e) => setDepartmentId(Number(e.target.value))}
                      className="w-full px-3 py-2.5 text-xs bg-slate-50 dark:bg-slate-950/80 border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium cursor-pointer"
                    >
                      {departments.map((dept) => (
                        <option key={dept.id} value={dept.id}>
                          {dept.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Assigned Role *
                    </label>
                    <select
                      value={selectedRoleId}
                      onChange={(e) => setSelectedRoleId(Number(e.target.value))}
                      className="w-full px-3 py-2.5 text-xs bg-slate-50 dark:bg-slate-950/80 border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium cursor-pointer"
                    >
                      <option value={UserRole.EMPLOYEE}>Employee (Standard User)</option>
                      <option value={UserRole.TECHNICIAN}>Technician (IT Support Staff)</option>
                      <option value={UserRole.MANAGER}>Manager (Department Lead)</option>
                      {isAdmin && <option value={UserRole.ADMIN}>Administrator (Full System Control)</option>}
                    </select>
                  </div>
                </div>

                {/* Initial/Temporary Password with Generator */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Initial / Temporary Password *
                    </label>
                    <button
                      type="button"
                      onClick={generateRandomPassword}
                      className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 flex items-center gap-1.5 transition-colors"
                    >
                      <KeyRound className="w-3 h-3" />
                      <span>Generate Random Password</span>
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min. 8 characters or click Generate"
                      className="w-full px-3.5 pr-20 py-2.5 text-xs bg-slate-50 dark:bg-slate-950/80 border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono font-medium"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-2 gap-1">
                      {password && (
                        <button
                          type="button"
                          onClick={() => handleCopy(password, 'input-pw')}
                          className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                          title="Copy Password"
                        >
                          {copiedKey === 'input-pw' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                        title={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-medium">
                    The user will be prompted to use these credentials on their initial login.
                  </p>
                </div>

                {/* Form Buttons */}
                <div className="pt-3 flex items-center justify-between gap-4 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={handleOnboardAnother}
                    className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    Clear Form
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-50 transition-all shadow-lg shadow-indigo-600/30 dark:shadow-indigo-600/40"
                  >
                    {isSubmitting ? (
                      <>
                        <LoadingSpinner size="sm" />
                        <span>Provisioning Account...</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" />
                        <span>Complete Onboarding</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Right Column: Roles & Policies Info Card */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-500" />
                <span>Role Permissions Guide</span>
              </h3>

              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/60 dark:border-slate-800/80">
                  <div className="flex items-center gap-2 mb-1">
                    <RoleBadge roleId={UserRole.EMPLOYEE} />
                    <span className="font-bold text-slate-800 dark:text-slate-200">Standard Access</span>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
                    Submit support tickets, view personal ticket status, access assigned assets, and read knowledge base articles.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/60 dark:border-slate-800/80">
                  <div className="flex items-center gap-2 mb-1">
                    <RoleBadge roleId={UserRole.TECHNICIAN} />
                    <span className="font-bold text-slate-800 dark:text-slate-200">IT Support Staff</span>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
                    Manage ticket queues, triage incidents, assign hardware/software assets, and fulfill technical access requests.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/60 dark:border-slate-800/80">
                  <div className="flex items-center gap-2 mb-1">
                    <RoleBadge roleId={UserRole.MANAGER} />
                    <span className="font-bold text-slate-800 dark:text-slate-200">Department Lead</span>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
                    Approve access & offboarding requests, view operational SLA reports, and onboard staff within the organization.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/60 dark:border-slate-800/80">
                  <div className="flex items-center gap-2 mb-1">
                    <RoleBadge roleId={UserRole.ADMIN} />
                    <span className="font-bold text-slate-800 dark:text-slate-200">Super Administrator</span>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
                    Full system configuration, global asset lifecycle, SLA management, and administrative role provisioning.
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Stat Card */}
            <div className="bg-linear-to-br from-indigo-600 to-sky-700 text-white p-6 rounded-3xl shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-100">
                  System Directory
                </span>
                <Users className="w-4 h-4 text-indigo-200" />
              </div>
              <div className="text-3xl font-black">{users.length}</div>
              <p className="text-xs text-indigo-100/90 leading-relaxed font-medium">
                Active registered personnel currently provisioned in the enterprise database.
              </p>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('directory');
                  fetchDirectory();
                }}
                className="w-full mt-2 py-2 px-3 bg-white/15 hover:bg-white/25 rounded-xl text-xs font-bold text-white transition-colors text-center"
              >
                Browse Directory →
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* User Directory Tab View */
        <div className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xl overflow-hidden">
          {/* Directory Toolbar */}
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search users by name, username, email, role..."
                className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 transition-all font-medium"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={fetchDirectory}
                disabled={isLoadingUsers}
                className="p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white bg-slate-100 dark:bg-slate-800 transition-colors"
                title="Refresh Directory"
              >
                <RefreshCw className={`w-4 h-4 ${isLoadingUsers ? 'animate-spin' : ''}`} />
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('onboard')}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition-all shadow-md shadow-indigo-600/20"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Onboard New</span>
              </button>
            </div>
          </div>

          {/* Table */}
          {isLoadingUsers ? (
            <div className="p-6">
              <TableSkeleton rows={6} columns={5} />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                {searchQuery ? 'No matching users found' : 'No users currently in directory'}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {searchQuery ? 'Try adjusting your search criteria' : 'Click Onboard User to add your first team member.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/40 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-5">User</th>
                    <th className="py-3 px-5">Username</th>
                    <th className="py-3 px-5">Role</th>
                    <th className="py-3 px-5">Department</th>
                    <th className="py-3 px-5">Status</th>
                    <th className="py-3 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                  {filteredUsers.map((u) => (
                    <tr
                      key={u.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-linear-to-br from-indigo-500 to-sky-600 text-white font-bold flex items-center justify-center text-xs shadow-xs">
                            {(u.full_name || u.username).slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white">
                              {u.full_name || u.username}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400">
                              {u.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-5 font-mono text-slate-700 dark:text-slate-300">
                        @{u.username}
                      </td>
                      <td className="py-3.5 px-5">
                        <RoleBadge roleId={u.role_id} />
                      </td>
                      <td className="py-3.5 px-5 text-slate-700 dark:text-slate-300">
                        {u.department || 'General'}
                      </td>
                      <td className="py-3.5 px-5">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            u.is_active
                              ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800'
                              : 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-400 border border-rose-300 dark:border-rose-800'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${u.is_active ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                          {u.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <button
                          type="button"
                          onClick={() => handleCopy(u.email, `table-email-${u.id}`)}
                          className="px-2.5 py-1 text-[11px] font-bold rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors inline-flex items-center gap-1"
                          title="Copy Email"
                        >
                          {copiedKey === `table-email-${u.id}` ? (
                            <Check className="w-3 h-3 text-emerald-500" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                          <span>Copy Email</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
