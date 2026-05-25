"""
grammar_service.py
──────────────────
Grammar and phrasing check using the free LanguageTool API.
Falls back gracefully if API is unavailable.

FIX: This function is called inside a ThreadPoolExecutor worker thread.
Flask's current_app proxy does NOT work in background threads (no app context).
Config values are now passed as explicit arguments so the thread can safely use them.
"""

import logging
import requests

_log = logging.getLogger(__name__)


def check_grammar(
    text: str,
    language: str = "en-US",
    api_url: str = "https://api.languagetool.org/v2/check",
    api_key: str = "",
) -> list[dict]:
    """
    Send resume text to LanguageTool API and return grammar issues.

    Args:
        text:     Resume plain text.
        language: BCP-47 language tag (default: en-US).
        api_url:  LanguageTool endpoint (pass from Flask config before threading).
        api_key:  Optional premium API key.

    Returns:
        List of issue dicts:
        [{"message": str, "short_message": str, "offset": int,
          "length": int, "context": str, "replacements": list[str]}]
    """
    # Limit text to 20k chars (API limit for free tier)
    text_slice = text[:20000]

    payload = {
        "text": text_slice,
        "language": language,
        "enabledOnly": "false",
        "disabledRules": "WHITESPACE_RULE,CONSECUTIVE_SPACES,EN_QUOTES",
    }
    if api_key:
        payload["apiKey"] = api_key

    try:
        response = requests.post(
            api_url,
            data=payload,
            timeout=15,
            headers={"Accept": "application/json"},
        )
        response.raise_for_status()
        data = response.json()
        matches = data.get("matches", [])
    except Exception as e:
        _log.warning(f"LanguageTool API error: {e}")
        return []

    issues = []
    for match in matches[:30]:  # Cap at 30 issues
        rule = match.get("rule", {})
        # Skip style rules to focus on real errors
        if rule.get("issueType") in ("style", "formatting"):
            continue
        context = match.get("context", {})
        replacements = [r["value"] for r in match.get("replacements", [])[:3]]
        issues.append({
            "message": match.get("message", ""),
            "short_message": rule.get("description", ""),
            "offset": match.get("offset", 0),
            "length": match.get("length", 0),
            "context": context.get("text", ""),
            "replacements": replacements,
            "rule_id": rule.get("id", ""),
        })

    return issues
