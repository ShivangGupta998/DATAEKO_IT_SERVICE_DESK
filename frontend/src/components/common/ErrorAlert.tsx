import React, { useState } from 'react';
import { AlertCircle, Server, RefreshCw, CheckCircle2, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../api/client';

interface ErrorAlertProps {
  error: {
    message: string;
    statusCode?: number;
    isNetworkError?: boolean;
  } | string | null;
  onRetry?: () => void;
  className?: string;
}

export const ErrorAlert: React.FC<ErrorAlertProps> = ({ error, onRetry, className = '' }) => {
  const { backendUrl, setBackendUrl } = useAuth();
  const [customUrl, setCustomUrl] = useState(backendUrl);
  const [isEditingUrl, setIsEditingUrl] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  if (!error) return null;

  const errorMessage = typeof error === 'string' ? error : error.message;
  const is403 = typeof error === 'object' && error?.statusCode === 403;
  const isNetwork = typeof error === 'object' && (error?.isNetworkError || !error?.statusCode);

  const testConnection = async (urlToTest: string) => {
    setTestingConnection(true);
    setTestResult(null);
    try {
      // Test the root or swagger docs endpoint
      await apiClient.get('/', { baseURL: urlToTest, timeout: 4000 });
      setTestResult({ success: true, message: 'Connected successfully to backend!' });
    } catch (err: any) {
      if (err.response) {
        // HTTP response received, meaning server is reachable
        setTestResult({ success: true, message: `Connected (HTTP ${err.response.status})` });
      } else {
        setTestResult({ success: false, message: 'Could not reach server. Verify it is running.' });
      }
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSaveUrl = () => {
    setBackendUrl(customUrl);
    setIsEditingUrl(false);
    if (onRetry) onRetry();
  };

  if (is403) {
    return (
      <div className={`p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 flex items-start gap-3 ${className}`}>
        <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div>
          <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-200">Access Restricted</h4>
          <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
            You do not have permission to perform this action.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 ${className}`}>
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-rose-900 dark:text-rose-200">
            {isNetwork ? 'Backend Connection Error' : 'Request Failed'}
          </h4>
          <p className="text-xs text-rose-700 dark:text-rose-300 mt-1 leading-relaxed">{errorMessage}</p>

          {isNetwork && (
            <div className="mt-3 pt-3 border-t border-rose-200 dark:border-rose-900/60 text-xs">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-slate-600 dark:text-slate-400 font-medium">Target Backend:</span>
                <code className="px-2 py-0.5 rounded-md bg-rose-100 dark:bg-rose-900/50 text-rose-800 dark:text-rose-200 font-mono text-xs">
                  {backendUrl}
                </code>
                <button
                  type="button"
                  onClick={() => setIsEditingUrl(!isEditingUrl)}
                  className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium ml-1"
                >
                  {isEditingUrl ? 'Cancel' : 'Change URL'}
                </button>
              </div>

              {isEditingUrl && (
                <div className="mt-2.5 flex items-center gap-2 flex-wrap sm:flex-nowrap">
                  <input
                    type="text"
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                    placeholder="http://127.0.0.1:8000"
                    className="px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 flex-1 min-w-[200px]"
                  />
                  <button
                    type="button"
                    onClick={() => testConnection(customUrl)}
                    disabled={testingConnection}
                    className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium hover:bg-slate-300 transition-colors"
                  >
                    {testingConnection ? 'Testing...' : 'Test'}
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveUrl}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors"
                  >
                    Save & Reconnect
                  </button>
                </div>
              )}

              {testResult && (
                <div
                  className={`mt-2 flex items-center gap-1.5 text-xs ${
                    testResult.success ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {testResult.success ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                  {testResult.message}
                </div>
              )}
            </div>
          )}

          {onRetry && (
            <div className="mt-3">
              <button
                type="button"
                onClick={onRetry}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Retry Request
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
