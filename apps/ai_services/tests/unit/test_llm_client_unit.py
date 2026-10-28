import pytest
from unittest.mock import patch, AsyncMock
from app.services.llm_client import (
    extract_json_from_llm_response,
    get_available_providers,
    execute_chat_completion_with_fallback,
    LLMProvider,
)
from app.config import settings


def test_extract_json_direct_valid():
    raw = '{"candidate_name": "Alice Smith", "skills": ["Python", "FastAPI"]}'
    res = extract_json_from_llm_response(raw)
    assert res is not None
    assert res["candidate_name"] == "Alice Smith"
    assert res["skills"] == ["Python", "FastAPI"]


def test_extract_json_from_markdown_code_fence():
    raw = """
    Here is the parsed resume data:
    ```json
    {
      "candidate_name": "Bob Jones",
      "skills": ["React", "TypeScript"]
    }
    ```
    Please let me know if you need anything else.
    """
    res = extract_json_from_llm_response(raw)
    assert res is not None
    assert res["candidate_name"] == "Bob Jones"
    assert "React" in res["skills"]


def test_extract_json_from_outermost_brackets():
    raw = 'Sure! Result: {"status": "ok", "experience": 5} Hope this helps!'
    res = extract_json_from_llm_response(raw)
    assert res is not None
    assert res["status"] == "ok"
    assert res["experience"] == 5


def test_extract_json_invalid_returns_none():
    assert extract_json_from_llm_response("Just plain text with no json") is None
    assert extract_json_from_llm_response("") is None
    assert extract_json_from_llm_response(None) is None


def test_provider_headers_generation():
    prov = LLMProvider(
        name="Groq",
        base_url="https://api.groq.com/openai/v1",
        api_key="gsk_test123",
        model="llama-3.3-70b-versatile",
    )
    headers = prov.get_headers()
    assert headers["Authorization"] == "Bearer gsk_test123"
    assert headers["Content-Type"] == "application/json"


@pytest.mark.anyio
async def test_execute_chat_completion_no_providers_returns_none():
    with patch("app.services.llm_client.get_available_providers", return_value=[]):
        res = await execute_chat_completion_with_fallback("Extract resume")
        assert res is None


from unittest.mock import patch, MagicMock

@pytest.mark.anyio
async def test_execute_chat_completion_first_provider_succeeds():
    mock_prov = LLMProvider(
        name="MockGroq",
        base_url="https://api.groq.com/openai/v1",
        api_key="gsk_test",
        model="llama-3.3-70b-versatile",
    )
    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = {
        "choices": [{"message": {"content": '{"name": "Evelyn Vance", "skills": ["Go"]}'}}]
    }

    with patch("app.services.llm_client.get_available_providers", return_value=[mock_prov]), \
         patch("httpx.AsyncClient.post", return_value=mock_resp):
        res = await execute_chat_completion_with_fallback("Test prompt")
        assert res is not None
        assert res["name"] == "Evelyn Vance"


@pytest.mark.anyio
async def test_execute_chat_completion_fallback_when_first_provider_fails():
    prov1 = LLMProvider(name="FailingGroq", base_url="https://fail.com", api_key="k1", model="m1")
    prov2 = LLMProvider(name="FallbackGemini", base_url="https://fallback.com", api_key="k2", model="m2")

    fail_resp = MagicMock()
    fail_resp.status_code = 429
    fail_resp.text = "Rate Limit Exceeded"

    success_resp = MagicMock()
    success_resp.status_code = 200
    success_resp.json.return_value = {
        "choices": [{"message": {"content": '{"name": "Fallback Candidate", "source": "gemini"}'}}]
    }

    async def side_effect(url, **kwargs):
        if "fail.com" in url:
            return fail_resp
        return success_resp

    with patch("app.services.llm_client.get_available_providers", return_value=[prov1, prov2]), \
         patch("httpx.AsyncClient.post", side_effect=side_effect):
        res = await execute_chat_completion_with_fallback("Test fallback prompt")
        assert res is not None
        assert res["name"] == "Fallback Candidate"
        assert res["source"] == "gemini"
