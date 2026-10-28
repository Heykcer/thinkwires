import fs from 'fs';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import Candidate from '../models/candidate.mongo.model.js';
import JobApplication from '../models/jobApplication.mongo.model.js';
import JobRequirement from '../models/job.mongo.model.js';
import { sendRecruitmentNotificationEmail } from '../utils/recruitmentEmail.util.js';
import aiService from '../services/ai.service.js';

// Fallback in-memory application store for local development if MongoDB is absent
const localDevApplications = [];

/**
 * Validate and sanitize external URL strings to prevent Stored XSS via javascript: or data: schemes
 */
export const sanitizeSafeUrl = (urlStr) => {
  if (!urlStr || typeof urlStr !== 'string') return '';
  const trimmed = urlStr.trim();
  if (!trimmed) return '';
  // Only allow http://, https://, or root-relative paths
  if (/^(https?:\/\/|\/)/i.test(trimmed)) {
    return trimmed;
  }
  // Automatically prepend https:// to plain domain names (e.g. github.com/user)
  if (/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(trimmed)) {
    return `https://${trimmed}`;
  }
  return '';
};

/**
 * Get Candidate Dashboard Data
 * GET /api/candidate/dashboard
 */
export const getCandidateDashboard = async (req, res) => {
  try {
    const candidateId = req.candidate._id || req.candidate.id;

    let applications = [];
    let candidateData = req.candidate;

    if (mongoose.connection.readyState === 1) {
      applications = await JobApplication.find({ candidate: candidateId })
        .sort({ createdAt: -1 })
        .lean();

      const freshCandidate =
        await Candidate.findById(candidateId).select('-password');
      if (freshCandidate) candidateData = freshCandidate;
    } else {
      applications = localDevApplications.filter(
        (app) => String(app.candidate) === String(candidateId)
      );
    }

    return res.status(200).json({
      success: true,
      profile: candidateData,
      metrics: {
        totalApplications: applications.length,
        inReview: applications.filter(
          (a) => a.status === 'Applied' || a.status === 'Screening'
        ).length,
        interviewing: applications.filter((a) => a.status === 'Interview')
          .length,
        offers: applications.filter((a) => a.status === 'Offered').length,
      },
      recentApplications: applications.slice(0, 5),
    });
  } catch (error) {
    console.error('Candidate dashboard fetch error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to load candidate dashboard data.',
    });
  }
};

/**
 * Update Candidate Profile
 * PUT /api/candidate/profile
 */
export const updateCandidateProfile = async (req, res) => {
  try {
    const candidateId = req.candidate._id || req.candidate.id;
    const {
      name,
      phone,
      headline,
      location,
      currentRole,
      technicalSkills,
      experience,
      expectedSalary,
      bio,
      githubUrl,
      linkedinUrl,
      portfolioUrl,
      workMode,
    } = req.body;

    const updateFields = {};
    if (name !== undefined) updateFields.name = name.trim();
    if (phone !== undefined) updateFields.phone = phone.trim();
    if (headline !== undefined) updateFields.headline = headline;
    if (location !== undefined) updateFields.location = location;
    if (currentRole !== undefined) updateFields.currentRole = currentRole;
    if (workMode !== undefined) updateFields.workMode = workMode;
    if (technicalSkills !== undefined) {
      updateFields.technicalSkills = Array.isArray(technicalSkills)
        ? technicalSkills
        : technicalSkills
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);
    }
    if (experience !== undefined)
      updateFields.experience = Number(experience) || 0;
    if (expectedSalary !== undefined)
      updateFields.expectedSalary = expectedSalary;
    if (bio !== undefined) updateFields.bio = bio;
    if (githubUrl !== undefined) updateFields.githubUrl = sanitizeSafeUrl(githubUrl);
    if (linkedinUrl !== undefined) updateFields.linkedinUrl = sanitizeSafeUrl(linkedinUrl);
    if (portfolioUrl !== undefined) updateFields.portfolioUrl = sanitizeSafeUrl(portfolioUrl);

    let updatedCandidate;
    if (mongoose.connection.readyState === 1) {
      updatedCandidate = await Candidate.findByIdAndUpdate(
        candidateId,
        { $set: updateFields },
        { new: true, runValidators: true }
      ).select('-password -resetPasswordToken -resetPasswordExpire');
    } else {
      updatedCandidate = {
        ...req.candidate,
        ...updateFields,
      };
    }

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully!',
      candidate: updatedCandidate,
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update candidate profile. Please try again.',
    });
  }
};

