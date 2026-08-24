import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, AlertCircle, Send, HelpCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { ticketService } from '../../services/ticketService';
import { TicketPriority, TicketCategory } from '../../types/ticket';
import { parseApiError } from '../../api/client';

export const TicketCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string>('hardware');
  const [priority, setPriority] = useState<string>('medium');
  const [source, setSource] = useState('portal');
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
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          to="/tickets"
          className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Create New Support Ticket</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Submit a service request or incident report to the IT helpdesk.
          </p>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-6"
      >
        {/* Title */}
        <div>
          <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
            Subject / Ticket Title *
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Laptop battery failing rapidly or Unable to connect to VPN"
            className="w-full px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-hidden"
          />
        </div>

        {/* Category & Priority */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
              Category *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-hidden font-medium"
            >
              <option value="hardware">Hardware (Laptops, Monitors, Peripherals)</option>
              <option value="software">Software (OS, Productivity Tools, License)</option>
              <option value="network">Network & VPN (Wi-Fi, DNS, Remote Access)</option>
              <option value="access">Access & Permissions (Accounts, Repos, IAM)</option>
              <option value="security">Security Incident (Suspicious Email, MFA)</option>
              <option value="general">General IT Inquiry</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
              Urgency / Priority *
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-hidden font-medium"
            >
              <option value="low">Low - General query or non-blocking issue</option>
              <option value="medium">Medium - Standard workflow impairment</option>
              <option value="high">High - Work blocked, multiple affected</option>
              <option value="critical">Critical - Major business outage / Severity 1</option>
            </select>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
            Detailed Problem Description *
          </label>
          <textarea
            rows={6}
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Please detail: 1) What happened? 2) Steps to reproduce? 3) Any error messages? 4) Hardware/Device model if applicable..."
            className="w-full px-4 py-3 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-hidden resize-y leading-relaxed"
          />
        </div>

        {/* SLA Information Notice */}
        <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-900/60 flex items-start gap-3 text-xs text-indigo-900 dark:text-indigo-200">
          <HelpCircle className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold">Automated SLA Response Targets</p>
            <p className="text-[11px] text-indigo-700 dark:text-indigo-300 leading-relaxed">
              Based on your selected priority, this ticket will be assigned a strict SLA resolution deadline in accordance with enterprise policies.
            </p>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={() => navigate('/tickets')}
            disabled={isSubmitting}
            className="px-4 py-2.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-md shadow-indigo-600/30 disabled:opacity-50 transition-all"
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