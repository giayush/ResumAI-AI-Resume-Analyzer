"""
ai_service.py — AI feedback via OpenAI GPT-4o, Google Gemini, or mock fallback.

Fixes:
  BUG-19: Robust Gemini code-fence stripping via regex instead of fragile split().
"""

import re
import json
from flask import current_app
import openai
import google.generativeai as genai


def generate_job_description(job_title: str) -> dict:
    """
    Generate a realistic, industry-standard job description for a given title.
    """
    openai_key = current_app.config.get("OPENAI_API_KEY", "")
    gemini_key = current_app.config.get("GEMINI_API_KEY", "")

    if openai_key and not openai_key.startswith("sk-your"):
        try:
            return _openai_jd(job_title, openai_key)
        except Exception as e:
            current_app.logger.warning(f"OpenAI JD failed: {e}. Falling back to Gemini.")

    if gemini_key and not gemini_key.startswith("your-gemini"):
        try:
            return _gemini_jd(job_title, gemini_key)
        except Exception as e:
            current_app.logger.warning(f"Gemini JD failed: {e}")

    return _mock_jd(job_title)


def get_ai_feedback(
    resume_text: str,
    parsed_data: dict,
    job_description: str,
    job_title: str = "",
    missing_keywords: list = None,
) -> dict:
    """
    Orchestrate AI feedback. Try OpenAI first; fall back to Gemini; then mock.
    Always returns a sanitized response with phrasing_improvements as a valid list.
    """
    missing_keywords = missing_keywords or []

    openai_key = current_app.config.get("OPENAI_API_KEY", "")
    gemini_key = current_app.config.get("GEMINI_API_KEY", "")

    if openai_key and not openai_key.startswith("sk-your"):
        try:
            result = _openai_feedback(
                resume_text, parsed_data, job_description, job_title, missing_keywords, openai_key
            )
            return _sanitize_ai_response(result)
        except Exception as e:
            current_app.logger.warning(f"OpenAI failed: {e}. Falling back to Gemini.")

    if gemini_key and not gemini_key.startswith("your-gemini"):
        try:
            result = _gemini_feedback(
                resume_text, parsed_data, job_description, job_title, missing_keywords, gemini_key
            )
            return _sanitize_ai_response(result)
        except Exception as e:
            current_app.logger.warning(f"Gemini failed: {e}")

    return _sanitize_ai_response(_mock_feedback(parsed_data, missing_keywords))


def _sanitize_ai_response(result: dict) -> dict:
    """
    Ensure the AI response always has well-formed fields.
    Prevents frontend from receiving null or wrong-typed values.
    """
    if not isinstance(result, dict):
        result = {}

    # Guarantee phrasing_improvements is a list of {original, improved} dicts
    raw = result.get("phrasing_improvements")
    if not isinstance(raw, list):
        raw = []
    result["phrasing_improvements"] = [
        p for p in raw
        if isinstance(p, dict) and p.get("original") and p.get("improved")
    ]

    # Guarantee other list fields are always lists of strings
    for key in ("summary", "experience", "skills", "overall", "missing_skills_to_add"):
        val = result.get(key)
        if not isinstance(val, list):
            result[key] = []
        else:
            result[key] = [str(v) for v in val if v]

    return result



# ── Prompt Builder ───────────────────────────────────────────────────────────

def _build_prompt(
    resume_text: str,
    parsed_data: dict,
    job_description: str,
    job_title: str,
    missing_keywords: list,
) -> str:
    skills = parsed_data.get("skills", {})
    tech_skills = skills.get("technical", []) if isinstance(skills, dict) else []
    # Truncate inputs to stay within token limits
    resume_excerpt = resume_text[:3500]
    jd_excerpt = job_description[:2000]

    return f"""You are a professional resume coach helping a job seeker improve their resume for a specific role.

## Resume (excerpt)
{resume_excerpt}

## Target Role
Title: {job_title or 'Not specified'}
Job Description (excerpt): {jd_excerpt}

## Missing Keywords (not found in resume)
{', '.join(missing_keywords[:20]) or 'None identified'}

## Candidate's Current Technical Skills
{', '.join(tech_skills[:20]) or 'None detected'}

## Instructions
Provide specific, actionable improvement suggestions. Focus on WHAT the candidate should change, not generic advice.
Respond ONLY with valid JSON matching this exact schema — no markdown, no explanation:

{{
  "summary": ["improvement tip 1", "improvement tip 2"],
  "experience": ["tip 1", "tip 2", "tip 3"],
  "skills": ["tip 1", "tip 2"],
  "overall": ["tip 1", "tip 2"],
  "missing_skills_to_add": ["skill1", "skill2", "skill3"],
  "phrasing_improvements": [
    {{"original": "Worked on projects", "improved": "Engineered 3 production-level microservices serving 50k+ users"}}
  ]
}}"""