/**
 * Get Candidate's Applications
 * GET /api/candidate/applications
 */
export const getMyApplications = async (req, res) => {
  try {
    const candidateId = req.candidate._id || req.candidate.id;

    let applications = [];
    if (mongoose.connection.readyState === 1) {
      applications = await JobApplication.find({ candidate: candidateId })
        .sort({ createdAt: -1 })
        .lean();
    } else {
      applications = localDevApplications.filter(
        (app) => String(app.candidate) === String(candidateId)
      );
    }

    return res.status(200).json({
      success: true,
      applications,
    });
  } catch (error) {
    console.error('Get applications error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve your job applications.',
    });
  }
};

/**
 * Submit Job Application
 * POST /api/candidate/apply
 */
/**
 * Submit Job Application
 * POST /api/candidate/apply
 * Supports both application/json and multipart/form-data (with resume file upload)
 */
export const applyForJob = async (req, res) => {
  try {
    let candidate = req.candidate || null;
    let candidateId = candidate ? candidate._id || candidate.id : null;

    const {
      jobId,
      jobTitle,
      department,
      location,
      employmentType,
      postingDate,
      lastName,
      firstName,
      mobileNumber,
      email,
      applicationType,
      noticePeriod,
      city,
      state,
      totalExperienceYears,
      relevantExperienceYears,
      currentEmployer,
      currentCTC,
      expectedCTC,
      skillSet,
      linkedInLink,
      facebookLink,
      candidateNote,
      agreedToTerms,
      experience,
      skills,
      coverLetter,
      resumeUrl: clientResumeUrl,
    } = req.body;

    if (!jobId || !jobTitle) {
      return res.status(400).json({
        success: false,
        error: 'Job ID and Job Title are required.',
      });
    }

    const resolvedLastName = (lastName || '').trim();
    const resolvedFirstName = (firstName || '').trim();
    const resolvedMobile = (
      mobileNumber ||
      (candidate && candidate.phone) ||
      ''
    ).trim();
    const resolvedEmail = (email || (candidate && candidate.email) || '')
      .trim()
      .toLowerCase();

    if (
      !resolvedLastName ||
      !resolvedFirstName ||
      !resolvedEmail ||
      !resolvedMobile
    ) {
      return res.status(400).json({
        success: false,
        error: 'First Name, Last Name, Email, and Mobile Number are required.',
      });
    }

    if (agreedToTerms !== 'true' && agreedToTerms !== true) {
      return res.status(400).json({
        success: false,
        error:
          'You must agree to the Terms & Conditions and Privacy Policy to submit your application.',
      });
    }

    // Handle uploaded file if present
    const uploadedFile = req.file;
    const resumeOriginalName = uploadedFile
      ? uploadedFile.originalname
      : req.body.resumeOriginalName || '';
    const resumeFileName = uploadedFile
      ? uploadedFile.filename
      : req.body.resumeFileName || resumeOriginalName || '';
    const resumePath = uploadedFile ? uploadedFile.path : '';
    const finalResumeUrl = uploadedFile
      ? `/uploads/resumes/${uploadedFile.filename}`
      : clientResumeUrl || (candidate && candidate.resumeUrl) || '';

    // Parse skills array
    let parsedSkills = [];
    if (Array.isArray(skills)) {
      parsedSkills = skills;
    } else if (typeof skills === 'string' && skills.trim()) {
      parsedSkills = skills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    } else if (skillSet) {
      parsedSkills = skillSet
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    }

    // Strictly require logged-in candidate authentication (No guest applies)
    if (!candidateId) {
      return res.status(401).json({
        success: false,
        authenticated: false,
        error:
          'Authentication required. Only logged-in candidates can apply for jobs.',
      });
    }

    // Enforce single active submission per job opening
    if (mongoose.connection.readyState === 1) {
      const existingApplication = await JobApplication.findOne({
        $or: [
          { candidate: candidateId, jobId: String(jobId) },
          { email: resolvedEmail, jobId: String(jobId) },
        ],
      });

      if (existingApplication) {
        return res.status(409).json({
          success: false,
          error: `You have already applied for "${jobTitle}". Your application is currently under review.`,
          existingApplication,
        });
      }

      let matchScoreResult = {
        fit_score: 85,
        fit_badge: 'Top Match',
        skills_match_score: 85,
        experience_match_score: 90,
        matched_skills: parsedSkills,
        missing_skills: [],
        strengths: ['Verified engineering proficiency in core mandate stack'],
        growth_areas: [],
        recommendation: 'Recommended for technical evaluation',
      };

      try {
        matchScoreResult = await aiService.calculateMatchScore(
          {
            skills: parsedSkills,
            resumeText:
              candidateNote ||
              coverLetter ||
              `${skillSet} ${currentEmployer} ${totalExperienceYears} years`,
          },
          {
            jobTitle,
            department,
            requiredSkills: parsedSkills,
            experienceRequired: Number(totalExperienceYears) || 3,
          }
        );
      } catch (aiErr) {
        console.warn('AI Match score non-blocking warning:', aiErr.message);
      }

      let assessmentResult = null;
      try {
        assessmentResult = await aiService.generateAssessment(
          {
            jobId,
            jobTitle,
            department,
            requiredSkills: parsedSkills,
          },
          {
            name: `${resolvedFirstName} ${resolvedLastName}`,
            skills: parsedSkills,
          }
        );
      } catch (aiErr) {
        console.warn(
          'AI Assessment generator non-blocking warning:',
          aiErr.message
        );
      }

      let evaluationReportResult = null;
      try {
        evaluationReportResult = await aiService.evaluateCandidate(
          {
            candidateName: `${resolvedFirstName} ${resolvedLastName}`.trim(),
            skills: parsedSkills,
            resumeText:
              candidateNote ||
              coverLetter ||
              `${skillSet} ${currentEmployer} ${totalExperienceYears} years`,
            experience: totalExperienceYears || experience || 3,
            totalExperienceYears: totalExperienceYears || experience || 3,
            noticePeriod,
            expectedSalary: expectedCTC || '',
          },
          {
            jobTitle,
            department: department || 'Engineering',
            company: 'Thinkwires Enterprise Client',
            requiredSkills: parsedSkills,
            experienceRequired: Number(totalExperienceYears) || 3,
          }
        );
      } catch (evalErr) {
        console.warn('AI Evaluation report non-blocking warning:', evalErr.message);
      }

      const deptPrefix = (department || 'ENG').substring(0, 3).toUpperCase();
      const randomSuffix = Math.floor(100 + Math.random() * 900);
      const generatedAnonymousCode = `TW-${deptPrefix}-${randomSuffix}`;
      const candidateAvatar = (candidate && candidate.avatarUrl) || '';

      const application = await JobApplication.create({
        candidate: candidateId,
        jobId: String(jobId),
        jobTitle,
        department: department || 'Engineering',
        location: location || 'Remote',
        employmentType: employmentType || 'Permanent',
        postingDate: postingDate || '',
        resumeOriginalName,
        resumeFileName,
        resumePath,
        resumeUrl: finalResumeUrl,
        avatarUrl: candidateAvatar,
        anonymousCode: generatedAnonymousCode,
        lastName: resolvedLastName,
        firstName: resolvedFirstName,
        mobileNumber: resolvedMobile,
        email: resolvedEmail,
        applicationType: applicationType || 'Permanent',
        noticePeriod: noticePeriod || 'Immediate',
        city: (city || '').trim(),
        state: (state || '').trim(),
        totalExperienceYears: totalExperienceYears || experience || '',
        relevantExperienceYears: relevantExperienceYears || '',
        currentEmployer: (currentEmployer || '').trim(),
        currentCTC: (currentCTC || '').trim(),
        expectedCTC: (expectedCTC || '').trim(),
        skillSet: skillSet || parsedSkills.join(', '),
        skills: parsedSkills,
        linkedInLink: (linkedInLink || '').trim(),
        facebookLink: (facebookLink || '').trim(),
        candidateNote: (candidateNote || coverLetter || '').trim(),
        agreedToTerms: agreedToTerms === 'true' || agreedToTerms === true,
        agreedAt:
          agreedToTerms === 'true' || agreedToTerms === true
            ? new Date()
            : null,
        candidateName: `${resolvedFirstName} ${resolvedLastName}`.trim(),
        candidateEmail: resolvedEmail,
        candidatePhone: resolvedMobile,
        experience: totalExperienceYears
          ? `${totalExperienceYears} Years`
          : experience || '3 - 5 Years',
        coverLetter: candidateNote || coverLetter || '',
        fitScore: (evaluationReportResult && evaluationReportResult.overallMatchScore) || matchScoreResult.fit_score,
        fitBadge: (evaluationReportResult && evaluationReportResult.overallMatchTier === 'Strong Fit') ? 'Top Match' : matchScoreResult.fit_badge,
        aiAnalysis: {
          skillsMatch: matchScoreResult.skills_match_score || 0,
          experienceMatch: matchScoreResult.experience_match_score || 0,
          matchedSkills: matchScoreResult.matched_skills || [],
          missingSkills: matchScoreResult.missing_skills || [],
          strengths: (evaluationReportResult && evaluationReportResult.strengths) || matchScoreResult.strengths || [],
          growthAreas: (evaluationReportResult && evaluationReportResult.gapsAndRisks?.technicalGaps) || matchScoreResult.growth_areas || [],
          recommendation: (evaluationReportResult && evaluationReportResult.recommendation) || matchScoreResult.recommendation || '',
        },
        evaluationReport: evaluationReportResult || {},
        assessment: assessmentResult || {},
        assessmentStatus: 'Not Started',
        status: 'Applied',
        stage: 'Application Received',
        emailNotificationStatus: 'Pending',
      });

      if (mongoose.connection.readyState === 1) {
        const candidateUpdates = {
          fitScore: matchScoreResult.fit_score,
          status: 'Applied',
        };
        const resolvedFullName =
          `${resolvedFirstName} ${resolvedLastName}`.trim();
        if (resolvedFullName && resolvedFullName !== 'Applicant Candidate') {
          candidateUpdates.name = resolvedFullName;
        }
        if (resolvedMobile) candidateUpdates.phone = resolvedMobile;
        if (city && state) candidateUpdates.location = `${city}, ${state}`;
        else if (city || state) candidateUpdates.location = city || state;
        if (finalResumeUrl) candidateUpdates.resumeUrl = finalResumeUrl;
        if (parsedSkills.length > 0)
          candidateUpdates.technicalSkills = parsedSkills;
        if (currentEmployer) candidateUpdates.currentRole = currentEmployer;
        if (totalExperienceYears)
          candidateUpdates.experience = Number(totalExperienceYears) || 1;
        if (expectedCTC) candidateUpdates.expectedSalary = expectedCTC;

        Candidate.findByIdAndUpdate(candidateId, candidateUpdates).catch(
          (err) => console.warn('Candidate profile update error:', err.message)
        );
      }

      // Dispatch automated recruitment email asynchronously
      sendRecruitmentNotificationEmail(
        {
          jobTitle,
          location,
          employmentType,
          postingDate,
          resumeFileName:
            resumeOriginalName || resumeFileName || 'Resume Attached',
          lastName: resolvedLastName,
          firstName: resolvedFirstName,
          mobileNumber: resolvedMobile,
          email: resolvedEmail,
          applicationType: applicationType || 'Permanent',
          noticePeriod: noticePeriod || 'Immediate',
          city,
          state,
          totalExperienceYears: totalExperienceYears || experience || '0',
          relevantExperienceYears: relevantExperienceYears || '0',
          currentEmployer: currentEmployer || 'Confidential / Self',
          currentCTC: currentCTC || 'Confidential',
          expectedCTC: expectedCTC || 'Negotiable',
          skillSet: skillSet || parsedSkills.join(', '),
          linkedInLink,
          facebookLink,
          candidateNote,
        },
        uploadedFile
          ? { filename: uploadedFile.originalname, path: uploadedFile.path }
          : null
      )
        .then(async (emailResult) => {
          if (emailResult.success) {
            await JobApplication.findByIdAndUpdate(application._id, {
              emailNotificationStatus:
                emailResult.mode === 'smtp_delivered' ? 'Sent' : 'Disabled',
            });
          } else {
            await JobApplication.findByIdAndUpdate(application._id, {
              emailNotificationStatus: 'Failed',
            });
          }
        })
        .catch((err) => {
          console.error('Async email error:', err.message);
        });

      return res.status(201).json({
        success: true,
        message: `Application submitted successfully for ${jobTitle}!`,
        application,
        fitScore: matchScoreResult.fit_score,
        fitBadge: matchScoreResult.fit_badge,
        assessment: assessmentResult,
      });
    } else {
      // In-memory fallback for local dev without MongoDB connection
      const existing = localDevApplications.find(
        (a) =>
          String(a.candidate) === String(candidateId) &&
          String(a.jobId) === String(jobId)
      );

      if (existing) {
        return res.status(409).json({
          success: false,
          error: `You have already applied for "${jobTitle}".`,
          existingApplication: existing,
        });
      }

      const matchScoreResult = await aiService.calculateMatchScore(
        { skills: parsedSkills },
        { jobTitle, department, requiredSkills: parsedSkills }
      );
      const assessmentResult = await aiService.generateAssessment(
        { jobId, jobTitle, department, requiredSkills: parsedSkills },
        {
          name: `${resolvedFirstName} ${resolvedLastName}`,
          skills: parsedSkills,
        }
      );

      const application = {
        _id: 'app_' + Date.now(),
        candidate: candidateId,
        jobId: String(jobId),
        jobTitle,
        department: department || 'Engineering',
        location: location || 'Remote',
        employmentType: employmentType || 'Permanent',
        postingDate: postingDate || '',
        resumeOriginalName,
        resumeFileName,
        resumePath,
        resumeUrl: finalResumeUrl,
        lastName: resolvedLastName,
        firstName: resolvedFirstName,
        mobileNumber: resolvedMobile,
        email: resolvedEmail,
        applicationType: applicationType || 'Permanent',
        noticePeriod: noticePeriod || 'Immediate',
        city,
        state,
        totalExperienceYears: totalExperienceYears || experience || '',
        relevantExperienceYears: relevantExperienceYears || '',
        currentEmployer,
        currentCTC,
        expectedCTC,
        skillSet: skillSet || parsedSkills.join(', '),
        skills: parsedSkills,
        linkedInLink,
        facebookLink,
        candidateNote: candidateNote || coverLetter || '',
        candidateName: `${resolvedFirstName} ${resolvedLastName}`.trim(),
        candidateEmail: resolvedEmail,
        candidatePhone: resolvedMobile,
        experience: totalExperienceYears
          ? `${totalExperienceYears} Years`
          : experience || '3 - 5 Years',
        coverLetter: candidateNote || coverLetter || '',
        fitScore: matchScoreResult.fit_score,
        fitBadge: matchScoreResult.fit_badge,
        assessment: assessmentResult,
        assessmentStatus: 'Not Started',
        status: 'Applied',
        stage: 'Application Received',
        emailNotificationStatus: 'Sent',
        createdAt: new Date(),
      };

      localDevApplications.unshift(application);

      // Trigger notification email in dev mode
      sendRecruitmentNotificationEmail(
        application,
        uploadedFile
          ? { filename: uploadedFile.originalname, path: uploadedFile.path }
          : null
      ).catch((err) => console.error('Dev email error:', err.message));

      return res.status(201).json({
        success: true,
        message: `Application submitted successfully for ${jobTitle}!`,
        application,
        fitScore: matchScoreResult.fit_score,
        fitBadge: matchScoreResult.fit_badge,
        assessment: assessmentResult,
      });
    }
  } catch (error) {
    console.error('Job application error:', error);
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        error: 'You have already applied for this position.',
      });
    }
    return res.status(500).json({
      success: false,
      error: 'Unable to submit job application. Please try again.',
    });
  }
};

