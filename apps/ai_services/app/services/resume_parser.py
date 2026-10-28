import os
import re
import io
import json
from typing import Dict, Any, Optional, List, Tuple
try:
    from pypdf import PdfReader
except ImportError:
    PdfReader = None
import httpx

from app.config import settings, logger
from app.services.llm_client import execute_chat_completion_with_fallback

COMMON_TECH_SKILLS = [
    "JavaScript", "TypeScript", "Python", "React", "Next.js", "Node.js", "Express",
    "PostgreSQL", "MongoDB", "MySQL", "Redis", "Docker", "Kubernetes", "AWS",
    "Azure", "GCP", "GraphQL", "REST APIs", "Tailwind CSS", "Redux", "Git",
    "CI/CD", "FastAPI", "Django", "Flask", "Java", "Spring Boot", "Spring", "C#", ".NET",
    "C++", "Go", "Rust", "Linux", "Microservices", "Kafka", "Elasticsearch", "Three.js",
    "TensorFlow", "PyTorch", "Pandas", "Scikit-Learn", "HTML5", "CSS3", "Jest",
    "Terraform", "Ansible", "Helm", "Prometheus", "Grafana", "SQL", "Postman",
    "Data Structures", "Algorithms", "Object-Oriented Design", "Unit Testing",
    "SOAP Web Services", "Relational Database Design", "Vue.js", "Angular"
]

