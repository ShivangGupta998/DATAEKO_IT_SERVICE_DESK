import React, { useState } from 'react';
import { Star, MessageSquare, CheckCircle, Clock, Send, Loader2 } from 'lucide-react';
import { Ticket } from '../../types/ticket';
import { ticketService } from '../../services/ticketService';
import { useToast } from '../../hooks/useToast';
import { parseApiError } from '../../api/client';

interface CsatRatingCardProps {
  ticket: Ticket;
  isRequester: boolean;
  onRatingSubmitted?: (updatedTicket: Ticket) => void;
  className?: string;
}

const RATING_DEFINITIONS: Record<number, { label: string; emoji: string; color: string; ringColor: string }> = {
  1: { label: 'Very Dissatisfied', emoji: '😠', color: 'text-rose-500', ringColor: 'ring-rose-500/30 border-rose-400' },
  2: { label: 'Dissatisfied', emoji: '🙁', color: 'text-orange-500', ringColor: 'ring-orange-500/30 border-orange-400' },
  3: { label: 'Neutral', emoji: '😐', color: 'text-amber-500', ringColor: 'ring-amber-500/30 border-amber-400' },
  4: { label: 'Satisfied', emoji: '😊', color: 'text-emerald-500', ringColor: 'ring-emerald-500/30 border-emerald-400' },
  5: { label: 'Very Satisfied', emoji: '🤩', color: 'text-indigo-500', ringColor: 'ring-indigo-500/30 border-indigo-400' },
};

