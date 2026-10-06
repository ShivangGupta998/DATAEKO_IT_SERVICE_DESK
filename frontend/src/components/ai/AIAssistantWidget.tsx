import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bot,
  Sparkles,
  X,
  Send,
  ArrowRight,
  Ticket,
  UserPlus,
  Shield,
  Laptop,
  Settings,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  Lock,
  Key,
  Loader2,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import {
  aiService,
  getClientGeminiApiKey,
  setClientGeminiApiKey,
  AIChatAction,
} from '../../services/aiService';

interface ActionCTA {
  label: string;
  path: string;
  primary?: boolean;
}

interface GuideData {
  id: string;
  title: string;
  category?: string;
  isRestricted?: boolean;
  restrictionNotice?: string;
  summary: string;
  steps: string[];
  tip?: string;
  actions: ActionCTA[];
}

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text?: string;
  guide?: GuideData;
  modelUsed?: string;
  actions?: AIChatAction[];
  isGemini?: boolean;
  timestamp: Date;
}

const PRESET_PROMPTS = [
  {
    id: 'ticket',
    label: 'How to create a support ticket?',
    icon: Ticket,
  },
  {
    id: 'onboard',
    label: 'How to onboard a new employee?',
    icon: UserPlus,
  },
  {
    id: 'access',
    label: 'How to request software access?',
    icon: Shield,
  },
  {
    id: 'asset',
    label: 'How to manage assets?',
    icon: Laptop,
  },
  {
    id: 'preferences',
    label: 'How to change notification/theme preferences?',
    icon: Settings,
  },
];