def _build_jd_prompt(job_title: str) -> str:
    return f"""You are a senior technical recruiter and hiring manager. Generate a realistic, industry-standard job description for the role: "{job_title}".

## Requirements:
1. Ensure the JD is professional and matches real hiring standards (do not simplify for students).
2. Adjust expectations and experience levels based on the title (e.g., Intern vs. Senior vs. Lead).
3. Include modern industry tools, frameworks, and technologies relevant to the role.
4. Use ATS-friendly keywords and specific terminology.

## Output Structure (JSON only):
{{
  "job_title": "{job_title}",
  "job_summary": "2-3 sentences providing high-level overview of the role and team impact.",
  "responsibilities": ["6-10 bullet points starting with strong action verbs"],
  "required_skills": ["8-12 technical and soft skills, tools, and platforms"],
  "preferred_skills": ["4-6 'nice-to-have' advanced skills or specific tool experience"],
  "qualifications": ["Educational requirements (e.g., BS in CS) and certifications"],
  "experience": "Specific years of experience and domain expertise required for this seniority level.",
  "full_text": "A complete, formatted markdown version of the JD combining all sections above."
}}

Respond ONLY with valid JSON. No markdown fences outside the JSON string values."""


# ── OpenAI Implementation ─────────────────────────────────────────────────────

def _openai_feedback(resume_text, parsed_data, job_description, job_title, missing_keywords, api_key) -> dict:
    client = openai.OpenAI(api_key=api_key)
    prompt = _build_prompt(resume_text, parsed_data, job_description, job_title, missing_keywords)

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "You are an expert resume coach. Always respond with valid JSON only, no markdown."},
            {"role": "user", "content": prompt},
        ],
        max_tokens=1800,
        temperature=0.65,
        response_format={"type": "json_object"},
    )

    content = response.choices[0].message.content
    result = json.loads(content)
    result["_provider"] = "openai"
    return result


def _openai_jd(job_title: str, api_key: str) -> dict:
    client = openai.OpenAI(api_key=api_key)
    prompt = _build_jd_prompt(job_title)

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "You are a professional hiring manager. Respond with valid JSON only."},
            {"role": "user", "content": prompt},
        ],
        max_tokens=2000,
        temperature=0.7,
        response_format={"type": "json_object"},
    )

    content = response.choices[0].message.content
    result = json.loads(content)
    result["_provider"] = "openai"
    return result


# ── Gemini Implementation ─────────────────────────────────────────────────────

# BUG-19 FIX: Robust code-fence removal using regex
_FENCE_RE = re.compile(r"^```(?:json)?\s*\n?(.*?)\n?```\s*$", re.DOTALL | re.IGNORECASE)


def _strip_fences(text: str) -> str:
    """Remove markdown code fences from Gemini response robustly."""
    text = text.strip()
    match = _FENCE_RE.match(text)
    if match:
        return match.group(1).strip()
    # Also try stripping just opening/closing ``` without full regex
    if text.startswith("```"):
        lines = text.split("\n")
        # Remove first line (``` or ```json)
        lines = lines[1:]
        # Remove last line if it ends with ```
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        text = "\n".join(lines).strip()
    return text


def _gemini_feedback(resume_text, parsed_data, job_description, job_title, missing_keywords, api_key) -> dict:
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel("gemini-1.5-flash")

    prompt = _build_prompt(resume_text, parsed_data, job_description, job_title, missing_keywords)
    full_prompt = f"You are an expert resume coach. Respond with valid JSON only — no markdown, no explanation.\n\n{prompt}"

    response = model.generate_content(full_prompt)
    raw = _strip_fences(response.text)

    result = json.loads(raw)
    result["_provider"] = "gemini"
    return result


