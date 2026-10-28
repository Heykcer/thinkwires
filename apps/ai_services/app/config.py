import os
import logging
from typing import List
from dotenv import load_dotenv

# Load environment configuration (apps/ai_services/.env first, then root .env if present)
_app_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_local_env = os.path.join(_app_dir, ".env")
_root_env = os.path.join(os.path.dirname(os.path.dirname(_app_dir)), ".env")

if os.path.exists(_local_env):
    load_dotenv(_local_env)
if os.path.exists(_root_env):
    load_dotenv(_root_env)
load_dotenv()

class Settings:
    """Application runtime settings and environment bindings."""
    APP_TITLE: str = "ThinkWires AI Microservice"
    APP_DESCRIPTION: str = "Resume Parsing, ATS Fit Scoring, and AI Screening Assessment Gatekeeper"
    APP_VERSION: str = "1.0.0"
    
    # Server network bindings
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", 8000))
    DEBUG: bool = os.getenv("DEBUG", "false").lower() in ("true", "1", "yes")

    # CORS Allowed Origins
    _DEFAULT_CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:5000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5000",
    ]

    @property
    def CORS_ORIGINS(self) -> List[str]:
        env_origins = os.getenv("CORS_ORIGINS", "")
        parsed = [
            origin.strip()
            for origin in env_origins.split(",")
            if origin.strip() and origin.strip() != "*"
        ]
        return parsed or self._DEFAULT_CORS_ORIGINS

    # Multi-Provider Free LLM Integration
    PRIMARY_LLM_PROVIDER: str = os.getenv("PRIMARY_LLM_PROVIDER", "auto").lower().strip()

    # Free Cloud Provider 1: Groq (Llama 3.3 70B / Llama 3.1 8B)
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "").strip()
    GROQ_MODEL: str = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile").strip()
    GROQ_BASE_URL: str = os.getenv("GROQ_BASE_URL", "https://api.groq.com/openai/v1").strip()

    # Free Cloud Provider 2: Google Gemini (OpenAI Compatibility Mode)
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "").strip()
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-1.5-flash").strip()
    GEMINI_BASE_URL: str = os.getenv("GEMINI_BASE_URL", "https://generativelanguage.googleapis.com/v1beta/openai").strip()

    # Free Cloud Provider 3: OpenRouter
    OPENROUTER_API_KEY: str = os.getenv("OPENROUTER_API_KEY", "").strip()
    OPENROUTER_MODEL: str = os.getenv("OPENROUTER_MODEL", "meta-llama/llama-3.2-3b-instruct:free").strip()
    OPENROUTER_BASE_URL: str = os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1").strip()

    # Free Local Provider: Ollama
    OLLAMA_ENABLED: bool = os.getenv("OLLAMA_ENABLED", "false").lower() in ("true", "1", "yes")
    OLLAMA_BASE_URL: str = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434/v1").strip()
    OLLAMA_MODEL: str = os.getenv("OLLAMA_MODEL", "llama3.2").strip()

    # Generic Custom LLM
    LLM_API_KEY: str = os.getenv("LLM_API_KEY", "").strip()
    LLM_MODEL: str = os.getenv("LLM_MODEL", "").strip()
    LLM_BASE_URL: str = os.getenv("LLM_BASE_URL", "").strip()

    # OpenAI (Optional / Existing Keys)
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "").strip()
    OPENAI_MODEL: str = os.getenv("OPENAI_MODEL", "gpt-4o-mini").strip()
    OPENAI_BASE_URL: str = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1").strip()

    @property
    def is_groq_configured(self) -> bool:
        return bool(self.GROQ_API_KEY and not self.GROQ_API_KEY.startswith("your_"))

    @property
    def is_gemini_configured(self) -> bool:
        return bool(self.GEMINI_API_KEY and not self.GEMINI_API_KEY.startswith("your_"))

    @property
    def is_openrouter_configured(self) -> bool:
        return bool(self.OPENROUTER_API_KEY and not self.OPENROUTER_API_KEY.startswith("your_"))

    @property
    def is_ollama_configured(self) -> bool:
        return self.OLLAMA_ENABLED

    @property
    def is_custom_llm_configured(self) -> bool:
        return bool(self.LLM_BASE_URL and self.LLM_MODEL)

    @property
    def is_openai_configured(self) -> bool:
        return bool(
            self.OPENAI_API_KEY
            and self.OPENAI_API_KEY != "your_openai_key_here"
            and not self.OPENAI_API_KEY.startswith("your_")
        )

    @property
    def is_llm_configured(self) -> bool:
        return (
            self.is_groq_configured
            or self.is_gemini_configured
            or self.is_openrouter_configured
            or self.is_ollama_configured
            or self.is_custom_llm_configured
            or self.is_openai_configured
        )

    @property
    def active_llm_providers(self) -> List[str]:
        active = []
        if self.is_groq_configured:
            active.append("groq")
        if self.is_gemini_configured:
            active.append("gemini")
        if self.is_openrouter_configured:
            active.append("openrouter")
        if self.is_ollama_configured:
            active.append("ollama")
        if self.is_custom_llm_configured:
            active.append("custom")
        if self.is_openai_configured:
            active.append("openai")
        return active

settings = Settings()

# Setup logging
logging.basicConfig(
    level=logging.DEBUG if settings.DEBUG else logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("thinkwires.ai_services")