export const AIAssistantWidget: React.FC = () => {
  const { user, roleName, isAdmin, isManager, isTechnician } = useAuth();
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [customApiKey, setCustomApiKey] = useState(() => getClientGeminiApiKey() || '');
  const [selectedModel, setSelectedModel] = useState<
    'gemini-3.8-flash' | 'gemini-2.5-flash' | 'gemini-2.0-flash' | 'gemini-1.5-flash'
  >('gemini-3.8-flash');
  const [keySavedToast, setKeySavedToast] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize with greeting if empty
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: 'welcome-msg',
          sender: 'assistant',
          text: `Hello ${user?.full_name?.split(' ')[0] || user?.username || 'there'}! 👋 I am your IT Service Desk Copilot, powered by Google Gemini and our enterprise knowledge base. How can I assist you today?`,
          timestamp: new Date(),
        },
      ]);
    }
  }, [user, messages.length]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isLoading]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && !showSettings) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isOpen, showSettings]);

  const handleSaveApiKey = (e: React.FormEvent) => {
    e.preventDefault();
    setClientGeminiApiKey(customApiKey);
    setKeySavedToast(true);
    setTimeout(() => {
      setKeySavedToast(false);
      setShowSettings(false);
    }, 1200);
  };

  const generateGuideResponse = (queryKey: string): GuideData => {
    const key = queryKey.toLowerCase().trim();

    // 1. Employee Onboarding
    if (
      key.includes('onboard') ||
      key.includes('new hire') ||
      key.includes('hire') ||
      key.includes('joiner') ||
      key.includes('add employee')
    ) {
      if (!isAdmin && !isManager) {
        return {
          id: 'onboarding-restricted',
          title: 'Employee Onboarding (Admin / Manager Only)',
          category: 'User Management',
          isRestricted: true,
          restrictionNotice: `Access Restricted: Employee Onboarding is only available to Administrators and Managers. Your current role is "${roleName || 'Employee'}".`,
          summary:
            'Standard employees do not have administrative permission to create accounts, provision equipment, or run the onboarding wizard.',
          steps: [
            'If a new colleague is joining your team, inform your reporting manager or department administrator.',
            'Submit an IT Support Request detailing the new team member requirements (name, software licenses, equipment needs).',
            'An Administrator or Manager will review and execute the onboarding workflow from their management console.',
          ],
          tip: 'If you require elevated management privileges, contact your IT Administrator to adjust your user role.',
          actions: [
            { label: 'Submit IT Request', path: '/tickets/new', primary: true },
            { label: 'Browse Knowledge Base', path: '/knowledge-base', primary: false },
          ],
        };
      }

      return {
        id: 'onboarding-guide',
        title: 'Employee Onboarding Workflow',
        category: 'Administration',
        isRestricted: false,
        summary:
          'Complete end-to-end workflow to provision new hires with credentials, department assignment, and hardware.',
        steps: [
          'Navigate to Employee Onboarding (/admin/onboarding) from the Admin navigation section.',
          'Click the "Onboard New Employee" button to open the onboarding wizard.',
          'Enter the employee details: Full Name, Work Email, Contact Phone, Department, and Role.',
          'Assign required equipment (laptop, monitor, peripherals) from active asset inventory.',
          'Configure initial software licenses (Slack, Google Workspace, GitHub) and temporary credentials.',
          'Submit the form to automatically send the welcome onboarding email and track the onboarding checklist.',
        ],
        tip: 'You can monitor live checklist progress and equipment delivery directly on the Onboarding dashboard.',
        actions: [
          { label: 'Go to Onboarding Hub', path: '/admin/onboarding', primary: true },
          { label: 'View IT Assets', path: '/assets', primary: false },
        ],
      };
    }

    // 2. Offboarding
    if (
      key.includes('offboard') ||
      key.includes('exit') ||
      key.includes('resign') ||
      key.includes('deprovision') ||
      key.includes('termination')
    ) {
      if (!isAdmin && !isManager) {
        return {
          id: 'offboarding-restricted',
          title: 'Employee Offboarding (Admin / Manager Only)',
          category: 'Offboarding',
          isRestricted: true,
          restrictionNotice: `Access Restricted: The Offboarding checklist is reserved for Administrators and Managers. Your current role is "${roleName || 'Employee'}".`,
          summary:
            'Employees cannot initiate offboarding deprovisioning. Please contact your manager or HR team.',
          steps: [
            'Notify your department supervisor or Human Resources representative.',
            'If you need to return hardware or handover ticket ownership, create an IT Support Ticket.',
          ],
          actions: [
            { label: 'Create Support Ticket', path: '/tickets/new', primary: true },
            { label: 'View Profile', path: '/profile', primary: false },
          ],
        };
      }

      return {
        id: 'offboarding-guide',
        title: 'Employee Offboarding Procedure',
        category: 'Offboarding',
        isRestricted: false,
        summary:
          'Securely de-provision departing employees, reclaim hardware assets, and revoke system access.',
        steps: [
          'Go to the Offboarding dashboard (/offboarding) from the main menu.',
          'Click "Initiate Offboarding" and select the departing employee and departure date.',
          'Review the checklist: revoke SSO / email accounts, disable VPN, and transfer active tickets.',
          'Inspect and reclaim assigned hardware devices (laptops, monitors, security keys).',
          'Complete the final verification sign-off to update asset status back to "In Stock".',
        ],
        tip: 'Completing offboarding checklist automatically frees up hardware assets for future reallocation.',
        actions: [
          { label: 'Go to Offboarding', path: '/offboarding', primary: true },
          { label: 'Inspect Inventory', path: '/assets', primary: false },
        ],
      };
    }

    // 3. Support Tickets
    if (
      key.includes('ticket') ||
      key.includes('support') ||
      key.includes('issue') ||
      key.includes('problem') ||
      key.includes('bug') ||
      key.includes('incident') ||
      key.includes('raise')
    ) {
      return {
        id: 'ticket-guide',
        title: 'How to Create a Support Ticket',
        category: 'Ticket Management',
        summary:
          'Submit an incident or service request to the IT team with priority-based SLA tracking.',
        steps: [
          'Click "New Ticket" in the sidebar or use the button below to open the ticket creation form (/tickets/new).',
          'Select the Category that best describes your issue (Hardware, Software, Network, Access, Security, or Other).',
          'Choose the Priority level (Low, Medium, High, or Critical).',
          'Fill in a descriptive Title and clear Description explaining what happened, including any error messages.',
          'Attach screenshots or diagnostic files to help technicians diagnose the issue faster.',
          'Click "Submit Ticket". You will receive live status notifications as technicians resolve your ticket.',
        ],
        tip: 'Critical priority tickets trigger immediate real-time desktop alerts for on-duty technicians.',
        actions: [
          { label: 'Create New Ticket', path: '/tickets/new', primary: true },
          { label: 'View All Tickets', path: '/tickets', primary: false },
        ],
      };
    }

    // 4. Software Access Request
    if (
      key.includes('access') ||
      key.includes('software') ||
      key.includes('permission') ||
      key.includes('license') ||
      key.includes('vpn') ||
      key.includes('app')
    ) {
      return {
        id: 'access-guide',
        title: 'How to Request Software & System Access',
        category: 'Access Requests',
        summary:
          'Request elevated credentials, SaaS licenses, database permissions, or VPN profiles through approval workflows.',
        steps: [
          'Open the Access Requests module (/access-requests) from the sidebar.',
          'Click "New Access Request" to launch the request form.',
          'Select the application or system required (e.g., AWS, GitHub Org, Salesforce, VPN, Jira).',
          'Select the desired Access Level (Read-Only, Contributor, Administrator) and duration.',
          'Provide a clear Business Justification detailing why this access is required for your role.',
          'Submit the request. Your reporting manager and IT security officer will review and approve it.',
        ],
        tip: 'Requests with clear, concise business justifications are typically approved within 2-4 business hours.',
        actions: [
          { label: 'Request Software Access', path: '/access-requests', primary: true },
          { label: 'View Knowledge Base', path: '/knowledge-base', primary: false },
        ],
      };
    }

    // 5. Asset Management
    if (
      key.includes('asset') ||
      key.includes('hardware') ||
      key.includes('laptop') ||
      key.includes('device') ||
      key.includes('equipment') ||
      key.includes('inventory')
    ) {
      if (isAdmin || isManager || isTechnician) {
        return {
          id: 'asset-management-guide',
          title: 'IT Asset Lifecycle Management',
          category: 'Asset Management',
          isRestricted: false,
          summary:
            'Track, assign, maintain, and retire company hardware devices across departments.',
          steps: [
            'Navigate to the IT Asset Management section (/assets).',
            'To register new hardware, click "Add New Asset" and enter Serial Number, Model, and Category.',
            'Assign equipment directly to users by selecting their name from the Assignee dropdown.',
            'Update lifecycle status (In Stock, Assigned, Maintenance, Retired) as equipment condition changes.',
            'Review warranty dates, maintenance history, and department distribution on the asset table.',
          ],
          tip: 'Assets can also be allocated automatically during the Employee Onboarding flow.',
          actions: [
            { label: 'Manage IT Assets', path: '/assets', primary: true },
            { label: 'View Onboarding Hub', path: '/admin/onboarding', primary: false },
          ],
        };
      }

      return {
        id: 'asset-employee-guide',
        title: 'Viewing Assigned IT Assets',
        category: 'Asset Management',
        isRestricted: false,
        summary:
          'Inspect company hardware devices and equipment registered to your user profile.',
        steps: [
          'Navigate to the IT Assets page (/assets) to see all equipment currently issued to you.',
          'Review device details, model names, serial numbers, and warranty coverage.',
          'If your device is damaged or malfunctioning, submit a ticket under the "Hardware" category.',
          'If you need accessories (adapters, monitors, keyboards), submit a service request ticket.',
        ],
        tip: 'Keep your device serial number handy when submitting hardware support tickets.',
        actions: [
          { label: 'View My Assets', path: '/assets', primary: true },
          { label: 'Report Hardware Issue', path: '/tickets/new', primary: false },
        ],
      };
    }

    // 6. Notification & Theme Preferences
    if (
      key.includes('theme') ||
      key.includes('dark') ||
      key.includes('light') ||
      key.includes('notification') ||
      key.includes('preference') ||
      key.includes('profile') ||
      key.includes('password') ||
      key.includes('ooo') ||
      key.includes('out of office') ||
      key.includes('avatar')
    ) {
      return {
        id: 'preferences-guide',
        title: 'Managing Theme, Notifications & Profile',
        category: 'Settings & Profile',
        summary:
          'Customize your theme preference, alert delivery options, security credentials, and Out-of-Office status.',
        steps: [
          'Click your avatar in the top-right header or open your Profile page (/profile).',
          'Appearance: Toggle between Light Mode and Dark Mode using the Sun/Moon icon in the header or in Preferences.',
          'Notifications: Enable or disable browser push notifications and email alerts in the "Preferences" tab.',
          'Out of Office (OOO): Activate Out of Office mode and enter your return date to alert team members when you are away.',
          'Security: Switch to the "Security" tab to update your login password and view active sessions.',
          'Click "Save Preferences" to persist your settings across all sessions.',
        ],
        tip: 'Enabling browser push notifications ensures you never miss ticket updates and assignment alerts.',
        actions: [
          { label: 'Go to Profile & Preferences', path: '/profile', primary: true },
        ],
      };
    }

    // 7. Knowledge Base
    if (
      key.includes('kb') ||
      key.includes('knowledge') ||
      key.includes('article') ||
      key.includes('faq') ||
      key.includes('guide') ||
      key.includes('doc')
    ) {
      return {
        id: 'kb-guide',
        title: 'Knowledge Base Self-Service',
        category: 'Knowledge Base',
        summary:
          'Search verified IT documentation, troubleshooting guides, and frequently asked questions.',
        steps: [
          'Open the Knowledge Base (/knowledge-base) from the sidebar menu.',
          'Filter by category: Network & VPN, Software Setup, Hardware Troubleshooting, Security & Access.',
          'Search for common keywords (e.g. Wi-Fi credentials, VPN setup, printer drivers).',
          'If self-help articles do not resolve your issue, open a support ticket for technician assistance.',
        ],
        tip: 'Self-help articles provide immediate answers without waiting for ticket triage.',
        actions: [
          { label: 'Open Knowledge Base', path: '/knowledge-base', primary: true },
          { label: 'Create New Ticket', path: '/tickets/new', primary: false },
        ],
      };
    }

    // 8. Fallback / General
    return {
      id: 'fallback-guide',
      title: `Assistance for "${queryKey}"`,
      category: 'General Help',
      summary:
        `I could not find an exact matching tutorial for "${queryKey}", but I can guide you through our core service modules.`,
      steps: [
        'Support Tickets: Create and track incidents or hardware/software requests (/tickets/new).',
        'Access Requests: Request software licenses, elevated roles, or VPN access (/access-requests).',
        'Asset Management: View or manage assigned company devices and laptops (/assets).',
        'Knowledge Base: Search self-service troubleshooting guides and FAQs (/knowledge-base).',
        'Profile & Settings: Update theme (Light/Dark), notification alerts, and password (/profile).',
      ],
      tip: 'You can click any of the preset quick prompts at the top or ask freeform questions.',
      actions: [
        { label: 'Browse Knowledge Base', path: '/knowledge-base', primary: true },
        { label: 'Create Support Ticket', path: '/tickets/new', primary: false },
      ],
    };
  };

  const handleSelectPrompt = async (promptText: string) => {
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: promptText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      // Try Gemini AI first
      const geminiResult = await aiService.sendMessage({
        message: promptText,
        history: messages
          .filter((m) => m.text)
          .map((m) => ({
            role: m.sender === 'user' ? 'user' : 'model',
            text: m.text || '',
          })),
        roleName: roleName || 'Employee',
        userName: user?.full_name || user?.username || 'User',
        preferredModel: selectedModel,
      });

      if (geminiResult && geminiResult.text) {
        setMessages((prev) => [
          ...prev,
          {
            id: `bot-${Date.now()}`,
            sender: 'assistant',
            text: geminiResult.text,
            modelUsed: geminiResult.modelUsed,
            actions: geminiResult.suggestedActions,
            isGemini: true,
            timestamp: new Date(),
          },
        ]);
        return;
      }
    } catch {
      // Fallback below
    } finally {
      setIsLoading(false);
    }

    // Offline / Knowledge base fallback
    const guide = generateGuideResponse(promptText);
    setMessages((prev) => [
      ...prev,
      {
        id: `bot-${Date.now()}`,
        sender: 'assistant',
        guide,
        timestamp: new Date(),
      },
    ]);
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = inputText.trim();
    if (!text || isLoading) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      // Attempt Gemini AI via Backend /api/ai/chat or @google/genai
      const geminiResult = await aiService.sendMessage({
        message: text,
        history: messages
          .filter((m) => m.text)
          .map((m) => ({
            role: m.sender === 'user' ? 'user' : 'model',
            text: m.text || '',
          })),
        roleName: roleName || 'Employee',
        userName: user?.full_name || user?.username || 'User',
        preferredModel: selectedModel,
      });

      if (geminiResult && geminiResult.text) {
        setMessages((prev) => [
          ...prev,
          {
            id: `bot-${Date.now()}`,
            sender: 'assistant',
            text: geminiResult.text,
            modelUsed: geminiResult.modelUsed,
            actions: geminiResult.suggestedActions,
            isGemini: true,
            timestamp: new Date(),
          },
        ]);
        setIsLoading(false);
        return;
      }
    } catch (err: any) {
      console.warn('Gemini query fallback:', err);
      if (err.message === 'GEMINI_NOT_CONFIGURED') {
        setShowSettings(true);
        setMessages((prev) => [
          ...prev,
          {
            id: `bot-${Date.now()}`,
            sender: 'assistant',
            text: 'I am currently operating in offline mode. To answer freeform questions using AI, please enter your Google Gemini API Key in the settings panel that just opened above.',
            actions: [
              { label: '⚙️ Open/Toggle Settings', path: 'OPEN_SETTINGS', primary: true },
              { label: '🔑 Get Free Key on AI Studio', path: 'https://aistudio.google.com/app/apikey', primary: false },
            ],
            timestamp: new Date(),
          },
        ]);
        return; // Don't fall back to rule-based for freeform queries when API is simply unconfigured
      }
    } finally {
      setIsLoading(false);
    }

    // Structured Knowledge fallback if Gemini is not configured
    const guide = generateGuideResponse(text);
    setMessages((prev) => [
      ...prev,
      {
        id: `bot-${Date.now()}`,
        sender: 'assistant',
        guide,
        timestamp: new Date(),
      },
    ]);
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        sender: 'assistant',
        text: `Conversation cleared! ✨ What would you like help with? Select a quick guide or ask any IT question.`,
        timestamp: new Date(),
      },
    ]);
  };

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  return (
    <>
      {/* 1. Floating Launcher Button (Bottom-Right) */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-label={isOpen ? 'Close AI Support Assistant' : 'Open AI Support Assistant'}
          className={`group relative flex items-center gap-2.5 px-4 py-3 rounded-full font-medium shadow-xl transition-all duration-300 transform active:scale-95 ${
            isOpen
              ? 'bg-slate-800 text-white dark:bg-slate-700 hover:bg-slate-900'
              : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white hover:from-blue-700 hover:to-indigo-800 hover:shadow-blue-500/30'
          }`}
        >
          {/* Animated Glow Halo */}
          {!isOpen && (
            <span className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 opacity-75 blur-xs group-hover:opacity-100 transition duration-300 -z-10 animate-pulse" />
          )}

          <div className="relative flex items-center justify-center">
            {isOpen ? (
              <X className="w-5 h-5 transition-transform duration-200 group-hover:rotate-90" />
            ) : (
              <>
                <Bot className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
                <Sparkles className="w-3 h-3 text-amber-300 absolute -top-1 -right-1 animate-bounce" />
              </>
            )}
          </div>

          <span className="text-sm font-semibold tracking-wide">
            {isOpen ? 'Close Copilot' : 'IT Copilot'}
          </span>

          {/* Active Status Badge Dot */}
          {!isOpen && (
            <span className="relative flex h-2.5 w-2.5 ml-0.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
          )}
        </button>
      </div>

      {/* 2. Floating AI Assistant Chat Panel */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="IT Service Desk Copilot"
          className="fixed bottom-20 right-4 sm:right-6 w-[calc(100vw-2rem)] sm:w-[450px] max-h-[660px] h-[84vh] z-50 flex flex-col rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden transition-all duration-300 animate-in fade-in slide-in-from-bottom-5"
        >
          {/* Panel Header */}
          <div className="px-4 py-3 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border-b border-slate-800 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/20 text-white shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs sm:text-sm font-bold tracking-tight text-white">
                    IT Copilot
                  </h3>
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[9px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Online
                  </span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-500/30 text-indigo-200 font-mono">
                    Gemini Flash
                  </span>
                </div>
                <p className="text-[10px] text-slate-300 flex items-center gap-1">
                  <span>Role:</span>
                  <span className="font-semibold text-blue-300">{roleName || 'Employee'}</span>
                  {isAdmin && <span className="text-amber-300 text-[9px]">(Admin)</span>}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setShowSettings(!showSettings)}
                title="Gemini AI Settings"
                className={`p-1.5 rounded-lg transition-colors ${
                  showSettings
                    ? 'text-white bg-indigo-600'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                }`}
                aria-label="Gemini API Configuration"
              >
                <Settings className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleResetChat}
                title="Reset conversation"
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
                aria-label="Reset conversation"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                title="Close Copilot"
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
                aria-label="Close Copilot"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Settings Panel (Toggleable) */}
          {showSettings && (
            <div className="p-3.5 bg-slate-100 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-xs shrink-0 animate-in fade-in">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-blue-500" />
                  Google Gemini Configuration
                </span>
                <span className="text-[10px] text-slate-500">Free Tier (15 RPM / 1M Tokens)</span>
              </div>

              <form onSubmit={handleSaveApiKey} className="space-y-2.5">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400">
                      Gemini API Key:
                    </label>
                    <a
                      href="https://aistudio.google.com/app/apikey"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-blue-500 hover:text-blue-400 underline font-medium"
                    >
                      Get Free Key &rarr;
                    </a>
                  </div>
                  <input
                    type="password"
                    value={customApiKey}
                    onChange={(e) => setCustomApiKey(e.target.value)}
                    placeholder="AIzaSy... (paste your API key here)"
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:border-blue-500"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Model:</label>
                    <select
                      value={selectedModel}
                      onChange={(e) => setSelectedModel(e.target.value as any)}
                      className="text-[11px] px-2 py-1 rounded-md bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-hidden"
                    >
                      <option value="gemini-3.1-flash-lite">Gemini 3.1 Flash-Lite (Ultra Fast &amp; High Quota)</option>
                      <option value="gemini-3.5-flash-lite">Gemini 3.5 Flash-Lite</option>
                      <option value="gemini-flash-latest">Gemini Flash Latest</option>
                      <option value="gemini-3.8-flash">Gemini 3.8 Flash</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-xs transition-colors shadow-2xs"
                  >
                    Save Key
                  </button>
                </div>

                {keySavedToast && (
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> API Key saved successfully!
                  </p>
                )}
              </form>
            </div>
          )}

          {/* Quick Action Chips Bar */}
          <div className="p-2.5 bg-slate-50/90 dark:bg-slate-950/60 border-b border-slate-200/80 dark:border-slate-800/80 shrink-0">
            <div className="flex items-center justify-between mb-1 px-0.5">
              <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" />
                Quick Guides
              </span>
              <span className="text-[9px] text-slate-400">Instant step-by-step solutions</span>
            </div>
            <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs">
              {PRESET_PROMPTS.map((prompt) => {
                const IconComponent = prompt.icon;
                return (
                  <button
                    key={prompt.id}
                    type="button"
                    onClick={() => handleSelectPrompt(prompt.label)}
                    disabled={isLoading}
                    className="shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 transition-all shadow-xs whitespace-nowrap active:scale-95 disabled:opacity-50"
                  >
                    <IconComponent className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span>{prompt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Messages Container */}
          <div className="flex-1 p-3.5 overflow-y-auto space-y-3 bg-slate-50 dark:bg-slate-950/40 text-slate-800 dark:text-slate-100 text-sm">
            {messages.map((msg) => {
              const isUser = msg.sender === 'user';

              if (isUser) {
                return (
                  <div key={msg.id} className="flex justify-end">
                    <div className="max-w-[85%] rounded-2xl rounded-tr-xs bg-blue-600 text-white px-3.5 py-2.5 text-xs sm:text-sm font-medium shadow-sm">
                      {msg.text}
                    </div>
                  </div>
                );
              }

              // Assistant message
              return (
                <div key={msg.id} className="flex gap-2.5 items-start">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                    <Bot className="w-4 h-4" />
                  </div>

                  <div className="flex-1 space-y-2 min-w-0">
                    {/* Gemini AI Generated Response */}
                    {msg.isGemini && msg.text && (
                      <div className="rounded-2xl rounded-tl-xs bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 p-3.5 shadow-xs space-y-2">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/80 pb-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-amber-400" />
                            {msg.modelUsed || 'Gemini 2.0 Flash'}
                          </span>
                          <span className="text-[9px] text-slate-400">AI Verified</span>
                        </div>
                        <div className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                          {msg.text}
                        </div>

                        {/* In-Message Action CTAs */}
                        {msg.actions && msg.actions.length > 0 && (
                          <div className="pt-2 flex flex-wrap gap-1.5 border-t border-slate-100 dark:border-slate-700/80">
                            {msg.actions.map((act, aIdx) => (
                              <button
                                key={aIdx}
                                type="button"
                                onClick={() => handleNavigate(act.path)}
                                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-all shadow-2xs active:scale-95 ${
                                  act.primary
                                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20'
                                    : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-650 text-slate-800 dark:text-slate-200'
                                }`}
                              >
                                <span>{act.label}</span>
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Plain text welcome greeting & offline notifications */}
                    {!msg.isGemini && msg.text && (
                      <div className="rounded-2xl rounded-tl-xs bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 p-3 text-xs sm:text-sm text-slate-800 dark:text-slate-200 shadow-xs leading-relaxed space-y-2.5">
                        <div>{msg.text}</div>
                        {msg.actions && msg.actions.length > 0 && (
                          <div className="pt-1.5 flex flex-wrap gap-1.5 border-t border-slate-100 dark:border-slate-700/80">
                            {msg.actions.map((act, aIdx) => (
                              <button
                                key={aIdx}
                                type="button"
                                onClick={() => {
                                  if (act.path === 'OPEN_SETTINGS') {
                                    setShowSettings((prev) => !prev);
                                  } else if (act.path.startsWith('http')) {
                                    window.open(act.path, '_blank', 'noopener,noreferrer');
                                  } else {
                                    handleNavigate(act.path);
                                  }
                                }}
                                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-all shadow-2xs active:scale-95 ${
                                  act.primary
                                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20'
                                    : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-650 text-slate-800 dark:text-slate-200'
                                }`}
                              >
                                <span>{act.label}</span>
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Rich Guide Data Response (Fallback / Structured) */}
                    {msg.guide && (
                      <div className="rounded-2xl rounded-tl-xs bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 p-3.5 shadow-xs space-y-3">
                        <div className="border-b border-slate-100 dark:border-slate-800 pb-2">
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                              {msg.guide.isRestricted ? (
                                <Lock className="w-3.5 h-3.5 text-amber-500" />
                              ) : (
                                <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />
                              )}
                              {msg.guide.title}
                            </h4>
                            {msg.guide.category && (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                {msg.guide.category}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-normal">
                            {msg.guide.summary}
                          </p>
                        </div>

                        {/* Restriction Banner */}
                        {msg.guide.isRestricted && msg.guide.restrictionNotice && (
                          <div className="rounded-xl p-2.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200 flex items-start gap-2 text-xs">
                            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                            <div className="leading-snug">
                              <span className="font-semibold block mb-0.5">Permission Warning</span>
                              {msg.guide.restrictionNotice}
                            </div>
                          </div>
                        )}

                        {/* Numbered Steps */}
                        <div className="space-y-1.5">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            Step-by-Step Instructions:
                          </p>
                          <div className="space-y-1.5">
                            {msg.guide.steps.map((step, idx) => (
                              <div
                                key={idx}
                                className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/60 p-2 rounded-lg border border-slate-200/60 dark:border-slate-800/60"
                              >
                                <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold flex items-center justify-center shrink-0 text-[10px] mt-0.5">
                                  {idx + 1}
                                </span>
                                <span className="leading-relaxed flex-1">{step}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Pro Tip */}
                        {msg.guide.tip && (
                          <div className="p-2 rounded-lg bg-blue-50/80 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 text-[11px] text-blue-900 dark:text-blue-200 flex items-start gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                            <span className="leading-snug">{msg.guide.tip}</span>
                          </div>
                        )}

                        {/* Action CTAs */}
                        {msg.guide.actions && msg.guide.actions.length > 0 && (
                          <div className="pt-1 flex flex-wrap gap-2">
                            {msg.guide.actions.map((act, aIdx) => (
                              <button
                                key={aIdx}
                                type="button"
                                onClick={() => handleNavigate(act.path)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-xs active:scale-95 ${
                                  act.primary
                                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20'
                                    : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200'
                                }`}
                              >
                                <span>{act.label}</span>
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Loading / Generating State */}
            {isLoading && (
              <div className="flex gap-2.5 items-start animate-pulse">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="rounded-2xl rounded-tl-xs bg-white dark:bg-slate-850 border border-slate-200/90 dark:border-slate-750 px-3.5 py-2.5 text-xs text-slate-600 dark:text-slate-300 shadow-xs flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" />
                  <span>Gemini is generating response...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Text / Search Input Bar */}
          <form
            onSubmit={handleSendMessage}
            className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shrink-0 flex items-center gap-2"
          >
            <div className="relative flex-1">
              <input
                ref={inputRef}
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Ask Gemini anything (e.g. 'how to reset password', 'wifi')..."
                disabled={isLoading}
                className="w-full text-xs sm:text-sm pl-3 pr-8 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 border border-transparent focus:border-blue-500 dark:focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-hidden transition-all disabled:opacity-60"
              />
              {inputText && (
                <button
                  type="button"
                  onClick={() => setInputText('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={!inputText.trim() || isLoading}
              className="p-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:hover:bg-blue-600 text-white font-medium transition-all shadow-xs shrink-0 flex items-center justify-center active:scale-95"
              aria-label="Send query"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};

export default AIAssistantWidget;