def _gemini_jd(job_title: str, api_key: str) -> dict:
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel("gemini-1.5-flash")

    prompt = _build_jd_prompt(job_title)
    full_prompt = f"Respond with valid JSON only — no explanation.\n\n{prompt}"

    response = model.generate_content(full_prompt)
    raw = _strip_fences(response.text)

    result = json.loads(raw)
    result["_provider"] = "gemini"
    return result


# ── Mock Fallback ─────────────────────────────────────────────────────────────

def _mock_feedback(parsed_data: dict, missing_keywords: list) -> dict:
    import random
    mk = missing_keywords[:5]
    tech_skills = (parsed_data.get("skills", {}).get("technical", []) or [])[:3]
    
    summary_tips = [
        "Include your years of experience, key specializations, and one standout achievement.",
        "Add a compelling 2-3 sentence professional summary that highlights your unique value proposition.",
        "Ensure your summary specifically mentions your expertise in " + (", ".join(tech_skills) if tech_skills else "your core technology stack") + ".",
    ]
    
    exp_tips = [
        "Start every bullet point with a strong action verb (Built, Led, Optimized, Reduced, Launched).",
        "Quantify every achievement: add numbers, percentages, or monetary impact (e.g., 'Reduced load time by 40%').",
        "Tailor experience bullets to mirror keywords from the job description.",
        "Highlight your leadership experience or mentorship of junior developers."
    ]
    
    skill_tips = [
        f"Add these missing skills to your skills section: {', '.join(mk)}." if mk else "Your skills section looks comprehensive.",
        "Group skills by category: Languages, Frameworks, Cloud/DevOps, Databases for better ATS parsing.",
        "Ensure certifications are clearly listed with the issuing authority and date.",
    ]

    return {
        "summary": random.sample(summary_tips, 2),
        "experience": random.sample(exp_tips, 3),
        "skills": random.sample(skill_tips, 2),
        "overall": [
            "Keep resume to 1-2 pages. Trim outdated experience (> 10 years) to a brief mention.",
            "Use consistent formatting: same font, bullet style, and date formats throughout.",
            "Ensure your resume filename is professional: 'FirstName_LastName_Resume.pdf'.",
        ],
        "missing_skills_to_add": mk,
        "phrasing_improvements": [
            {"original": "Worked on projects", "improved": f"Engineered 3 production-level systems using {tech_skills[0] if tech_skills else 'modern frameworks'}"},
            {"original": "Worked on database optimization", "improved": "Optimized PostgreSQL query performance, reducing average response time by 65%"},
        ],
        "_provider": "mock-dynamic",
    }


def _mock_jd(job_title: str) -> dict:
    """Mock fallback for JD generation."""
    title_lower = job_title.lower()
    exp = "3-5 years"
    if any(k in title_lower for k in ["senior", "lead", "manager"]): exp = "7+ years"
    if any(k in title_lower for k in ["junior", "associate"]): exp = "1-3 years"
    if "intern" in title_lower: exp = "Currently enrolled in or recently graduated from a relevant degree program"

    return {
        "job_title": job_title,
        "job_summary": f"We are seeking a highly motivated {job_title} to join our growing engineering team. You will be responsible for developing scalable solutions and collaborating with cross-functional teams to deliver high-quality products.",
        "responsibilities": [
            "Develop and maintain high-performance software applications.",
            "Collaborate with product managers and designers to define requirements.",
            "Write clean, documented, and testable code.",
            "Troubleshoot and debug complex issues in production environments.",
            "Participate in code reviews and advocate for best practices.",
            "Optimize application performance for maximum speed and scalability."
        ],
        "required_skills": [
            "Analytical thinking and problem-solving skills.",
            "Strong communication and teamwork abilities.",
            "Experience with agile development methodologies.",
            "Version control systems like Git.",
            "Knowledge of modern software development life cycle (SDLC)."
        ],
        "preferred_skills": [
            "Experience with cloud platforms (AWS/GCP/Azure).",
            "Knowledge of containerization tools like Docker or Kubernetes."
        ],
        "qualifications": ["Bachelor’s degree in Computer Science, Information Technology, or a related field."],
        "experience": exp,
        "full_text": f"### {job_title}\n\nSeeking a {job_title} with {exp} experience to build great things.",
        "_provider": "mock"
    }
