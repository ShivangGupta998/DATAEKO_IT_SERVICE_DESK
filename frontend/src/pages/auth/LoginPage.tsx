import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Layers, Lock, User, Server, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { parseApiError } from '../../api/client';

export const LoginPage: React.FC = () => {
  const { login, backendUrl, setBackendUrl } = useAuth();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showServerConfig, setShowServerConfig] = useState(false);
  const [customApiUrl, setCustomApiUrl] = useState(backendUrl);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setErrorMessage('Please enter both username and password.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const user = await login(username, password);
      success('Welcome back!', `Logged in as ${user.full_name || user.username}`);
      navigate('/dashboard');
    } catch (err: any) {
      const parsed = parseApiError(err);
      setErrorMessage(parsed.message);
      toastError('Login Failed', parsed.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyServerUrl = () => {
    setBackendUrl(customApiUrl);
    setShowServerConfig(false);
    success('Backend URL updated', customApiUrl);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Subtle Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-indigo-500/10 via-transparent to-transparent pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center text-white shadow-xl shadow-indigo-500/20">
            <Layers className="w-7 h-7" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl font-bold tracking-tight text-white">
          IT Service Desk
        </h2>
        <p className="mt-1 text-center text-xs text-slate-400">
          Enterprise ITSM with Role-Based Access Control
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4 sm:px-0">
        <div className="bg-slate-800/90 backdrop-blur-md py-8 px-6 sm:px-10 shadow-2xl rounded-2xl border border-slate-700/80">
          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <span className="leading-relaxed">{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Username or Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin / employee"
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-900/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-900/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                id="login-submit-btn"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 transition-all shadow-md shadow-indigo-600/30"
              >
                {isLoading ? (
                  <span>Authenticating...</span>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Quick RBAC Role Reference for Test/Evaluation */}
          <div className="mt-6 pt-5 border-t border-slate-700/60">
            <p className="text-[11px] font-medium text-slate-400 mb-2">Supported Roles:</p>
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-700/50 text-slate-300">
                <span className="font-bold text-purple-400">Role 1: Admin</span>
                <p className="text-slate-400 text-[9px] mt-0.5">Full System Access</p>
              </div>
              <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-700/50 text-slate-300">
                <span className="font-bold text-indigo-400">Role 2: Manager</span>
                <p className="text-slate-400 text-[9px] mt-0.5">Tickets & Assets</p>
              </div>
              <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-700/50 text-slate-300">
                <span className="font-bold text-blue-400">Role 3: Technician</span>
                <p className="text-slate-400 text-[9px] mt-0.5">Assigned Resolution</p>
              </div>
              <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-700/50 text-slate-300">
                <span className="font-bold text-emerald-400">Role 4: Employee</span>
                <p className="text-slate-400 text-[9px] mt-0.5">Self-Service Portal</p>
              </div>
            </div>
          </div>

          {/* Register Link */}
          <div className="mt-5 text-center text-xs text-slate-400">
            Don't have an account?{' '}
            <Link to="/register" className="text-indigo-400 hover:text-indigo-300 font-semibold">
              Register here
            </Link>
          </div>

          {/* Backend Connection Config Drawer */}
          <div className="mt-5 pt-4 border-t border-slate-700/40 text-center">
            <button
              type="button"
              onClick={() => setShowServerConfig(!showServerConfig)}
              className="inline-flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-slate-200 transition-colors"
            >
              <Server className="w-3.5 h-3.5 text-indigo-400" />
              <span>Backend API: {backendUrl}</span>
            </button>

            {showServerConfig && (
              <div className="mt-3 p-3 rounded-xl bg-slate-900/80 border border-slate-700 text-left">
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  FastAPI Server URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customApiUrl}
                    onChange={(e) => setCustomApiUrl(e.target.value)}
                    className="flex-1 px-2.5 py-1.5 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white font-mono"
                    placeholder="http://127.0.0.1:8000"
                  />
                  <button
                    type="button"
                    onClick={handleApplyServerUrl}
                    className="px-3 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg"
                  >
                    Apply
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
