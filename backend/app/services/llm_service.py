from google import genai
from google.genai import types
import os
import logging
from typing import Dict, Any, List, Optional, Tuple, Union
import json
import asyncio
import base64
import time
import httpx

# Configure Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class LLMService:
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY")
        self.client = None
        self._configured = False
        self.ollama_url = os.getenv("OLLAMA_URL", "http://localhost:11434").rstrip("/")
        self.ollama_model = os.getenv("OLLAMA_MODEL", "llama3.1:8b")

    def _ensure_configured(self):
        if self._configured:
            return
            
        if not self.api_key:
            logger.info("ℹ️ GEMINI_API_KEY not configured in environment")
            return
            
        try:
            self.client = genai.Client(api_key=self.api_key)
            self._configured = True
            logger.info("✅ Gemini API Client Initialized Successfully")
        except Exception as e:
            logger.error(f"❌ Failed to configure Gemini: {e}")

    async def check_ollama_available(self) -> bool:
        """Ping local Ollama daemon to check if running and accessible."""
        try:
            async with httpx.AsyncClient(timeout=1.0) as client:
                res = await client.get(f"{self.ollama_url}/api/tags")
                return res.status_code == 200
        except Exception:
            return False

    def is_available(self) -> bool:
        """Check if at least one LLM engine is ready to use."""
        self._ensure_configured()
        return self.client is not None or bool(self.ollama_url)

    async def generate_response(
        self,
        user_message: str,
        context: Dict[str, Any],
        history: List[Dict[str, str]],
        image_data: Optional[str] = None,
        preferred_engine: str = "auto",
        rag_context: Optional[str] = None
    ) -> Union[str, Dict[str, Any]]:
        """
        Generate a response using Dual-Engine (Local Ollama or Gemini Cloud fallback)
        with context-aware and RAG-augmented prompting.
        """
        start_time = time.perf_counter()
        self._ensure_configured()
        
        # 1. Multimodal Vision Handling: Use Gemini Vision
        if image_data:
            if not self.client:
                return "Multimodal vision requires a configured Gemini API key for photo analysis."
            return await self._call_gemini_vision(user_message, context, history, image_data, rag_context)

        # 2. Text-only Reasoning: Local Ollama (if preferred or auto-available)
        system_prompt = self._build_system_prompt(context, has_image=False, rag_context=rag_context)
        
        engine_used = "rule-based"
        response_text = ""
        
        should_try_ollama = preferred_engine in ("ollama", "auto")
        if should_try_ollama:
            ollama_ready = await self.check_ollama_available()
            if ollama_ready:
                try:
                    logger.info(f"⚡ Dispatching to Local Ollama ({self.ollama_model})...")
                    response_text = await self._call_ollama(system_prompt, user_message, history)
                    engine_used = f"local-ollama ({self.ollama_model})"
                except Exception as ex:
                    logger.warning(f"Local Ollama call failed ({ex}), falling back to Gemini Cloud...")

        # 3. Cloud Fallback to Gemini 2.5 Flash
        if not response_text and self.client:
            try:
                logger.info("⚡ Dispatching to Gemini 2.5 Flash Cloud...")
                response_text = await self._call_gemini_text(system_prompt, user_message, history)
                engine_used = "gemini-2.5-flash"
            except Exception as ex:
                logger.error(f"❌ Gemini generation failed: {ex}")

        # 4. Final Fallback if both unavailable
        if not response_text:
            response_text = "I am operating in offline recovery mode. Please ensure Ollama is running locally or a Gemini API key is configured."
            engine_used = "recovery-fallback"

        latency_ms = int((time.perf_counter() - start_time) * 1000)
        return {
            "response": response_text,
            "engine_used": engine_used,
            "latency_ms": latency_ms
        }

    async def _call_ollama(self, system_prompt: str, user_message: str, history: List[Dict[str, str]]) -> str:
        """Call local Ollama chat API asynchronously with stream disabled."""
        messages = [{"role": "system", "content": system_prompt}]
        for h in history[-6:]:
            role = h.get("role", "user")
            content = h.get("content", "")
            if role in ("user", "assistant") and content:
                messages.append({"role": role, "content": content})
        messages.append({"role": "user", "content": user_message})

        async with httpx.AsyncClient(timeout=45.0) as client:
            res = await client.post(
                f"{self.ollama_url}/api/chat",
                json={
                    "model": self.ollama_model,
                    "messages": messages,
                    "stream": False,
                    "options": {"temperature": 0.5, "num_ctx": 4096}
                }
            )
            if res.status_code == 200:
                data = res.json()
                return data.get("message", {}).get("content", "").strip()
            raise RuntimeError(f"Ollama returned HTTP {res.status_code}: {res.text}")

    async def _call_gemini_text(self, system_prompt: str, user_message: str, history: List[Dict[str, str]]) -> str:
        """Call Gemini 2.5 Flash for pure text reasoning."""
        prompt_parts = [f"{system_prompt}\n\nUser History: {history[-6:]}\n\nCurrent Request: {user_message}"]
        response = await self.client.aio.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt_parts
        )
        return response.text.strip()

    async def _call_gemini_vision(
        self,
        user_message: str,
        context: Dict[str, Any],
        history: List[Dict[str, str]],
        image_data: str,
        rag_context: Optional[str] = None
    ) -> Dict[str, Any]:
        """Multimodal image recognition and nutritional breakdown."""
        start_time = time.perf_counter()
        system_prompt = self._build_system_prompt(context, has_image=True, rag_context=rag_context)
        prompt_parts = [f"{system_prompt}\n\nCurrent Request: {user_message}"]
        
        try:
            if "," in image_data:
                mime_type = image_data.split(';')[0].split(':')[1]
                base64_str = image_data.split(',')[1]
            else:
                mime_type = "image/jpeg"
                base64_str = image_data
                
            image_bytes = base64.b64decode(base64_str)
            image_part = types.Part.from_bytes(data=image_bytes, mime_type=mime_type)
            prompt_parts.append(image_part)
            
            response = await self.client.aio.models.generate_content(
                model='gemini-2.5-flash',
                contents=prompt_parts
            )
            latency_ms = int((time.perf_counter() - start_time) * 1000)
            return {
                "response": response.text.strip(),
                "engine_used": "gemini-2.5-flash (vision)",
                "latency_ms": latency_ms
            }
        except Exception as e:
            logger.error(f"Failed processing image: {e}")
            latency_ms = int((time.perf_counter() - start_time) * 1000)
            return {
                "response": "Could not process image format. Please upload a valid JPG or PNG photo.",
                "engine_used": "error",
                "latency_ms": latency_ms
            }

    def _build_system_prompt(self, context: Dict[str, Any], has_image: bool = False, rag_context: Optional[str] = None) -> str:
        """Constructs a detailed, humanized sports science system prompt."""
        user = context or {}
        stats = user.get('stats', {})
        
        prompt = f"""
        You are 'PS Coach', an elite, evidence-based strength & nutrition advisor.
        You are speaking with {user.get('username', 'the athlete')}.
        
        **Core Directive:**
        - Provide high-density, evidence-grounded athletic advice without robotic cliches.
        - Prioritize progressive overload, energy balance, and biomechanics.
        - Avoid cartoonish language or preachy lectures; speak like a high-performance strength coach.
        """
        
        if rag_context:
            prompt += f"""
        **GROUNDED SPORTS SCIENCE & HISTORICAL EVIDENCE (CITE WHEN RELEVANT):**
        {rag_context}
        """

        if has_image:
            prompt += """
        **CRITICAL FOOD IMAGE INSTRUCTION:**
        Identify the food items, estimate quantities, and calculate macros.
        You MUST append a JSON-logging block at the end of your response formatted exactly as:
        ||LOG_FOOD||{"name": "Item Description", "calories": 480, "protein": 24.0, "carbs": 58.0, "fats": 16.0, "meal": "lunch"}||
        Ensure the JSON block is on a single line and matches valid JSON.
        """
            
        prompt += f"""
        **Athlete Telemetry:**
        - Primary Goal: {user.get('fitness_goal', 'Hypertrophy / Recomposition')}
        - Current Weight: {user.get('weight', 'N/A')} kg
        - Height: {user.get('height', 'N/A')} cm
        - Experience / Activity: {user.get('activity_level', 'Moderate')}
        - 7-Day Caloric Avg: {stats.get('avg_daily_calories', 'N/A')} kcal
        - 30-Day Weight Trend: {stats.get('weight_change_30d', '0')} kg
        
        Keep answers clear, scientific, and concise (under 120 words unless detailing a full routine or analyzing food).
        """
        return prompt.strip()

    async def generate_json(self, prompt: str) -> Optional[Dict[str, Any]]:
        """Generate structured JSON response asynchronously."""
        self._ensure_configured()
        if not self.client:
            return None
            
        try:
            full_prompt = f"{prompt}\n\nIMPORTANT: Return ONLY valid JSON. No markdown backticks or commentary."
            response = await self.client.aio.models.generate_content(
                model='gemini-2.5-flash',
                contents=full_prompt
            )
            text = response.text.strip()
            if text.startswith("```json"):
                text = text.replace("```json", "", 1).replace("```", "", 1).strip()
            elif text.startswith("```"):
                text = text.replace("```", "", 1).replace("```", "", 1).strip()
            return json.loads(text)
        except Exception as e:
            logger.error(f"Error generating JSON: {e}")
            return None
