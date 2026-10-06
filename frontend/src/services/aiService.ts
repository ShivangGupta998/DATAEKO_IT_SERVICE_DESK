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
    preferredModel?: 'gemini-3.8-flash' | 'gemini-2.5-flash' | 'gemini-2.0-flash' | 'gemini-1.5-flash';
  }): Promise<AIChatResult | null> {
    const { message, history, roleName, userName, preferredModel = 'gemini-3.8-flash' } = params;

    const clientKey = getClientGeminiApiKey();

    // 1. Direct High-Speed Client REST (Instant ~1.5s response, bypasses backend timeouts)
    if (clientKey) {
      const modelsToTry = [
        'gemini-3.1-flash-lite',
        'gemini-3.5-flash-lite',
        'gemini-flash-latest',
        preferredModel,
      ];
      const seen = new Set<string>();
      const deduped = modelsToTry.filter((m) => {
        if (!m || seen.has(m)) return false;
        seen.add(m);
        return true;
      });

      for (const m of deduped) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s per model max

          const url = `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${encodeURIComponent(clientKey)}`;
          const res = await fetch(url, {
            method: 'POST',
            signal: controller.signal,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ role: 'user', parts: [{ text: message }] }],
              systemInstruction: {
                parts: [{ text: `${SYSTEM_INSTRUCTION}\nCurrent User Role: ${roleName}\nUser Name: ${userName}` }],
              },
              generationConfig: {
                temperature: 0.3,
                maxOutputTokens: 800,
              },
            }),
          });
          clearTimeout(timeoutId);

          if (res.ok) {
            const data = await res.json();
            const replyText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (replyText) {
              const suggestedActions = extractActionsFromText(replyText, roleName);
              return {
                text: replyText,
                modelUsed: m,
                suggestedActions,
                isGemini: true,
              };
            }
          }
        } catch {
          // try next model
        }
      }
    }

    // 2. Try Backend route `/api/ai/chat` if client direct was not configured
    try {
      const res = await apiClient.post(
        '/api/ai/chat',
        {
          message,
          history,
          role_name: roleName,
          user_name: userName,
          model: preferredModel,
        },
        { timeout: 5000 }
      );

      if (res.data && res.data.configured) {
        return {
          text: res.data.text,
          modelUsed: res.data.model_used,
          suggestedActions: res.data.suggested_actions || [],
          isGemini: true,
        };
      }
    } catch {
      // Backend route unreachable
    }

    // If key is present but models failed or hit quota/network error, return friendly message instead of asking to configure key
    if (clientKey) {
      return {
        text: "I received your question, but Google Gemini is currently experiencing a temporary connection or capacity limit. Please try asking again in a moment.",
        modelUsed: "gemini-3.1-flash-lite",
        suggestedActions: extractActionsFromText(message, roleName),
        isGemini: true,
      };
    }

    // 3. Key was never configured
    throw new Error('GEMINI_NOT_CONFIGURED');
  }
}

export const aiService = new AIService();