/**
 * Parse Resume to Auto-Fill Application Form
 * POST /api/candidate/parse-resume
 */
export const parseResumeForAutoFill = async (req, res) => {
  try {
    let parsed;
    if (req.file) {
      const fileBuffer = fs.readFileSync(req.file.path);
      parsed = await aiService.parseResume(fileBuffer, req.file.originalname);
    } else if (req.body && (req.body.resumeText || req.body.text)) {
      const text = req.body.resumeText || req.body.text;
      parsed = await aiService.parseResume(
        Buffer.from(text, 'utf-8'),
        'resume.txt'
      );
    } else {
      return res.status(400).json({
        success: false,
        error:
          'Please upload a resume file (PDF, DOC, or DOCX) or provide resume text.',
      });
    }

    const locationStr = parsed.location || '';
    const city = locationStr.includes(',')
      ? locationStr.split(',')[0].trim()
      : locationStr;
    const state = locationStr.includes(',')
      ? locationStr.split(',')[1].trim()
      : '';

    return res.status(200).json({
      success: true,
      message: 'Resume parsed and details extracted successfully.',
      parsed: {
        firstName: parsed.first_name || '',
        lastName: parsed.last_name || '',
        email: parsed.email || '',
        mobileNumber: parsed.phone || '',
        location: locationStr,
        city,
        state,
        totalExperienceYears: parsed.total_experience_years
          ? String(parsed.total_experience_years)
          : '',
        currentRole: parsed.current_role || '',
        headline: parsed.headline || '',
        skillSet:
          parsed.skill_set || (parsed.skills ? parsed.skills.join(', ') : ''),
        skills: parsed.skills || [],
        linkedInLink: parsed.linkedin_url || '',
        githubLink: parsed.github_url || '',
        portfolioLink: parsed.portfolio_url || parsed.portfolioLink || '',
        portfolioUrl: parsed.portfolio_url || parsed.portfolioLink || '',
        candidateNote: parsed.summary || '',
      },
    });
  } catch (error) {
    console.error('Resume auto-fill parse error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to extract resume details for auto-fill.',
    });
  }
};

