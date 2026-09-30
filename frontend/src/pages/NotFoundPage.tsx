import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Layers, ShieldAlert } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center relative overflow-hidden antialiased selection:bg-indigo-500 selection:text-white">
      {/* Background ambient glowing orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-600/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-rose-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Main Glass Card */}
      <div className="relative z-10 max-w-md w-full bg-slate-900/60 backdrop-blur-2xl p-8 sm:p-10 rounded-3xl border border-slate-800/80 shadow-2xl shadow-black/80 flex flex-col items-center">
        {/* Glow icon wrapper */}
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-indigo-500/30 rounded-3xl blur-xl animate-pulse" />
          <div className="relative w-20 h-20 rounded-3xl bg-slate-950/80 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shadow-inner">
            <Layers className="w-10 h-10" />
          </div>
        </div>

        {/* Status Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] font-black uppercase tracking-widest mb-3">
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Error 404 • Invalid Route</span>
        </div>

        <h1 className="text-5xl font-black text-white tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
          404
        </h1>

        <p className="text-sm font-extrabold text-slate-200 mt-2">
          Page Not Found
        </p>

        <p className="text-xs text-slate-400 font-medium leading-relaxed max-w-xs mt-2">
          The requested resource or page route does not exist or has been relocated within the IT Service Desk portal.
        </p>

        <Link
          to="/dashboard"
          className="mt-8 inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold uppercase tracking-wider shadow-lg shadow-indigo-600/30 transition-all hover:-translate-y-0.5 active:translate-y-0"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Dashboard</span>
        </Link>
      </div>
    </div>
  );
};