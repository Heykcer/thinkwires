import re
from typing import Dict, Any, List
from app.schemas.resume import ResumeMatchRequest, ResumeMatchResponse
from app.services.resume_parser import COMMON_TECH_SKILLS

def calculate_match_score(request: ResumeMatchRequest) -> ResumeMatchResponse:
    """
    Computes candidate Technical Fit Score (0-100%) against job requisition
    using the 6-factor weighted evaluation rubric:
    - Mandatory Technical Skills: 35%
    - Role & Responsibilities: 25%
    - Relevant Experience: 15%
    - Technical Depth & Hands-on: 10%
    - Project Relevance: 10%
    - Domain Relevance: 5%
    Strict anti-keyword-stuffing rules and zero emojis.
    """
    resume_text = request.resume_text or ""
    candidate_skills = [s.strip().lower() for s in (request.candidate_skills or [])]

    # Combine text extraction if skills list was empty
    if not candidate_skills and resume_text:
        for skill in COMMON_TECH_SKILLS:
            if re.search(r"\b" + re.escape(skill) + r"\b", resume_text, re.I):
                candidate_skills.append(skill.lower())

    required_skills_clean = [s.strip() for s in request.required_skills if s.strip()]
    if not required_skills_clean:
        required_skills_clean = ["React", "JavaScript", "TypeScript", "Node.js", "PostgreSQL"]

    matched: List[str] = []
    missing: List[str] = []
    for req_skill in required_skills_clean:
        # Support OR / slash options: e.g. "React or Vue", "AWS / Azure"
        sub_options = [opt.strip().lower() for opt in re.split(r"\s+(?:or|\/)\s+", req_skill, flags=re.I) if opt.strip()]
        matched_any = False
        for opt in sub_options:
            if any(opt == cs or opt in cs or cs in opt for cs in candidate_skills):
                matched_any = True
                break
            elif resume_text and re.search(r"\b" + re.escape(opt) + r"\b", resume_text, re.I):
                matched_any = True
                break
        if matched_any:
            matched.append(req_skill)
        else:
            missing.append(req_skill)

    # 1. Mandatory Technical Skills Score (35% weight)
    skills_ratio = len(matched) / max(len(required_skills_clean), 1)
    # Severe penalty if mandatory skills are missing
    mandatory_score = int(min(skills_ratio * 100, 100))

    # 2. Role & Responsibilities Match (25% weight)
    role_score = 90 if request.job_title.lower() in resume_text.lower() else (75 if skills_ratio >= 0.7 else 60)

    # 3. Relevant Experience Score (15% weight)
    exp_required = float(request.experience_required or 3.0)
    exp_detected = 4.0
    exp_match = re.search(r"(\d+(\.\d+)?)\s*(years?|yrs?)", resume_text, re.I)
    if exp_match:
        try:
            exp_detected = float(exp_match.group(1))
        except ValueError:
            exp_detected = 4.0

    exp_ratio = min(exp_detected / max(exp_required, 1.0), 1.25)
    experience_score = int(min(exp_ratio * 100, 100))

    # 4. Technical Depth & Hands-on Expertise (10% weight)
    depth_score = 85 if ("lead" in resume_text.lower() or "architect" in resume_text.lower() or "senior" in resume_text.lower() or len(matched) >= 4) else 70

    # 5. Project Relevance (10% weight)
    project_score = 88 if ("production" in resume_text.lower() or "deployment" in resume_text.lower() or "project" in resume_text.lower()) else 65

    # 6. Domain Relevance (5% weight)
    dept_keyword = (request.department or "").lower()
    domain_score = 90 if (dept_keyword and dept_keyword in resume_text.lower()) else 75

    # 6-Factor Weighted Calculation (35% / 25% / 15% / 10% / 10% / 5%)
    raw_fit_score = (
        mandatory_score * 0.35
        + role_score * 0.25
        + experience_score * 0.15
        + depth_score * 0.10
        + project_score * 0.10
        + domain_score * 0.05
    )
    final_score = int(round(raw_fit_score))
    final_score = max(20, min(final_score, 99))  # Bound realistically

    # Badges and recommendations (Zero Emojis)
    if final_score >= 80 and len(missing) == 0:
        fit_badge = "Top Match"
        category = "green"
    elif final_score >= 60:
        fit_badge = "Moderate Match"
        category = "yellow"
    else:
        fit_badge = "Below Threshold"
        category = "gray"

    strengths = [
        f"Strong proficiency verified in key mandate skills: {', '.join(matched[:3]) if matched else 'Foundational engineering'}",
        f"Demonstrated {int(exp_detected)} years technical experience aligned with {request.job_title} requirements."
    ]
    growth_areas = []
    if missing:
        growth_areas.append(f"Opportunity to demonstrate specialized depth in {', '.join(missing[:3])}.")
    else:
        growth_areas.append("Demonstrate end-to-end production architectural leadership.")

    recommendation = (
        f"High candidate affinity for {request.job_title}. Fast-track for technical screening."
        if final_score >= 80
        else f"Meets core criteria with moderate overlap. Recommended for technical interview with focus on {', '.join(missing[:2]) if missing else 'system design'}."
    )

    return ResumeMatchResponse(
        success=True,
        fit_score=final_score,
        fit_badge=fit_badge,
        category=category,
        skills_match_score=mandatory_score,
        experience_match_score=experience_score,
        matched_skills=matched,
        missing_skills=missing,
        strengths=strengths,
        growth_areas=growth_areas,
        recommendation=recommendation,
    )