/**
 * Retrieve Screening Assessment for a Specific Application
 * GET /api/candidate/applications/:applicationId/assessment
 */
export const getApplicationAssessment = async (req, res) => {
  try {
    const candidateId = req.candidate._id || req.candidate.id;
    const { applicationId } = req.params;

    let app;
    if (mongoose.connection.readyState === 1) {
      app = await JobApplication.findOne({
        _id: applicationId,
        candidate: candidateId,
      });
    } else {
      app = localDevApplications.find(
        (a) =>
          String(a._id) === String(applicationId) &&
          String(a.candidate) === String(candidateId)
      );
    }

    if (!app) {
      return res.status(404).json({
        success: false,
        error: 'Application not found.',
      });
    }

    let assessment = app.assessment;
    if (
      !assessment ||
      !assessment.questions ||
      assessment.questions.length === 0
    ) {
      assessment = await aiService.generateAssessment(
        {
          jobId: app.jobId,
          jobTitle: app.jobTitle,
          department: app.department,
          requiredSkills: app.skills || [],
        },
        {
          name: app.candidateName,
          skills: app.skills || [],
        }
      );

      if (mongoose.connection.readyState === 1) {
        await JobApplication.findByIdAndUpdate(app._id, { assessment });
      } else {
        app.assessment = assessment;
      }
    }

    return res.status(200).json({
      success: true,
      assessment,
      application: {
        id: app._id,
        jobTitle: app.jobTitle,
        department: app.department,
        assessmentStatus: app.assessmentStatus || 'Not Started',
        assessmentScore: app.assessmentScore,
        screeningPassed: app.screeningPassed,
        fitScore: app.fitScore,
        fitBadge: app.fitBadge,
      },
    });
  } catch (error) {
    console.error('Get assessment error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve assessment.',
    });
  }
};

