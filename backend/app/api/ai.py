import json
import os
import urllib.request
import urllib.error
from typing import List, Dict, Optional, Any
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.core.config import settings

router = APIRouter(prefix="/api/ai", tags=["AI Copilot"])

class AIChatAction(BaseModel):
    label: str
    path: str
    primary: bool = True

class AIChatRequest(BaseModel):
    message: str
    history: Optional[List[Dict[str, Any]]] = None
    role_name: Optional[str] = "Employee"
    user_name: Optional[str] = None
    model: Optional[str] = "gemini-2.0-flash"

class AIChatResponse(BaseModel):
    text: str
    model_used: str
    suggested_actions: List[AIChatAction] = []
    configured: bool = True

SYSTEM_PROMPT = """You are the IT Service Desk Copilot, an intelligent and helpful enterprise AI assistant for our IT Service Desk web application.

Application Capabilities and Routes:
- Ticket Management:
  * View all tickets: /tickets
  * Create new ticket: /tickets/new
- Software & Access Requests:
  * Request software, VPN, SaaS or elevated credentials: /access-requests
- IT Hardware & Asset Inventory:
  * View assigned devices or manage inventory: /assets
- Knowledge Base:
  * Browse self-help guides and FAQs: /knowledge-base
- Profile & Settings:
  * Switch theme (Light/Dark mode), toggle push notifications, Out-of-Office (OOO), change password: /profile
- Administration:
  * Employee Onboarding Hub: /admin/onboarding (Admin and Manager only)
  * Employee Offboarding: /offboarding (Admin and Manager only)
  * Service Analytics & SLA Reports: /reports (Admin and Manager only)

Role Permissions Rule:
- The current user's role is: {role_name}. User name: {user_name}.
- If user is "Employee":
  * They MUST NOT access /admin/onboarding or /offboarding.
  * If they ask about onboarding or offboarding, clearly explain this is restricted to Administrators and Managers, and recommend they submit an IT request at /tickets/new.
- If user is "Admin" or "Manager":
  * They have full authorization to onboard staff at /admin/onboarding and conduct offboarding at /offboarding.

Response Style:
- Professional, concise, friendly, and structured.
- Use numbered step-by-step instructions when explaining workflows.
- Mention the relevant page route (e.g., /tickets/new, /access-requests).
"""

def extract_actions_from_text(text: str, role_name: str) -> List[AIChatAction]:
    actions: List[AIChatAction] = []
    text_lower = text.lower()
    is_admin_or_mgr = role_name in ["Admin", "Manager"]

    if "/tickets/new" in text or "create" in text_lower and "ticket" in text_lower:
        actions.append(AIChatAction(label="Create Support Ticket", path="/tickets/new", primary=True))
    elif "/tickets" in text or "ticket" in text_lower:
        actions.append(AIChatAction(label="View Tickets", path="/tickets", primary=False))

    if "/admin/onboarding" in text or "onboard" in text_lower:
        if is_admin_or_mgr:
            actions.append(AIChatAction(label="Go to Onboarding Hub", path="/admin/onboarding", primary=True))
        else:
            if not any(a.path == "/tickets/new" for a in actions):
                actions.append(AIChatAction(label="Submit IT Request", path="/tickets/new", primary=True))

    if "/access-requests" in text or "access" in text_lower:
        actions.append(AIChatAction(label="Request Software Access", path="/access-requests", primary=False))

    if "/assets" in text or "asset" in text_lower or "hardware" in text_lower:
        actions.append(AIChatAction(label="View IT Assets", path="/assets", primary=False))

    if "/profile" in text or "theme" in text_lower or "notification" in text_lower or "preference" in text_lower:
        actions.append(AIChatAction(label="Open Profile & Settings", path="/profile", primary=False))

    if "/knowledge-base" in text or "knowledge" in text_lower or "faq" in text_lower:
        actions.append(AIChatAction(label="Browse Knowledge Base", path="/knowledge-base", primary=False))

    # Keep unique by path and max 3
    unique_actions: List[AIChatAction] = []
    seen = set()
    for act in actions:
        if act.path not in seen:
            seen.add(act.path)
            unique_actions.append(act)
    return unique_actions[:3]

@router.post("/chat", response_model=AIChatResponse)
def ai_chat_endpoint(payload: AIChatRequest):
    api_key = getattr(settings, "GEMINI_API_KEY", None) or os.getenv("GEMINI_API_KEY")

    role_name = payload.role_name or "Employee"
    user_name = payload.user_name or "User"

    if not api_key:
        return AIChatResponse(
            text=(
                f"Gemini API is not configured on the backend yet. "
                f"To enable live Gemini AI responses, please set `GEMINI_API_KEY` in your `backend/.env` file or provide your API key in the Copilot widget."
            ),
            model_used="offline-rule-engine",
            configured=False,
            suggested_actions=[
                AIChatAction(label="Browse Knowledge Base", path="/knowledge-base", primary=True),
                AIChatAction(label="Create Support Ticket", path="/tickets/new", primary=False),
            ],
        )

    # Format prompt with system context
    system_instruction = SYSTEM_PROMPT.format(role_name=role_name, user_name=user_name)

    # Prepare Gemini API request payload
    models_to_try = [payload.model or "gemini-2.0-flash", "gemini-1.5-flash"]
    last_error = None

    for model in models_to_try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
        
        contents = []
        if payload.history:
            for item in payload.history[-6:]:  # last 6 messages for context
                role = "user" if item.get("role") == "user" else "model"
                text = item.get("text", "")
                if text:
                    contents.append({"role": role, "parts": [{"text": text}]})

        contents.append({"role": "user", "parts": [{"text": payload.message}]})

        request_body = {
            "contents": contents,
            "systemInstruction": {
                "parts": [{"text": system_instruction}]
            },
            "generationConfig": {
                "temperature": 0.4,
                "maxOutputTokens": 1024,
            }
        }

        try:
            req_data = json.dumps(request_body).encode("utf-8")
            req = urllib.request.Request(
                url,
                data=req_data,
                headers={"Content-Type": "application/json"},
                method="POST"
            )

            with urllib.request.urlopen(req, timeout=15) as response:
                res_body = response.read().decode("utf-8")
                res_json = json.loads(res_body)
                
                candidates = res_json.get("candidates", [])
                if candidates:
                    parts = candidates[0].get("content", {}).get("parts", [])
                    if parts:
                        reply_text = parts[0].get("text", "")
                        actions = extract_actions_from_text(reply_text, role_name)
                        return AIChatResponse(
                            text=reply_text,
                            model_used=model,
                            suggested_actions=actions,
                            configured=True
                        )
        except urllib.error.HTTPError as http_err:
            error_details = http_err.read().decode("utf-8")
            last_error = f"Gemini API error ({model}): {http_err.code} - {error_details}"
            continue
        except Exception as e:
            last_error = f"Connection error ({model}): {str(e)}"
            continue

    # If all models failed
    raise HTTPException(status_code=502, detail=f"Failed to query Gemini API: {last_error}")
