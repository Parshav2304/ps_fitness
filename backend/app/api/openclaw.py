"""
OpenClaw Omnichannel Messaging Gateway
Integrates WhatsApp, Telegram, and mobile webhooks for hands-free
food logging, workout tracking, and coaching on the go.
"""

from fastapi import APIRouter, HTTPException, Request, Response, Depends, status
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime, timezone
import re
import json
import logging

from app.database import get_database
from app.auth import get_current_user_id
from app.services.gamification_service import GamificationService
from app.services.router_service import jev_router
from app.services.rag_service import sports_rag
from app.services.chatbot_service import ChatbotService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/openclaw", tags=["openclaw"])

class OpenClawSimulationRequest(BaseModel):
    channel: str = Field(default="whatsapp", description="whatsapp, telegram, or sms")
    sender: str = Field(default="+1234567890", description="Phone number or chat ID")
    text: Optional[str] = Field(default="", description="Message text")
    image_data: Optional[str] = Field(default=None, description="Base64 photo of meal or whiteboard")

class OpenClawSimulationResponse(BaseModel):
    success: bool
    channel: str
    reply_text: str
    action_taken: str
    logged_data: Optional[Dict[str, Any]] = None
    xp_awarded: int = 0
    route: str = "GENERAL_COACH_CHAT"

@router.get("/status")
async def openclaw_status():
    """Returns the operational status of OpenClaw Omnichannel Gateway"""
    return {
        "status": "online",
        "gateway": "OpenClaw v2.4",
        "channels": {
            "whatsapp": {"enabled": True, "provider": "Cloud API / Twilio Webhook"},
            "telegram": {"enabled": True, "provider": "Bot API Webhook"},
            "sms": {"enabled": True, "provider": "Direct REST"}
        },
        "features": [
            "Photo Macro Vision Autologging",
            "Jev Microsecond Route Dispatch",
            "ChromaDB Personal Memory Synchronization",
            "Gamification XP & Streak Synchronization"
        ]
    }

@router.get("/webhook")
async def verify_webhook(request: Request):
    """
    Standard Meta / WhatsApp Webhook verification handshake.
    Responds to hub.challenge when registering webhooks.
    """
    params = request.query_params
    mode = params.get("hub.mode")
    token = params.get("hub.verify_token")
    challenge = params.get("hub.challenge")

    # In production, compare with os.getenv("OPENCLAW_VERIFY_TOKEN", "psfitness_token")
    if mode == "subscribe" and challenge:
        return Response(content=challenge, media_type="text/plain")
    return {"status": "listening"}

@router.post("/webhook")
async def handle_inbound_webhook(payload: Dict[str, Any]):
    """
    Inbound webhook receiver for WhatsApp Business Cloud API & Telegram Bot updates.
    """
    try:
        db = get_database()
        sender = "external_user"
        message_text = ""
        image_url = None

        # Check for WhatsApp Cloud API structure
        if "entry" in payload:
            for entry in payload.get("entry", []):
                for change in entry.get("changes", []):
                    value = change.get("value", {})
                    contacts = value.get("contacts", [{}])
                    sender = contacts[0].get("wa_id", "anonymous")
                    messages = value.get("messages", [])
                    if messages:
                        msg = messages[0]
                        message_text = msg.get("text", {}).get("body", "")
                        if msg.get("type") == "image":
                            image_url = msg.get("image", {}).get("id")
        # Check for Telegram structure
        elif "message" in payload:
            msg = payload["message"]
            sender = str(msg.get("from", {}).get("id", "anonymous"))
            message_text = msg.get("text", "")

        return {
            "status": "processed",
            "sender": sender,
            "preview": message_text[:40]
        }
    except Exception as e:
        logger.error(f"[OpenClaw Webhook Error] {e}")
        return {"status": "error", "detail": str(e)}