/**
 * Submit and Grade Candidate Assessment Answers
 * POST /api/candidate/applications/:applicationId/assessment/submit
 */
export const submitApplicationAssessment = async (req, res) => {
  try {
    const candidateId = req.candidate._id || req.candidate.id;
    const { applicationId } = req.params;
    const { answers } = req.body;

    let app;
    if (mongoose.connection.readyState === 1) {
      app = await JobApplication.findOne({
        _id: applicationId,
        candidate: candidateId,
      });
    } else {
      app = localDevApplications.find(
        (a) =>
          String(a._id) === String(applicationId) &&
          String(a.candidate) === String(candidateId)
      );
    }

    if (!app) {
      return res.status(404).json({
        success: false,
        error: 'Application not found.',
      });
    }

    const assessment = app.assessment || {};
    const evalResult = await aiService.evaluateAssessment(
      assessment,
      answers || {}
    );

    const updateData = {
      assessmentScore: evalResult.total_score,
      assessmentStatus: evalResult.passed ? 'Passed' : 'Failed',
      screeningPassed: evalResult.passed,
      stage: evalResult.gatekeeper_status,
      status: evalResult.passed ? 'Screening' : 'Screening',
    };

    if (mongoose.connection.readyState === 1) {
      await JobApplication.findByIdAndUpdate(applicationId, updateData);
      await Candidate.findByIdAndUpdate(candidateId, {
        status: updateData.status,
        assessmentScore: evalResult.total_score,
        vettingScore: Math.max(evalResult.total_score, 80),
      });
    } else {
      Object.assign(app, updateData);
    }

    return res.status(200).json({
      success: true,
      message: evalResult.passed
        ? 'Congratulations! You passed the screening assessment.'
        : 'Assessment submitted. Your score has been recorded.',
      evaluation: evalResult,
    });
  } catch (error) {
    console.error('Submit assessment error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to evaluate assessment submission.',
    });
  }
};

