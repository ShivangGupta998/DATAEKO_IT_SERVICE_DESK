import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, Lock, User, Mail, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useTheme } from '../../context/ThemeContext';
import { ThemeToggle } from '../../components/common/ThemeToggle';
import { parseApiError } from '../../api/client';
import { UserRole } from '../../types/auth';

export const RegisterPage: React.FC = () => {
  const { register, login } = useAuth();
  const { success, error: toastError } = useToast();
  const { theme } = useTheme();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [roleId, setRoleId] = useState<number>(UserRole.EMPLOYEE);
  const [departmentId, setDepartmentId] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // High-Contrast Particle Wave Animation (Adapts to Light/Dark Mode)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    const numRows = 32;
    const numCols = 55;
    const separation = 45;
    let count = 0;

    const render = () => {
      ctx.fillStyle = theme === 'dark' ? '#090d16' : '#f1f5f9';
      ctx.fillRect(0, 0, width, height);

      count += 0.025;
      const startX = (width - numCols * separation) / 2;
      const startY = height / 3.2;

      for (let ix = 0; ix < numCols; ix++) {
        for (let iy = 0; iy < numRows; iy++) {
          const yOffset =
            Math.sin((ix + count) * 0.3) * 45 + Math.sin((iy + count) * 0.4) * 45;

          const perspective = 0.4 + (iy / numRows) * 0.8;
          const px = startX + ix * separation * perspective + (width / 2 - startX) * (1 - perspective);
          const py = startY + iy * 22 + yOffset * perspective;
          const radius = Math.max(0.8, 2.2 * perspective);

          const alpha = Math.min(0.9, Math.max(0.2, (iy / numRows) * 0.85));

          ctx.beginPath();
          ctx.arc(px, py, radius, 0, Math.PI * 2);

          ctx.fillStyle = theme === 'dark' 
            ? `rgba(129, 140, 248, ${alpha})` 
            : `rgba(79, 70, 229, ${alpha * 0.75})`;
          ctx.fill();
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [theme]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !email.trim() || !password) {
      setErrorMessage('Please fill in all required fields.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      await register({
        username: username.trim(),
        email: email.trim(),
        full_name: fullName.trim() || undefined,
        password,
        role_id: Number(roleId) || 4,
        department_id: Number(departmentId) || 1,
      });

      success('Account created successfully!', 'Signing you in...');
      try {
        await login(username.trim(), password);
        navigate('/dashboard');
      } catch {
        navigate('/login');
      }
    } catch (err: any) {
      const parsed = parseApiError(err);
      setErrorMessage(parsed.message);
      toastError('Registration Failed', parsed.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col justify-center py-10 sm:px-6 lg:px-8 relative overflow-hidden transition-colors duration-300">
      {/* Top Left Branding */}
      <div className="absolute top-6 left-8 z-20 flex items-center gap-2.5 select-none">
        <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
        <span className="text-xl font-black tracking-[0.35em] text-indigo-600 dark:text-[#4d7cff]">
          DATAEKO AI
        </span>
      </div>

      {/* Top Right Controls */}
      <div className="absolute top-6 right-8 z-20">
        <ThemeToggle />
      </div>

      {/* Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-0" />

      {/* Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center">
        <div className="inline-flex w-12 h-12 rounded-2xl bg-indigo-600 text-white items-center justify-center shadow-lg shadow-indigo-500/30 mb-3">
          <ShieldCheck className="w-7 h-7" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          IT Service Desk
        </h2>
        <p className="text-xs text-slate-700 dark:text-slate-400 mt-1 font-semibold">
          Enterprise ITSM with Role-Based Access Control
        </p>
      </div>

      {/* Form Container */}
      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4 sm:px-0">
        <div className="bg-white/95 dark:bg-slate-900/90 backdrop-blur-md py-8 px-6 sm:px-10 shadow-2xl rounded-2xl border border-slate-200/90 dark:border-slate-800 transition-colors duration-300">
          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
              <span className="leading-relaxed font-medium">{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">Username *</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. john.doe"
                  className="w-full pl-10 pr-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-all font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">Work Email *</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full pl-10 pr-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-all font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Alex Smith"
                className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-all font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">Password *</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  className="w-full pl-10 pr-10 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-all font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors focus:outline-none"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">Role</label>
                <select
                  value={roleId}
                  onChange={(e) => setRoleId(parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-all font-medium"
                >
                  <option value={UserRole.ADMIN}>Admin</option>
                  <option value={UserRole.MANAGER}>Manager</option>
                  <option value={UserRole.TECHNICIAN}>Technician</option>
                  <option value={UserRole.EMPLOYEE}>Employee</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">Department</label>
                <select
                  value={departmentId}
                  onChange={(e) => setDepartmentId(parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-all font-medium"
                >
                  <option value={1}>Engineering</option>
                  <option value={2}>IT Support</option>
                  <option value={3}>Human Resources</option>
                  <option value={4}>Finance</option>
                </select>
              </div>
            </div>

            <div className="pt-3">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-600/50 disabled:opacity-50 transition-all shadow-md shadow-indigo-600/20"
              >
                {isLoading ? <span>Registering...</span> : <span>Create Account</span>}
              </button>
            </div>
          </form>

          <div className="mt-5 text-center text-xs text-slate-700 dark:text-slate-400 font-semibold">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-600 dark:text-indigo-400 hover:underline font-bold transition-colors">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};