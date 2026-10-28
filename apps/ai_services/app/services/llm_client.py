import json
import logging
import re
from typing import Any, Dict, List, Optional
import httpx
from app.config import settings

logger = logging.getLogger("thinkwires.ai_services.llm")


def extract_json_from_llm_response(text: str) -> Optional[Dict[str, Any]]:
    """
    Robustly extracts and parses a JSON object from raw LLM text response.
    Handles raw JSON, markdown-wrapped code fences (```json ... ```),
    and responses with conversational leading/trailing text.
    """
    if not text or not isinstance(text, str):
        return None

    cleaned = text.strip()

    # 1. Direct parse attempt
    try:
        return json.loads(cleaned)
    except Exception:
        pass

    # 2. Markdown fence extraction: ```json { ... } ``` or ``` { ... } ```
    match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", cleaned, re.IGNORECASE)
    if match:
        try:
            return json.loads(match.group(1).strip())
        except Exception:
            pass

    # 3. Locate outermost curly brackets: { ... }
    first_brace = cleaned.find("{")
    last_brace = cleaned.rfind("}")
    if first_brace != -1 and last_brace > first_brace:
        candidate = cleaned[first_brace : last_brace + 1]
        try:
            return json.loads(candidate)
        except Exception:
            pass

    return None


class LLMProvider:
    """Represents a configured OpenAI-compatible LLM endpoint."""

    def __init__(
        self,
        name: str,
        base_url: str,
        api_key: str,
        model: str,
        extra_headers: Optional[Dict[str, str]] = None,
        supports_json_object: bool = True,
    ):
        self.name = name
        self.base_url = base_url.rstrip("/")
        self.api_key = api_key
        self.model = model
        self.extra_headers = extra_headers or {}
        self.supports_json_object = supports_json_object

    def get_headers(self) -> Dict[str, str]:
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}" if self.api_key else "Bearer none",
            **self.extra_headers,
        }
        return headers


def get_available_providers() -> List[LLMProvider]:
    """
    Builds the list of active providers in ordered priority:
    Primary configured provider first, then automatic free fallbacks.
    """
    providers: Dict[str, LLMProvider] = {}

    # 1. Groq (Free Cloud Tier - Llama 3.3 70B / Llama 3.1 8B)
    if settings.is_groq_configured:
        providers["groq"] = LLMProvider(
            name="Groq",
            base_url=settings.GROQ_BASE_URL,
            api_key=settings.GROQ_API_KEY,
            model=settings.GROQ_MODEL,
            supports_json_object=True,
        )

    # 2. Google Gemini (Free Tier - OpenAI-Compatible Endpoint)
    if settings.is_gemini_configured:
        providers["gemini"] = LLMProvider(
            name="Google Gemini",
            base_url=settings.GEMINI_BASE_URL,
            api_key=settings.GEMINI_API_KEY,
            model=settings.GEMINI_MODEL,
            supports_json_object=True,
        )

    # 3. OpenRouter (Free Community Models)
    if settings.is_openrouter_configured:
        providers["openrouter"] = LLMProvider(
            name="OpenRouter",
            base_url=settings.OPENROUTER_BASE_URL,
            api_key=settings.OPENROUTER_API_KEY,
            model=settings.OPENROUTER_MODEL,
            extra_headers={
                "HTTP-Referer": "https://thinkwires.com",
                "X-Title": "ThinkWires ATS",
            },
            supports_json_object=True,
        )

    # 4. Ollama (Free Local / Self-Hosted LLM)
    if settings.is_ollama_configured:
        providers["ollama"] = LLMProvider(
            name="Ollama (Local)",
            base_url=settings.OLLAMA_BASE_URL,
            api_key="ollama",
            model=settings.OLLAMA_MODEL,
            supports_json_object=True,
        )

    # 5. Generic / Custom OpenAI-compatible endpoint
    if settings.is_custom_llm_configured:
        providers["custom"] = LLMProvider(
            name="Custom LLM",
            base_url=settings.LLM_BASE_URL,
            api_key=settings.LLM_API_KEY,
            model=settings.LLM_MODEL,
            supports_json_object=True,
        )

    # 6. OpenAI (Optional paid / existing keys)
    if settings.is_openai_configured:
        providers["openai"] = LLMProvider(
            name="OpenAI",
            base_url=settings.OPENAI_BASE_URL,
            api_key=settings.OPENAI_API_KEY,
            model=settings.OPENAI_MODEL,
            supports_json_object=True,
        )

    # Determine execution order
    primary = settings.PRIMARY_LLM_PROVIDER.lower()
    ordered: List[LLMProvider] = []

    if primary in providers:
        ordered.append(providers[primary])

    # Append remaining providers as graceful fallbacks
    for key, prov in providers.items():
        if prov not in ordered:
            ordered.append(prov)

    return ordered


async def execute_chat_completion_with_fallback(
    prompt: str,
    system_instruction: Optional[str] = None,
    timeout_seconds: float = 12.0,
    temperature: float = 0.1,
) -> Optional[Dict[str, Any]]:
    """
    Executes a structured JSON LLM completion with an automatic fallback cascade.
    Tries providers in sequence (Groq -> Gemini -> OpenRouter -> Ollama -> OpenAI).
    Returns parsed JSON dict on success, or None if all providers fail/exhausted.
    """
    providers = get_available_providers()
    if not providers:
        logger.info("[LLM Engine] No external LLM providers configured; utilizing deterministic heuristics.")
        return None

    messages = []
    if system_instruction:
        messages.append({"role": "system", "content": system_instruction})
    messages.append({"role": "user", "content": prompt})

    for provider in providers:
        endpoint = f"{provider.base_url}/chat/completions"
        logger.info(f"[LLM Engine] Calling provider '{provider.name}' ({provider.model})...")

        payload: Dict[str, Any] = {
            "model": provider.model,
            "messages": messages,
            "temperature": temperature,
        }
        if provider.supports_json_object:
            payload["response_format"] = {"type": "json_object"}

        try:
            async with httpx.AsyncClient(timeout=timeout_seconds) as client:
                response = await client.post(
                    endpoint,
                    headers=provider.get_headers(),
                    json=payload,
                )

                if response.status_code == 200:
                    data = response.json()
                    choices = data.get("choices", [])
                    if choices:
                        content = choices[0].get("message", {}).get("content", "")
                        parsed = extract_json_from_llm_response(content)
                        if parsed:
                            logger.info(f"✔ [LLM Engine] Successfully parsed structured response from '{provider.name}'")
                            return parsed
                        else:
                            logger.warning(
                                f"⚠️ [LLM Engine] '{provider.name}' returned non-JSON text. Falling back to next provider."
                            )
                else:
                    logger.warning(
                        f"⚠️ [LLM Engine] '{provider.name}' responded with HTTP {response.status_code}: "
                        f"{response.text[:200]}. Cascading to fallback provider..."
                    )
        except Exception as e:
            logger.warning(f"⚠️ [LLM Engine] Error communicating with '{provider.name}': {e}. Cascading to fallback...")

    logger.warning("❌ [LLM Engine] All configured LLM providers failed or returned unparseable output.")
    return None