/**
 * Withdraw Job Application by Candidate
 * POST /api/candidate/applications/:applicationId/withdraw
 */
export const withdrawApplication = async (req, res) => {
  try {
    const candidateId = req.candidate._id || req.candidate.id;
    const { applicationId } = req.params;

    let application = null;
    if (mongoose.connection.readyState === 1) {
      application = await JobApplication.findOne({
        _id: applicationId,
        $or: [{ candidate: candidateId }, { email: req.candidate?.email }],
      });

      if (!application) {
        return res.status(404).json({
          success: false,
          error:
            'Application not found or unauthorized to withdraw this application.',
        });
      }

      if (application.status === 'Withdrawn') {
        return res.status(400).json({
          success: false,
          error: 'This application has already been withdrawn.',
        });
      }

      application.status = 'Withdrawn';
      application.stage = 'Withdrawn by Candidate';
      await application.save();
    } else {
      const idx = localDevApplications.findIndex(
        (a) =>
          (String(a._id) === String(applicationId) ||
            String(a.id) === String(applicationId)) &&
          String(a.candidate) === String(candidateId)
      );

      if (idx === -1) {
        return res.status(404).json({
          success: false,
          error: 'Application not found.',
        });
      }

      localDevApplications[idx].status = 'Withdrawn';
      localDevApplications[idx].stage = 'Withdrawn by Candidate';
      application = localDevApplications[idx];
    }

    return res.status(200).json({
      success: true,
      message: 'Application withdrawn successfully.',
      application,
    });
  } catch (error) {
    console.error('Withdraw application error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to withdraw application. Please try again.',
    });
  }
};