def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extracts text streams from uploaded PDF bytes using pypdf."""
    text, _ = extract_text_and_links_from_pdf(file_bytes)
    return text

def extract_text_and_links_from_pdf(file_bytes: bytes) -> Tuple[str, List[str]]:
    """Extracts text streams and annotation URIs from uploaded PDF bytes using pypdf."""
    extracted_text = []
    links = []
    try:
        if PdfReader is None:
            logger.warning("pypdf is not installed. PDF text extraction fallback engaged.")
            return "", []
        reader = PdfReader(io.BytesIO(file_bytes))
        for page in reader.pages:
            text = page.extract_text()
            if text:
                extracted_text.append(text)
            if "/Annots" in page:
                try:
                    for annot in page["/Annots"]:
                        obj = annot.get_object()
                        if isinstance(obj, dict) and "/A" in obj and "/URI" in obj["/A"]:
                            uri = str(obj["/A"]["/URI"]).strip()
                            if uri:
                                links.append(uri)
                except Exception:
                    pass
        return "\n".join(extracted_text), links
    except Exception as e:
        logger.warning(f"pypdf extraction error: {e}")
        return "", []

def extract_summary_from_text(raw_text: str) -> str:
    """Attempts to isolate summary / about me section from resume text."""
    summary_match = re.search(
        r"(?:PROFESSIONAL SUMMARY|SUMMARY|ABOUT ME|PROFILE)[\s:\-\n]+(.*?)(?=\n[A-Z\s]{4,}|\Z)",
        raw_text,
        re.DOTALL | re.IGNORECASE,
    )
    if summary_match:
        extracted = summary_match.group(1).strip()
        cleaned = re.sub(r"\s+", " ", extracted)
        if len(cleaned) > 30:
            return cleaned[:300]
    return ""

def heuristic_parse_resume(raw_text: str, links: Optional[List[str]] = None) -> Dict[str, Any]:
    """Robust heuristic rule-based extractor for resume data."""
    if links is None:
        links = []
    lines = [line.strip() for line in raw_text.split("\n") if line.strip()]

    # 1. Email extraction
    email = ""
    email_match = re.search(r"[\w\.-]+@[\w\.-]+\.\w+", raw_text)
    if email_match:
        email = email_match.group(0).lower()
    else:
        for link in links:
            if link.startswith("mailto:"):
                email = link.replace("mailto:", "").split("?")[0].strip().lower()
                break

    # 2. Phone extraction
    phone = ""
    phone_match = re.search(
        r"(\+?\d{1,3}[\s-]?)?\(?\d{2,4}\)?[\s-]?\d{3,5}[\s-]?\d{4,5}|\+?\d{10,12}",
        raw_text,
    )
    if phone_match:
        phone = phone_match.group(0).strip()

    # 3. Candidate Name
    candidate_name = ""
    for line in lines[:6]:
        # Filter out lines with emails, links, or section headings
        if re.search(r"@|linkedin|github|resume|curriculum|vitae|http|phone|\+?\d{9,}", line, re.I):
            continue
        cleaned = re.sub(r"[^\w\s\.-]", "", line).strip()
        words = cleaned.split()
        if 1 <= len(words) <= 4:
            candidate_name = cleaned
            break

    if not candidate_name:
        candidate_name = "Applicant"

    if candidate_name.isupper() and len(candidate_name) > 3:
        candidate_name = candidate_name.title()

    name_parts = candidate_name.split()
    first_name = name_parts[0] if name_parts else "Applicant"
    last_name = " ".join(name_parts[1:]) if len(name_parts) > 1 else ""

    # 4. LinkedIn & GitHub & Portfolio Links
    linkedin_url = ""
    github_url = ""
    portfolio_url = ""

    # Check extracted annotation links first
    for link in links:
        if "linkedin.com/in/" in link and not linkedin_url:
            linkedin_url = link
        elif "github.com/" in link and not github_url:
            github_url = link
        elif any(domain in link for domain in [".vercel.app", ".netlify.app", "portfolio", ".dev", ".me"]) and not portfolio_url:
            portfolio_url = link

    # Fallback to regex in raw text
    if not linkedin_url:
        linkedin_match = re.search(r"(https?://)?(www\.)?linkedin\.com/in/[\w-]+/?", raw_text, re.I)
        if linkedin_match:
            linkedin_url = linkedin_match.group(0)

    if not github_url:
        github_match = re.search(r"(https?://)?(www\.)?github\.com/[\w-]+/?", raw_text, re.I)
        if github_match:
            github_url = github_match.group(0)

    # 5. Technical Skills matching
    matched_skills = []
    seen = set()
    for skill in COMMON_TECH_SKILLS:
        pattern = r"(?<!\w)" + re.escape(skill) + r"(?!\w)"
        if re.search(pattern, raw_text, re.I):
            canonical = skill
            if canonical.lower() not in seen:
                seen.add(canonical.lower())
                matched_skills.append(canonical)

    # 6. Experience extraction
    exp_years = 1.0
    exp_match = re.search(r"(\d+(\.\d+)?)\+?\s*(years?|yrs?)\b", raw_text, re.I)
    if exp_match:
        try:
            exp_years = float(exp_match.group(1))
        except ValueError:
            exp_years = 2.0
    else:
        # Heuristic based on presence of internships or student years
        if re.search(r"\b(intern|internship|undergraduate|student|fresher|junior)\b", raw_text, re.I):
            exp_years = 1.0
        elif re.search(r"\b(senior|lead|architect|staff)\b", raw_text, re.I):
            exp_years = 5.0
        else:
            exp_years = 2.5

    # 7. Role / Headline
    role_titles = [
        "Full Stack Developer", "Full Stack Engineer", "Software Engineer", "Frontend Developer",
        "Backend Developer", "MERN Stack Developer", "Java Developer", "Python Developer",
        "DevOps Engineer", "Data Scientist", "System Architect", "Cloud Engineer"
    ]
    current_role = ""
    for title in role_titles:
        if re.search(r"\b" + re.escape(title) + r"\b", raw_text, re.I):
            current_role = title
            break

    if not current_role:
        if "React" in matched_skills and "Node.js" in matched_skills:
            current_role = "Full Stack Engineer"
        elif "Python" in matched_skills or "Java" in matched_skills:
            current_role = "Backend Software Engineer"
        elif "React" in matched_skills:
            current_role = "Frontend Developer"
        else:
            current_role = "Software Engineer"

    # 8. Location extraction
    header_block = "\n".join(lines[:6])
    location = ""
    # Look for City, State / City, Country pattern
    loc_match = re.search(
        r"([A-Z][a-zA-Z ]{2,20}),\s*([A-Z][a-zA-Z ]{2,20})",
        header_block,
    )
    if loc_match:
        potential_city = loc_match.group(1).strip()
        potential_state = loc_match.group(2).strip().split("\n")[0].strip()
        # Avoid false positives with common headings
        if not re.search(r"phone|email|skills|summary|education|project", potential_city + potential_state, re.I):
            location = f"{potential_city}, {potential_state}"

    if not location:
        known_locations = [
            "Bhubaneswar", "Bangalore", "Bengaluru", "Hyderabad", "Mumbai", "Pune",
            "Delhi", "Noida", "Gurgaon", "Chennai", "Kolkata", "New York", "San Francisco",
            "Austin", "London", "Toronto", "Berlin", "Remote", "India", "USA"
        ]
        for loc in known_locations:
            if re.search(r"\b" + re.escape(loc) + r"\b", header_block, re.I):
                location = loc
                break

    if not location:
        location = "Remote"

    # 9. Summary extraction
    summary = extract_summary_from_text(raw_text)
    if not summary:
        top_skills = ", ".join(matched_skills[:4]) if matched_skills else "modern software technologies"
        summary = f"Accomplished {current_role} with hands-on expertise building scalable solutions using {top_skills}."

    headline_skills = ", ".join(matched_skills[:3]) if matched_skills else "Full Stack Development"
    headline = f"{current_role} | {headline_skills}"

    return {
        "candidate_name": candidate_name,
        "first_name": first_name,
        "last_name": last_name,
        "email": email,
        "phone": phone,
        "location": location,
        "headline": headline,
        "current_role": current_role,
        "total_experience_years": exp_years,
        "skills": matched_skills,
        "skill_set": ", ".join(matched_skills),
        "linkedin_url": linkedin_url,
        "github_url": github_url,
        "portfolio_url": portfolio_url,
        "summary": summary,
    }

async def parse_resume_content(
    file_bytes: Optional[bytes] = None,
    filename: Optional[str] = None,
    raw_text: Optional[str] = None,
    file_path: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Parses resume content from PDF bytes, raw text, or a file path.
    Uses OpenAI LLM if configured; otherwise gracefully executes rule-based heuristic parsing.
    """
    extracted_text = ""
    extracted_links = []

    if file_bytes and filename:
        if filename.lower().endswith(".pdf"):
            extracted_text, extracted_links = extract_text_and_links_from_pdf(file_bytes)
        else:
            try:
                extracted_text = file_bytes.decode("utf-8", errors="ignore")
            except Exception:
                extracted_text = ""

    if not extracted_text and file_path and os.path.exists(file_path):
        if file_path.lower().endswith(".pdf"):
            with open(file_path, "rb") as f:
                extracted_text, extracted_links = extract_text_and_links_from_pdf(f.read())
        else:
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                extracted_text = f.read()

    if not extracted_text and raw_text:
        extracted_text = raw_text

    if not extracted_text:
        extracted_text = (
            "Senior Full Stack Software Engineer with 5+ years of experience in React, Node.js, TypeScript, "
            "PostgreSQL, Docker, and AWS cloud deployments. Email: candidate@example.com, Phone: +1-555-0199."
        )

    parsed_data = None
    if settings.is_llm_configured:
        prompt = f"""
        You are an expert HR ATS Resume Parser. Extract structured details from the following resume text:
        Resume Text:
        {extracted_text[:4000]}

        Respond STRICTLY with a valid JSON object matching this schema:
        {{
          "candidate_name": "Full Name",
          "first_name": "First",
          "last_name": "Last",
          "email": "email",
          "phone": "phone",
          "location": "location",
          "headline": "Professional Headline",
          "current_role": "Current Job Role",
          "total_experience_years": 4.5,
          "skills": ["Skill1", "Skill2"],
          "linkedin_url": "url",
          "github_url": "url",
          "summary": "Short 2-line summary"
        }}
        """
        parsed_data = await execute_chat_completion_with_fallback(
            prompt=prompt,
            system_instruction="You are an expert HR ATS resume parsing engine that outputs valid JSON only.",
            timeout_seconds=15.0,
            temperature=0.1,
        )
        if parsed_data:
            if isinstance(parsed_data.get("skills"), list):
                parsed_data["skill_set"] = ", ".join(parsed_data.get("skills", []))
            elif isinstance(parsed_data.get("skills"), str):
                parsed_data["skill_set"] = parsed_data["skills"]
                parsed_data["skills"] = [s.strip() for s in parsed_data["skills"].split(",") if s.strip()]

    if not parsed_data:
        parsed_data = heuristic_parse_resume(extracted_text, links=extracted_links)
    elif extracted_links:
        # Merge any PDF annotation links discovered
        for link in extracted_links:
            if "linkedin.com/in" in link and not parsed_data.get("linkedin_url"):
                parsed_data["linkedin_url"] = link
            elif "github.com/" in link and not parsed_data.get("github_url"):
                parsed_data["github_url"] = link
            elif not parsed_data.get("portfolio_url"):
                parsed_data["portfolio_url"] = link

    return {
        "raw_text": extracted_text[:3000],
        **parsed_data,
    }
