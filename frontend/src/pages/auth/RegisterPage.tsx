import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ShieldCheck,
  Lock,
  Mail,
  User,
  AlertCircle,
  Eye,
  EyeOff,
  Building,
  Briefcase,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { ThemeToggle } from '../../components/common/ThemeToggle';
import { parseApiError } from '../../api/client';
import { UserRole } from '../../types/auth';

interface Point {
  x: number;
  y: number;
}

interface FloatingCircuit {
  path: Point[];
  baseX: number;
  baseY: number;
  terminalRadius: number;
  glowColor: string;
  depth: number;
  pulseProgress: number;
  pulseSpeed: number;
  floatSpeedX: number;
  floatSpeedY: number;
  floatPhase: number;
}

interface Particle {
  x: number;
  y: number;
  radius: number;
  alpha: number;
  vx: number;
  vy: number;
  pulseSpeed: number;
}

export const RegisterPage: React.FC = () => {
  const { register, login } = useAuth();
  const { success, error: toastError } = useToast();
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
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });

  // Animated Interactive Circuit Canvas Effect
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
      initCircuits();
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.targetX = (e.clientX - width / 2) * 0.08;
      mouseRef.current.targetY = (e.clientY - height / 2) * 0.08;
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);

    let circuits: FloatingCircuit[] = [];

    const initCircuits = () => {
      circuits = [];
      const totalCircuits = 38;

      const hubs: Point[] = [
        { x: width * 0.1, y: height * 0.85 },
        { x: width * 0.9, y: height * 0.15 },
        { x: width * 0.85, y: height * 0.85 },
        { x: width * 0.02, y: height * 0.7 },
        { x: width * 0.95, y: height * 0.5 },
        { x: width * 0.5, y: height * 0.9 },
      ];

      for (let i = 0; i < totalCircuits; i++) {
        const hub = hubs[i % hubs.length];
        const depth = Math.random() * 0.7 + 0.3;

        let currentX = hub.x + (Math.random() - 0.5) * 160;
        let currentY = hub.y + (Math.random() - 0.5) * 160;

        const path: Point[] = [{ x: 0, y: 0 }];
        const segments = Math.floor(Math.random() * 4) + 3;
        let lastDirection: 'H' | 'V' = Math.random() > 0.5 ? 'H' : 'V';

        let relX = 0;
        let relY = 0;

        for (let s = 0; s < segments; s++) {
          const len = Math.random() * 160 + 50;
          if (lastDirection === 'H') {
            relX += (Math.random() > 0.5 ? 1 : -1) * len;
            lastDirection = 'V';
          } else {
            relY += (Math.random() > 0.5 ? 1 : -1) * len;
            lastDirection = 'H';
          }
          path.push({ x: relX, y: relY });
        }

        circuits.push({
          path,
          baseX: currentX,
          baseY: currentY,
          terminalRadius: Math.random() * 3 + 3.5,
          glowColor: Math.random() > 0.35 ? '#0284c7' : '#4f46e5',
          depth,
          pulseProgress: Math.random(),
          pulseSpeed: Math.random() * 0.005 + 0.002,
          floatSpeedX: (Math.random() - 0.5) * 0.0015,
          floatSpeedY: (Math.random() - 0.5) * 0.0015,
          floatPhase: Math.random() * Math.PI * 2,
        });
      }
    };

    initCircuits();

    const particles: Particle[] = [];
    for (let i = 0; i < 75; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 2 + 1,
        alpha: Math.random() * 0.5 + 0.2,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        pulseSpeed: Math.random() * 0.02 + 0.005,
      });
    }

    let tick = 0;

    const getPointAlongPath = (path: Point[], progress: number) => {
      let totalLen = 0;
      const lens: number[] = [];

      for (let i = 0; i < path.length - 1; i++) {
        const dx = path[i + 1].x - path[i].x;
        const dy = path[i + 1].y - path[i].y;
        const l = Math.sqrt(dx * dx + dy * dy);
        lens.push(l);
        totalLen += l;
      }

      let target = progress * totalLen;
      let accum = 0;

      for (let i = 0; i < lens.length; i++) {
        if (accum + lens[i] >= target) {
          const segP = (target - accum) / lens[i];
          return {
            x: path[i].x + (path[i + 1].x - path[i].x) * segP,
            y: path[i].y + (path[i + 1].y - path[i].y) * segP,
          };
        }
        accum += lens[i];
      }

      return path[path.length - 1];
    };

    const render = () => {
      tick++;

      const isDarkMode = document.documentElement.classList.contains('dark');

      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.05;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.05;

      const px = mouseRef.current.x;
      const py = mouseRef.current.y;

      const bg = ctx.createRadialGradient(
        width / 2 + px * 2,
        height / 2 + py * 2,
        100,
        width / 2,
        height / 2,
        Math.max(width, height)
      );

      if (isDarkMode) {
        bg.addColorStop(0, '#091830');
        bg.addColorStop(0.6, '#050d1a');
        bg.addColorStop(1, '#02060d');
      } else {
        bg.addColorStop(0, '#ffffff');
        bg.addColorStop(0.7, '#f8fafc');
        bg.addColorStop(1, '#e2e8f0');
      }

      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, height);

      // Dust Particles
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        const pAlpha = Math.min(0.85, Math.max(0.15, p.alpha + Math.sin(tick * p.pulseSpeed) * 0.2));

        ctx.save();
        ctx.beginPath();
        ctx.arc(p.x + px * 0.2, p.y + py * 0.2, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = isDarkMode
          ? `rgba(56, 189, 248, ${pAlpha})`
          : `rgba(2, 132, 199, ${pAlpha})`;
        ctx.shadowColor = isDarkMode ? '#38bdf8' : '#0284c7';
        ctx.shadowBlur = 6;
        ctx.fill();
        ctx.restore();
      });

      // Circuit Lines
      circuits.forEach((circuit) => {
        circuit.pulseProgress = (circuit.pulseProgress + circuit.pulseSpeed) % 1;
        circuit.floatPhase += 0.01;

        const floatX = Math.sin(circuit.floatPhase) * 16 * circuit.depth;
        const floatY = Math.cos(circuit.floatPhase * 0.8) * 16 * circuit.depth;

        const originX = circuit.baseX + floatX + px * circuit.depth;
        const originY = circuit.baseY + floatY + py * circuit.depth;

        ctx.save();
        ctx.beginPath();

        for (let i = 0; i < circuit.path.length; i++) {
          const pt = circuit.path[i];
          const absX = originX + pt.x;
          const absY = originY + pt.y;

          if (i === 0) ctx.moveTo(absX, absY);
          else ctx.lineTo(absX, absY);
        }

        ctx.strokeStyle = isDarkMode
          ? `rgba(38, 90, 160, ${0.4 * circuit.depth})`
          : `rgba(15, 23, 42, ${0.45 * circuit.depth})`;
        ctx.lineWidth = isDarkMode ? 1.5 * circuit.depth : 1.8 * circuit.depth;
        ctx.stroke();

        ctx.strokeStyle = isDarkMode
          ? `rgba(56, 189, 248, ${0.15 * circuit.depth})`
          : `rgba(2, 132, 199, ${0.25 * circuit.depth})`;
        ctx.lineWidth = 3.2 * circuit.depth;
        ctx.stroke();

        // Node Start
        const startPt = circuit.path[0];
        const startX = originX + startPt.x;
        const startY = originY + startPt.y;
        const nodePulse = Math.sin(tick * 0.04 + circuit.floatPhase) * 2;

        ctx.beginPath();
        ctx.arc(startX, startY, (circuit.terminalRadius + nodePulse) * circuit.depth, 0, Math.PI * 2);
        ctx.fillStyle = isDarkMode ? '#061528' : '#ffffff';
        ctx.strokeStyle = isDarkMode ? '#38bdf8' : '#0f172a';
        ctx.lineWidth = isDarkMode ? 1.5 : 2;
        ctx.shadowColor = isDarkMode ? '#38bdf8' : '#0284c7';
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.stroke();

        // Node End
        const endPt = circuit.path[circuit.path.length - 1];
        const endX = originX + endPt.x;
        const endY = originY + endPt.y;

        ctx.beginPath();
        ctx.arc(endX, endY, (circuit.terminalRadius + 2.5) * circuit.depth, 0, Math.PI * 2);
        ctx.fillStyle = isDarkMode ? '#040d1a' : '#ffffff';
        ctx.strokeStyle = isDarkMode ? '#818cf8' : '#0369a1';
        ctx.lineWidth = isDarkMode ? 1.7 : 2.2;
        ctx.shadowColor = isDarkMode ? '#818cf8' : '#0284c7';
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.stroke();

        // Pulse Tracer
        const pulsePt = getPointAlongPath(circuit.path, circuit.pulseProgress);
        const pulseX = originX + pulsePt.x;
        const pulseY = originY + pulsePt.y;

        ctx.beginPath();
        ctx.arc(pulseX, pulseY, (isDarkMode ? 2.8 : 3.2) * circuit.depth, 0, Math.PI * 2);
        ctx.fillStyle = isDarkMode ? '#ffffff' : '#0284c7';
        ctx.shadowColor = isDarkMode ? '#38bdf8' : '#0284c7';
        ctx.shadowBlur = 14;
        ctx.fill();

        ctx.restore();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !email.trim() || !password) {
      setErrorMessage('Please fill in all required fields.');
      return;
    }

    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
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
        role_id: Number(roleId) || UserRole.EMPLOYEE,
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center py-10 sm:px-6 lg:px-8 relative overflow-hidden transition-colors duration-300 select-none">
      {/* Dynamic Animated Canvas Background */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full z-0 pointer-events-none" />

      {/* Top Left Branding */}
      <div className="absolute top-7 left-9 z-20 flex items-center pointer-events-auto">
        <div className="relative flex items-center group cursor-pointer">
          <div className="relative z-10 flex items-center">
            <img
              src="/logo.png"
              alt="DATAEKO logo"
              className="h-10 w-auto object-contain transition-all duration-300 group-hover:scale-105
                brightness-0 contrast-200
                dark:brightness-200 dark:contrast-100 dark:drop-shadow-[0_0_16px_rgba(56,189,248,0.95)]"
            />
          </div>
        </div>
      </div>

      {/* Top Right Controls */}
      <div className="absolute top-6 right-8 z-20 pointer-events-auto">
        <ThemeToggle />
      </div>

      {/* Header Container */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center pointer-events-none">
        <div className="inline-flex w-12 h-12 rounded-2xl bg-indigo-600 dark:bg-indigo-600/90 text-white items-center justify-center shadow-lg shadow-indigo-500/25 dark:shadow-sky-500/30 mb-3 border border-indigo-400/30 dark:border-sky-400/30 backdrop-blur-md">
          <ShieldCheck className="w-7 h-7" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white drop-shadow-sm dark:drop-shadow-md">
          IT Service Desk
        </h2>
        <p className="text-xs text-slate-600 dark:text-sky-200/80 mt-1 font-semibold tracking-wide">
          Enterprise ITSM with Role-Based Access Control
        </p>
      </div>

      {/* Register Form Card */}
      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4 sm:px-0">
        <div className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-2xl py-8 px-6 sm:px-10 shadow-2xl dark:shadow-[0_0_50px_rgba(0,0,0,0.85)] rounded-3xl border border-slate-200/90 dark:border-sky-500/30 transition-all duration-300 hover:border-indigo-400/60 dark:hover:border-sky-400/50">
          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500 dark:text-rose-400" />
              <span className="leading-relaxed font-medium">{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                Username *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. john.doe"
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-950/90 border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 dark:focus:border-sky-500 focus:ring-1 focus:ring-indigo-500 dark:focus:ring-sky-500 transition-all font-medium"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
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
                  placeholder="name@company.com"
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-950/90 border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 dark:focus:border-sky-500 focus:ring-1 focus:ring-indigo-500 dark:focus:ring-sky-500 transition-all font-medium"
                />
              </div>
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Alex Smith"
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-950/90 border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 dark:focus:border-sky-500 focus:ring-1 focus:ring-indigo-500 dark:focus:ring-sky-500 transition-all font-medium"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                Password *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  className="w-full pl-10 pr-10 py-2.5 text-sm bg-slate-50 dark:bg-slate-950/90 border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 dark:focus:border-sky-500 focus:ring-1 focus:ring-indigo-500 dark:focus:ring-sky-500 transition-all font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors focus:outline-none"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Role & Department Dropdowns */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                  Role
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Briefcase className="w-3.5 h-3.5" />
                  </div>
                  <select
                    value={roleId}
                    onChange={(e) => setRoleId(parseInt(e.target.value, 10))}
                    className="w-full pl-9 pr-2 py-2 text-xs bg-slate-50 dark:bg-slate-950/90 border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 dark:focus:border-sky-500 transition-all font-medium cursor-pointer"
                  >
                    <option value={UserRole.ADMIN}>Admin</option>
                    <option value={UserRole.MANAGER}>Manager</option>
                    <option value={UserRole.TECHNICIAN}>Technician</option>
                    <option value={UserRole.EMPLOYEE}>Employee</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                  Department
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Building className="w-3.5 h-3.5" />
                  </div>
                  <select
                    value={departmentId}
                    onChange={(e) => setDepartmentId(parseInt(e.target.value, 10))}
                    className="w-full pl-9 pr-2 py-2 text-xs bg-slate-50 dark:bg-slate-950/90 border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 dark:focus:border-sky-500 transition-all font-medium cursor-pointer"
                  >
                    <option value={1}>Engineering</option>
                    <option value={2}>IT Support</option>
                    <option value={3}>Human Resources</option>
                    <option value={4}>Finance</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 disabled:opacity-50 transition-all shadow-lg shadow-indigo-600/30 dark:shadow-indigo-600/40"
              >
                {isLoading ? <span>Creating Account...</span> : <span>Create Account</span>}
              </button>
            </div>
          </form>

          {/* Footer Link */}
          <div className="mt-5 text-center text-xs text-slate-500 dark:text-slate-400 font-semibold">
            Already have an account?{' '}
            <Link
              to="/login"
              className="text-indigo-600 dark:text-sky-400 hover:underline font-bold transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};