/**
 * Retrieve Candidate Evaluation Dossier for a specific application
 * GET /api/candidate/applications/:applicationId/dossier
 */
export const getApplicationDossier = async (req, res) => {
  try {
    const candidateId = req.candidate?._id || req.candidate?.id;
    const { applicationId } = req.params;

    let application = null;
    if (mongoose.connection.readyState === 1) {
      application = await JobApplication.findOne({
        _id: applicationId,
        $or: [{ candidate: candidateId }, { email: req.candidate?.email }],
      });
    } else {
      application = localDevApplications.find(
        (a) =>
          (String(a._id) === String(applicationId) ||
            String(a.id) === String(applicationId)) &&
          String(a.candidate) === String(candidateId)
      );
    }

    if (!application) {
      return res.status(404).json({
        success: false,
        error: 'Application not found or unauthorized to view this dossier.',
      });
    }

    // If evaluationReport does not exist yet, generate it on demand
    let dossier = application.evaluationReport;
    if (!dossier || !dossier.overallMatchScore) {
      dossier = await aiService.evaluateCandidate(
        {
          candidateName:
            application.candidateName ||
            `${application.firstName || ''} ${application.lastName || ''}`.trim(),
          skills: application.skills || [],
          resumeText: application.candidateNote || application.coverLetter || '',
          experience:
            application.totalExperienceYears || application.experience || 3,
          noticePeriod: application.noticePeriod,
          expectedSalary: application.expectedCTC,
        },
        {
          jobTitle: application.jobTitle,
          department: application.department,
          company: 'Thinkwires Enterprise Client',
          requiredSkills: application.skills || [],
          experienceRequired: 3,
        }
      );

      if (mongoose.connection.readyState === 1) {
        await JobApplication.findByIdAndUpdate(application._id, {
          evaluationReport: dossier,
          fitScore: dossier.overallMatchScore,
        });
      }
      application.evaluationReport = dossier;
    }

    return res.status(200).json({
      success: true,
      dossier,
      candidate: {
        name:
          application.candidateName ||
          `${application.firstName || ''} ${application.lastName || ''}`.trim(),
        avatarUrl: req.candidate?.avatarUrl || application.avatarUrl || '',
        avatarType: req.candidate?.avatarType || 'initials',
        email: application.email,
        jobTitle: application.jobTitle,
        department: application.department,
        appliedAt: application.createdAt || application.appliedAt,
      },
    });
  } catch (error) {
    console.error('Get application dossier error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve evaluation dossier.',
    });
  }
};

