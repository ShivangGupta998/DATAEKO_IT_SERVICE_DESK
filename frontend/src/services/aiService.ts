import { GoogleGenAI } from '@google/genai';
import { apiClient } from '../api/client';

export interface AIChatAction {
  label: string;
  path: string;
  primary?: boolean;
}

export interface AIChatResult {
  text: string;
  modelUsed: string;
  suggestedActions: AIChatAction[];
  isGemini: boolean;
}

const STORAGE_KEY_GEMINI_KEY = 'itsm_gemini_api_key';

export function getClientGeminiApiKey(): string | null {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem(STORAGE_KEY_GEMINI_KEY);
  if (stored && stored.trim()) return stored.trim();

  const envKey =
    typeof import.meta !== 'undefined' && (import.meta as any).env
      ? ((import.meta as any).env.VITE_GEMINI_API_KEY as string | undefined)
      : undefined;

  return envKey?.trim() || null;
}

export function setClientGeminiApiKey(key: string): void {
  if (typeof window === 'undefined') return;
  if (!key.trim()) {
    localStorage.removeItem(STORAGE_KEY_GEMINI_KEY);
  } else {
    localStorage.setItem(STORAGE_KEY_GEMINI_KEY, key.trim());
  }
}

const SYSTEM_INSTRUCTION = `You are the IT Service Desk Copilot, an AI support assistant for an enterprise IT Service Desk platform.

Key Platform Modules & Route Links:
- Ticket Management: /tickets/new (create ticket), /tickets (view all tickets)
- IT Hardware & Assets: /assets (view and manage devices, laptops, inventory)
- Access Requests: /access-requests (request software, VPN, cloud roles)
- Knowledge Base: /knowledge-base (troubleshooting guides, FAQs)
- User Profile: /profile (theme, dark mode toggle, notification alerts, password)
- Admin Onboarding: /admin/onboarding (Admin & Manager only)
- Admin Offboarding: /offboarding (Admin & Manager only)

Role Permissions Rules:
- If user is "Employee":
  * Do NOT allow Employee Onboarding (/admin/onboarding) or Offboarding (/offboarding). Politely explain that only Administrators and Managers can access these administrative features. Offer to create a support ticket at /tickets/new instead.
- If user is "Admin" or "Manager":
  * They have full authorization for onboarding and offboarding.

Response Guidelines:
- Keep answers clear, structured, and helpful.
- Use numbered step-by-step instructions when explaining how to complete tasks.
- Keep responses concise so they fit well inside a chat widget.
`;

function extractActionsFromText(text: string, roleName: string): AIChatAction[] {
  const actions: AIChatAction[] = [];
  const textLower = text.toLowerCase();
  const isAdminOrMgr = roleName === 'Admin' || roleName === 'Manager';

  if (text.includes('/tickets/new') || (textLower.includes('create') && textLower.includes('ticket'))) {
    actions.push({ label: 'Create New Ticket', path: '/tickets/new', primary: true });
  } else if (text.includes('/tickets') || textLower.includes('ticket')) {
    actions.push({ label: 'View Tickets', path: '/tickets', primary: false });
  }

  if (text.includes('/admin/onboarding') || textLower.includes('onboard')) {
    if (isAdminOrMgr) {
      actions.push({ label: 'Go to Onboarding Hub', path: '/admin/onboarding', primary: true });
    } else {
      if (!actions.some((a) => a.path === '/tickets/new')) {
        actions.push({ label: 'Submit IT Request', path: '/tickets/new', primary: true });
      }
    }
  }

  if (text.includes('/access-requests') || textLower.includes('access')) {
    actions.push({ label: 'Request Software Access', path: '/access-requests', primary: false });
  }

  if (text.includes('/assets') || textLower.includes('asset') || textLower.includes('hardware')) {
    actions.push({ label: 'View IT Assets', path: '/assets', primary: false });
  }

  if (text.includes('/profile') || textLower.includes('theme') || textLower.includes('preference')) {
    actions.push({ label: 'Profile & Settings', path: '/profile', primary: false });
  }

  if (text.includes('/knowledge-base') || textLower.includes('knowledge') || textLower.includes('faq')) {
    actions.push({ label: 'Knowledge Base', path: '/knowledge-base', primary: false });
  }

  const unique: AIChatAction[] = [];
  const seen = new Set<string>();
  for (const act of actions) {
    if (!seen.has(act.path)) {
      seen.add(act.path);
      unique.push(act);
    }
  }
  return unique.slice(0, 3);
}

export class AIService {
  /**
   * Queries Gemini via Backend FastAPI route `/api/ai/chat` first,
   * falling back to client-side `@google/genai` if configured,
   * and finally returning null if no Gemini API key is configured.
   */
  async sendMessage(params: {
    message: string;
    history?: { role: 'user' | 'model'; text: string }[];
    roleName: string;
    userName: string;
    preferredModel?: 'gemini-2.0-flash' | 'gemini-1.5-flash';
  }): Promise<AIChatResult | null> {
    const { message, history, roleName, userName, preferredModel = 'gemini-2.0-flash' } = params;

    // 1. Try Backend route `/api/ai/chat`
    try {
      const res = await apiClient.post('/api/ai/chat', {
        message,
        history,
        role_name: roleName,
        user_name: userName,
        model: preferredModel,
      });

      if (res.data && res.data.configured) {
        return {
          text: res.data.text,
          modelUsed: res.data.model_used,
          suggestedActions: res.data.suggested_actions || [],
          isGemini: true,
        };
      }
    } catch {
      // Backend route unreachable or errored; proceed to client-side fallback
    }

    // 2. Try Client-side direct `@google/genai` if key exists in env or localStorage
    const clientKey = getClientGeminiApiKey();
    if (clientKey) {
      try {
        const ai = new GoogleGenAI({ apiKey: clientKey });
        const response = await ai.models.generateContent({
          model: preferredModel,
          contents: message,
          config: {
            systemInstruction: `${SYSTEM_INSTRUCTION}\nCurrent User Role: ${roleName}\nUser Name: ${userName}`,
            temperature: 0.4,
            maxOutputTokens: 1024,
          },
        });

        const replyText = response.text || '';
        if (replyText) {
          const suggestedActions = extractActionsFromText(replyText, roleName);
          return {
            text: replyText,
            modelUsed: preferredModel,
            suggestedActions,
            isGemini: true,
          };
        }
      } catch (err: any) {
        console.warn('Direct @google/genai query error:', err);
      }
    }

    // 3. Neither key was configured or succeeded
    return null;
  }
}

export const aiService = new AIService();
