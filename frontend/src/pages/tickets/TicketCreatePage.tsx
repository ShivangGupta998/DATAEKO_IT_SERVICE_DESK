import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, AlertCircle, Send, HelpCircle } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { ticketService } from '../../services/ticketService';
import { TicketPriority, TicketCategory } from '../../types/ticket';
import { parseApiError } from '../../api/client';

export const TicketCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string>('hardware');
  const [priority, setPriority] = useState<string>('medium');
  const source = 'portal';
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMessage('Please provide a descriptive ticket title.');
      return;
    }
    if (!description.trim()) {
      setErrorMessage('Please provide detailed information in the issue description.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const created = await ticketService.createTicket({
        title: title.trim(),
        description: description.trim(),
        category: category.toLowerCase() as TicketCategory,
        priority: priority.toLowerCase() as TicketPriority,
        source: source.toLowerCase(),
      });

      success('Ticket Created Successfully', `#${created.id} - ${created.title}`);
      navigate(`/tickets/${created.id}`);
    } catch (err: any) {
      const parsed = parseApiError(err);
      setErrorMessage(parsed.message);
      toastError('Failed to create ticket', parsed.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 antialiased selection:bg-indigo-500 selection:text-white pb-12 transition-colors duration-300">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          to="/tickets"
          className="p-2.5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-xs dark:shadow-md active:scale-95 shrink-0"
          title="Go Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Create New Support Ticket
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            Submit a service request or incident report to the IT helpdesk.
          </p>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-400 text-xs flex items-start gap-3 shadow-xs">
          <AlertCircle className="w-4 h-4 text-rose-500 dark:text-rose-400 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Light & Dark Form Card */}
      <form
        onSubmit={handleSubmit}
        className="relative bg-white dark:bg-slate-900/60 backdrop-blur-2xl p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs dark:shadow-2xl dark:shadow-black/80 space-y-6 overflow-hidden"
      >
        {/* Title */}
        <div className="relative z-10">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
            Subject / Ticket Title *
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Laptop battery failing rapidly or Unable to connect to VPN"
            className="w-full px-4 py-3 text-xs bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium"
          />
        </div>

        {/* Category & Priority */}
        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
              Category *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-3 text-xs bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-semibold cursor-pointer"
            >
              <option value="hardware" className="bg-white dark:bg-slate-900">Hardware (Laptops, Monitors, Peripherals)</option>
              <option value="software" className="bg-white dark:bg-slate-900">Software (OS, Productivity Tools, License)</option>
              <option value="network" className="bg-white dark:bg-slate-900">Network & VPN (Wi-Fi, DNS, Remote Access)</option>
              <option value="access" className="bg-white dark:bg-slate-900">Access & Permissions (Accounts, Repos, IAM)</option>
              <option value="security" className="bg-white dark:bg-slate-900">Security Incident (Suspicious Email, MFA)</option>
              <option value="general" className="bg-white dark:bg-slate-900">General IT Inquiry</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
              Urgency / Priority *
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full px-4 py-3 text-xs bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-semibold cursor-pointer"
            >
              <option value="low" className="bg-white dark:bg-slate-900">Low - General query or non-blocking issue</option>
              <option value="medium" className="bg-white dark:bg-slate-900">Medium - Standard workflow impairment</option>
              <option value="high" className="bg-white dark:bg-slate-900">High - Work blocked, multiple affected</option>
              <option value="critical" className="bg-white dark:bg-slate-900">Critical - Major business outage / Severity 1</option>
            </select>
          </div>
        </div>

        {/* Description */}
        <div className="relative z-10">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
            Detailed Problem Description *
          </label>
          <textarea
            rows={6}
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Please detail: 1) What happened? 2) Steps to reproduce? 3) Any error messages? 4) Hardware/Device model if applicable..."
            className="w-full px-4 py-3 text-xs bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all resize-y leading-relaxed font-medium"
          />
        </div>

        {/* SLA Information Notice */}
        <div className="relative z-10 p-4 rounded-xl bg-indigo-50/60 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 flex items-start gap-3 text-xs text-indigo-900 dark:text-indigo-200">
          <HelpCircle className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-bold text-indigo-950 dark:text-indigo-100">Automated SLA Response Targets</p>
            <p className="text-[11px] text-indigo-700/80 dark:text-indigo-300/80 leading-relaxed">
              Based on your selected priority, this ticket will be assigned a strict SLA resolution deadline in accordance with enterprise policies.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="relative z-10 flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800/80">
          <button
            type="button"
            onClick={() => navigate('/tickets')}
            disabled={isSubmitting}
            className="px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold uppercase tracking-wider shadow-md shadow-indigo-600/20 transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50"
          >
            {isSubmitting ? (
              <span>Submitting...</span>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Submit Ticket</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};