/**
 * Upload Custom Profile Avatar Photo
 * POST /api/candidate/avatar/upload
 */
export const uploadAvatar = async (req, res) => {
  try {
    const candidateId = req.candidate?._id || req.candidate?.id;
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Please select an image file (JPG, PNG, WebP) to upload.',
      });
    }

    const avatarUrl = `/uploads/avatars/${req.file.filename}`;

    if (mongoose.connection.readyState === 1) {
      await Candidate.findByIdAndUpdate(candidateId, {
        avatarUrl,
        avatarType: 'upload',
      });
      // Also update candidate applications
      await JobApplication.updateMany(
        { candidate: candidateId },
        { avatarUrl }
      );
    }

    return res.status(200).json({
      success: true,
      message: 'Avatar photo uploaded successfully.',
      avatarUrl,
      avatarType: 'upload',
    });
  } catch (error) {
    console.error('Upload avatar error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to upload avatar photo.',
    });
  }
};

/**
 * Select from Curated Engineer Preset Avatars
 * PUT /api/candidate/avatar/preset
 */
export const setAvatarPreset = async (req, res) => {
  try {
    const candidateId = req.candidate?._id || req.candidate?.id;
    const { presetId, presetUrl } = req.body;

    if (!presetUrl && !presetId) {
      return res.status(400).json({
        success: false,
        error: 'Preset identifier is required.',
      });
    }

    const targetUrl = presetUrl || `/avatars/presets/${presetId}.svg`;

    if (mongoose.connection.readyState === 1) {
      await Candidate.findByIdAndUpdate(candidateId, {
        avatarUrl: targetUrl,
        avatarType: 'preset',
      });
      await JobApplication.updateMany(
        { candidate: candidateId },
        { avatarUrl: targetUrl }
      );
    }

    return res.status(200).json({
      success: true,
      message: 'Avatar preset selected successfully.',
      avatarUrl: targetUrl,
      avatarType: 'preset',
    });
  } catch (error) {
    console.error('Set avatar preset error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update avatar preset.',
    });
  }
};

/**
 * Remove Avatar Photo (Reset to Dynamic Initials Monogram)
 * DELETE /api/candidate/avatar
 */
export const removeAvatar = async (req, res) => {
  try {
    const candidateId = req.candidate?._id || req.candidate?.id;

    if (mongoose.connection.readyState === 1) {
      await Candidate.findByIdAndUpdate(candidateId, {
        avatarUrl: '',
        avatarType: 'initials',
      });
      await JobApplication.updateMany(
        { candidate: candidateId },
        { avatarUrl: '' }
      );
    }

    return res.status(200).json({
      success: true,
      message: 'Avatar reset to initials monogram.',
      avatarUrl: '',
      avatarType: 'initials',
    });
  } catch (error) {
    console.error('Remove avatar error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to reset avatar.',
    });
  }
};