export const CsatRatingCard: React.FC<CsatRatingCardProps> = ({
  ticket,
  isRequester,
  onRatingSubmitted,
  className = '',
}) => {
  const { success, error: toastError } = useToast();

  const [selectedRating, setSelectedRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [feedback, setFeedback] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // CSAT is only relevant once a ticket is Resolved or Closed
  const normalizedStatus = (ticket.status || '').toLowerCase();
  const isTicketResolvedOrClosed = normalizedStatus === 'resolved' || normalizedStatus === 'closed';

  if (!isTicketResolvedOrClosed) {
    return null;
  }

  const activeRating = hoveredRating || selectedRating;

  const handleSubmitRating = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedRating === 0) {
      toastError('Rating Required', 'Please select a star rating from 1 to 5.');
      return;
    }

    setIsSubmitting(true);
    try {
      const updated = await ticketService.submitCsat(ticket.id, {
        rating: selectedRating,
        feedback: feedback.trim() || undefined,
      });
      success('Thank you for your feedback!', `Rated ${selectedRating} of 5 stars`);
      if (onRatingSubmitted) {
        onRatingSubmitted(updated);
      }
    } catch (err: any) {
      const parsed = parseApiError(err);
      toastError('Submission Failed', parsed.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCsatDate = (d?: string) => {
    if (!d) return 'Recently';
    try {
      const iso = d.endsWith('Z') || d.includes('+') ? d : `${d}Z`;
      return new Date(iso).toLocaleDateString('en-IN', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return d;
    }
  };

  // Case 1: Rating has already been submitted
  if (ticket.csat_rating) {
    const ratingMeta = RATING_DEFINITIONS[ticket.csat_rating] || {
      label: 'Rated',
      emoji: '⭐',
      color: 'text-amber-500',
      ringColor: 'border-amber-400',
    };

    return (
      <div
        className={`bg-white dark:bg-slate-900/60 backdrop-blur-2xl p-6 rounded-3xl border border-slate-300 dark:border-slate-800/80 shadow-xs dark:shadow-2xl relative overflow-hidden ${className}`}
      >
        <div className="absolute top-0 right-0 -mr-12 -mt-12 w-40 h-40 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl" role="img" aria-label="rating emoji">
              {ratingMeta.emoji}
            </span>
            <div>
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-800 dark:text-slate-200">
                Customer Satisfaction (CSAT)
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                {isRequester ? 'You rated this resolution' : 'Requester provided resolution feedback'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-black">
            <div className="flex items-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-3.5 h-3.5 ${
                    star <= (ticket.csat_rating || 0)
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-slate-300 dark:text-slate-700'
                  }`}
                />
              ))}
            </div>
            <span className="font-mono ml-1">{ticket.csat_rating}/5</span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 text-xs space-y-2">
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Sentiment: <span className="font-bold">{ratingMeta.label}</span>
            </span>
            {ticket.csat_submitted_at && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatCsatDate(ticket.csat_submitted_at)}
              </span>
            )}
          </div>

          {ticket.csat_feedback ? (
            <p className="text-slate-800 dark:text-slate-200 italic font-medium leading-relaxed pl-2 border-l-2 border-indigo-400 dark:border-indigo-500">
              "{ticket.csat_feedback}"
            </p>
          ) : (
            <p className="text-slate-400 dark:text-slate-500 italic text-[11px]">
              No additional feedback comment was submitted.
            </p>
          )}
        </div>
      </div>
    );
  }

  // Case 2: Not rated yet, but user is NOT the requester (e.g. technician or manager)
  if (!isRequester) {
    return (
      <div
        className={`bg-white dark:bg-slate-900/60 backdrop-blur-2xl p-5 rounded-3xl border border-slate-300 dark:border-slate-800/80 shadow-xs dark:shadow-2xl text-xs space-y-1.5 ${className}`}
      >
        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-bold">
          <Star className="w-4 h-4 text-amber-400" />
          <span>Customer Satisfaction (CSAT)</span>
        </div>
        <p className="text-slate-500 dark:text-slate-400 text-[11px]">
          Awaiting employee satisfaction rating. The requester will be prompted to rate this resolution.
        </p>
      </div>
    );
  }

  // Case 3: Requester prompt to submit CSAT
  return (
    <div
      className={`bg-gradient-to-br from-indigo-500/10 via-white to-amber-500/10 dark:from-indigo-950/40 dark:via-slate-900/80 dark:to-amber-950/20 backdrop-blur-2xl p-6 rounded-3xl border-2 border-indigo-400/40 dark:border-indigo-500/30 shadow-lg shadow-indigo-500/10 dark:shadow-2xl space-y-4 ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-widest mb-1.5">
            <CheckCircle className="w-3 h-3 text-emerald-500" />
            <span>Ticket {ticket.status} • Quality Review</span>
          </div>
          <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
            How satisfied are you with this resolution?
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            Your feedback directly rates technician performance and helps improve IT Service Desk speed.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmitRating} className="space-y-4">
        {/* Star Rating Buttons */}
        <div className="p-4 rounded-2xl bg-white/80 dark:bg-slate-950/70 border border-slate-300 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-center gap-2 sm:gap-4 py-2">
            {[1, 2, 3, 4, 5].map((star) => {
              const isFilled = star <= activeRating;
              return (
                <button
                  key={star}
                  type="button"
                  onClick={() => setSelectedRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  disabled={isSubmitting}
                  className="group relative p-2 sm:p-2.5 rounded-2xl transition-all duration-200 hover:scale-110 active:scale-95 focus:outline-none"
                  aria-label={`Rate ${star} stars`}
                >
                  <Star
                    className={`w-7 h-7 sm:w-8 sm:h-8 transition-colors ${
                      isFilled
                        ? 'fill-amber-400 text-amber-400 drop-shadow-sm'
                        : 'text-slate-300 dark:text-slate-700 hover:text-amber-300'
                    }`}
                  />
                  <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 text-[10px] font-mono font-bold text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    {star}
                  </span>
                </button>
              );
            })}
          </div>

          {activeRating > 0 && RATING_DEFINITIONS[activeRating] && (
            <div className="text-center transition-all animate-fadeIn">
              <span className="text-xl sm:text-2xl mr-1.5" role="img" aria-label="sentiment emoji">
                {RATING_DEFINITIONS[activeRating].emoji}
              </span>
              <span className={`text-xs font-black uppercase tracking-wider ${RATING_DEFINITIONS[activeRating].color}`}>
                {RATING_DEFINITIONS[activeRating].label}
              </span>
            </div>
          )}
        </div>

        {/* Optional Comment */}
        <div>
          <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5 uppercase text-[10px] tracking-wider flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-indigo-500" />
            <span>Optional Feedback or Suggestions</span>
          </label>
          <textarea
            rows={2}
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            disabled={isSubmitting}
            placeholder="Tell us what went well or how we can improve..."
            className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-950/80 border border-slate-300 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 font-medium resize-y"
          />
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting || selectedRating === 0}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:pointer-events-none text-white text-xs font-bold uppercase tracking-wider shadow-md shadow-indigo-600/30 transition-all hover:-translate-y-0.5 active:translate-y-0"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Submitting Rating...</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Submit CSAT Feedback</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