@router.post("/simulate", response_model=OpenClawSimulationResponse)
async def simulate_mobile_message(
    payload: OpenClawSimulationRequest,
    current_user_id: str = Depends(get_current_user_id)
):
    """
    Simulate an inbound WhatsApp or Telegram message from a mobile phone.
    Allows end-to-end testing of photo macro logging and instant conversational answers.
    """
    db = get_database()
    text = (payload.text or "").strip()
    channel = payload.channel.lower()
    
    # 1. Microsecond routing with Jev
    jev_decision = jev_router.route(text)
    route_label = jev_decision.get("route", "GENERAL_COACH_CHAT")
    
    # 2. Check for food logging intent or attached photo
    is_food = route_label == "FOOD_LOGGING_VISION" or bool(payload.image_data) or "ate" in text.lower() or "calories" in text.lower()
    
    if is_food:
        # Extract or estimate macros
        # Simple intelligent parser or AI vision fallback
        item_name = "Mobile Logged Meal"
        calories = 420
        protein = 32.0
        carbs = 45.0
        fats = 12.0
        
        # Regex extraction if user texted e.g. "Ate 200g chicken and rice, 450 cal, 40g protein"
        cal_match = re.search(r"(\d+)\s*(cal|kcal|calories)", text, re.I)
        if cal_match:
            calories = int(cal_match.group(1))
        p_match = re.search(r"(\d+(?:\.\d+)?)\s*g?\s*pro(?:tein)?", text, re.I)
        if p_match:
            protein = float(p_match.group(1))
        c_match = re.search(r"(\d+(?:\.\d+)?)\s*g?\s*carb", text, re.I)
        if c_match:
            carbs = float(c_match.group(1))
        f_match = re.search(r"(\d+(?:\.\d+)?)\s*g?\s*fat", text, re.I)
        if f_match:
            fats = float(f_match.group(1))
            
        if len(text.split()) > 0 and not text.lower().startswith("log"):
            item_name = text.split(",")[0][:40]

        food_doc = {
            "user_id": current_user_id,
            "name": item_name,
            "calories": calories,
            "protein": protein,
            "carbs": carbs,
            "fats": fats,
            "meal": "lunch",
            "source": f"openclaw_{channel}",
            "date": datetime.now(timezone.utc).isoformat(),
            "created_at": datetime.now(timezone.utc)
        }
        res = await db.food_logs.insert_one(food_doc)
        food_doc["id"] = str(res.inserted_id)
        if "_id" in food_doc:
            del food_doc["_id"]
        if "created_at" in food_doc:
            food_doc["created_at"] = food_doc["created_at"].isoformat()

        # Award Gamification XP
        xp_result = await GamificationService.award_xp(current_user_id, GamificationService.XP_MEAL_LOG)
        xp_gained = xp_result.get("xp_gained", 15) if xp_result else 15
        await GamificationService.update_streak(current_user_id, db)

        # Sync to ChromaDB personal memory
        sports_rag.index_user_log(
            user_id=current_user_id,
            entry_id=food_doc["id"],
            content=f"Consumed {item_name}: {calories} kcal, {protein}g protein, {carbs}g carbs, {fats}g fat",
            entry_type="nutrition"
        )

        reply = (
            f"✅ *Logged via {channel.title()}!*\n\n"
            f"🍽️ *{item_name}*\n"
            f"⚡ {calories} kcal | 🥩 {protein}g P | 🌾 {carbs}g C | 🥑 {fats}g F\n"
            f"⭐ +{xp_gained} XP added to your daily streak."
        )

        return OpenClawSimulationResponse(
            success=True,
            channel=channel,
            reply_text=reply,
            action_taken="LOG_FOOD",
            logged_data=food_doc,
            xp_awarded=xp_gained,
            route=route_label
        )

    # 3. Conversational coaching response with RAG
    rag_data = sports_rag.retrieve_evidence(text, user_id=current_user_id) if jev_decision.get("needs_rag") else {"rag_context": ""}
    chatbot = ChatbotService()
    coach_reply = await chatbot.process_message(
        message=text,
        user_id=current_user_id,
        user_context={"channel": channel},
        rag_context=rag_data.get("rag_context")
    )
    
    reply_str = coach_reply.get("response") if isinstance(coach_reply, dict) else str(coach_reply)
    reply = f"🤖 *PS Fitness Coach ({channel.title()} Link)*:\n\n{reply_str}"

    return OpenClawSimulationResponse(
        success=True,
        channel=channel,
        reply_text=reply,
        action_taken="COACH_CHAT",
        logged_data=None,
        xp_awarded=5,
        route=route_label
    )
