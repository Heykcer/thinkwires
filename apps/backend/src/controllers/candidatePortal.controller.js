import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import Candidate from '../models/candidate.mongo.model.js';
import JobApplication from '../models/jobApplication.mongo.model.js';
import JobRequirement from '../models/job.mongo.model.js';
import { sendRecruitmentNotificationEmail } from '../utils/recruitmentEmail.util.js';
import aiService from '../services/ai.service.js';
import { verifyAdminToken, verifyCandidateToken } from '../utils/auth.util.js';
import { buildDualScoreReport } from '../utils/dualScore.util.js';
import { storageService } from '../utils/storage.adapter.js';

// Fallback in-memory application store for local development if MongoDB is absent
export const localDevApplications = [];

/**
 * Fail closed in production when MongoDB connection is inactive to prevent silent data loss (Issue #196)
 */
export const requireProductionDb = (res) => {
  if (mongoose.connection.readyState !== 1 && process.env.NODE_ENV === 'production') {
    res.status(503).json({
      success: false,
      error: 'Database connection temporarily unavailable. Please retry your request.',
      retryAfterSeconds: 5,
    });
    return false;
  }
  return true;
};

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
      applications = await JobApplication.find({
        candidate: candidateId,
        isDeleted: { $ne: true },
      })
        .sort({ createdAt: -1 })
        .limit(50)
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
    if (!requireProductionDb(res)) return;
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
      applications = await JobApplication.find({
        candidate: candidateId,
        isDeleted: { $ne: true },
      })
        .sort({ createdAt: -1 })
        .limit(50)
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
      resumeUrl: bodyResumeUrl,
      clientResumeUrl: passedClientResumeUrl,
    } = req.body;

    const clientResumeUrl = passedClientResumeUrl || bodyResumeUrl || '';

    if (!jobId || !jobTitle) {
      return res.status(400).json({
        success: false,
        error: 'Job ID and Job Title are required.',
      });
    }

    const resolvedEmail = (
      (candidate && candidate.email) ||
      ''
    )
      .trim()
      .toLowerCase();
    const resolvedFirstName = (
      (candidate && candidate.name ? candidate.name.split(' ')[0] : '') ||
      firstName ||
      ''
    ).trim();
    const resolvedLastName = (
      (candidate && candidate.name
        ? candidate.name.split(' ').slice(1).join(' ')
        : '') ||
      lastName ||
      (candidate && candidate.name ? candidate.name.trim() : '') ||
      ''
    ).trim();
    const resolvedMobile = (
      mobileNumber ||
      (candidate && candidate.phone) ||
      ''
    ).trim();

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
    // BOLA-2 & P1 Object Storage Remediation: Upload file to storage before persisting DB reference
    let finalResumeUrl = '';
    let storageKey = '';
    if (uploadedFile) {
      try {
        const fileBuffer = await fs.promises.readFile(uploadedFile.path);
        const uploadResult = await storageService.saveFile(
          fileBuffer,
          uploadedFile.originalname || uploadedFile.filename,
          uploadedFile.mimetype,
          'resumes'
        );
        finalResumeUrl = uploadResult.url;
        storageKey = uploadResult.key;

        // Clean up temporary local disk file if uploaded to cloud S3/R2
        if (storageService.driver === 's3' && uploadedFile.path && fs.existsSync(uploadedFile.path)) {
          fs.promises.unlink(uploadedFile.path).catch(() => {});
        } else {
          finalResumeUrl = `/uploads/resumes/${uploadedFile.filename}`;
          storageKey = `resumes/${uploadedFile.filename}`;
        }
      } catch (uploadErr) {
        if (uploadedFile.path && fs.existsSync(uploadedFile.path)) {
          fs.promises.unlink(uploadedFile.path).catch(() => {});
        }
        return res.status(500).json({
          success: false,
          error: `Failed to upload resume to persistent storage: ${uploadErr.message}`,
        });
      }
    } else if (candidate && candidate.resumeUrl) {
      if (clientResumeUrl && clientResumeUrl !== candidate.resumeUrl) {
        return res.status(400).json({
          success: false,
          error:
            'Invalid resume file reference. You can only attach your own previously uploaded resume.',
        });
      }
      finalResumeUrl = candidate.resumeUrl;
    } else if (clientResumeUrl) {
      return res.status(400).json({
        success: false,
        error:
          'No existing resume found on profile. Please upload a resume file.',
      });
    }

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

    if (!requireProductionDb(res)) return;

    // Cooldown policy: Active applications permanently block re-applying;
    // Closed ('Rejected', 'Withdrawn') applications block only during 90-day cooldown (Issue #208)
    const COOLDOWN_DAYS = 90;
    const cooldownThreshold = new Date(Date.now() - COOLDOWN_DAYS * 24 * 60 * 60 * 1000);

    if (mongoose.connection.readyState === 1) {
      const existingApplication = await JobApplication.findOne({
        candidate: candidateId,
        jobId: String(jobId),
        $or: [
          { status: { $in: ['Applied', 'Screening', 'Interview', 'Offered'] } },
          { status: { $in: ['Rejected', 'Withdrawn'] }, updatedAt: { $gt: cooldownThreshold } },
        ],
      });

      if (existingApplication) {
        const isTerminal = ['Rejected', 'Withdrawn'].includes(existingApplication.status);
        const errorMsg = isTerminal
          ? `You have already applied for this position previously. Re-applications are open ${COOLDOWN_DAYS} days after closure.`
          : `You have already applied and have an active application under review for "${jobTitle}".`;

        return res.status(409).json({
          success: false,
          error: errorMsg,
          applicationId: existingApplication._id,
          appliedAt: existingApplication.createdAt,
          status: existingApplication.status,
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
      let assessmentResult = null;
      let evaluationReportResult = null;

      // Parallel execution with bounded timeout to eliminate 504 timeouts (Issue #206)
      const timeoutMs = 6000;
      const withTimeout = (promise, fallback) =>
        Promise.race([
          promise,
          new Promise((resolve) => setTimeout(() => resolve(fallback), timeoutMs)),
        ]);

      const [matchScoreSettled, assessmentSettled, evaluationSettled] =
        await Promise.allSettled([
          withTimeout(
            aiService.calculateMatchScore(
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
            ),
            matchScoreResult
          ),
          withTimeout(
            aiService.generateAssessment(
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
            ),
            null
          ),
          withTimeout(
            aiService.evaluateCandidate(
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
            ),
            null
          ),
        ]);

      if (matchScoreSettled.status === 'fulfilled' && matchScoreSettled.value) {
        matchScoreResult = matchScoreSettled.value;
      }
      if (assessmentSettled.status === 'fulfilled' && assessmentSettled.value) {
        assessmentResult = assessmentSettled.value;
      }
      if (evaluationSettled.status === 'fulfilled' && evaluationSettled.value) {
        evaluationReportResult = evaluationSettled.value;
      }

      const deptPrefix = (department || 'ENG').substring(0, 3).toUpperCase();
      const generatedAnonymousCode = `TW-${deptPrefix}-${crypto.randomUUID()}`;
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
          const status = emailResult && emailResult.success ? 'Sent' : 'Failed';
          await JobApplication.findByIdAndUpdate(application._id, {
            emailNotificationStatus: status,
          });
          application.emailNotificationStatus = status;
        })
        .catch(async (err) => {
          console.error('Async email error:', err.message);
          await JobApplication.findByIdAndUpdate(application._id, {
            emailNotificationStatus: 'Failed',
          }).catch(() => {});
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
      const inMemExisting = localDevApplications.find((a) => {
        if (String(a.candidate) !== String(candidateId) || String(a.jobId) !== String(jobId)) {
          return false;
        }
        if (['Applied', 'Screening', 'Interview', 'Offered'].includes(a.status)) {
          return true;
        }
        if (['Rejected', 'Withdrawn'].includes(a.status)) {
          const appDate = new Date(a.updatedAt || a.createdAt || Date.now());
          return appDate > cooldownThreshold;
        }
        return false;
      });

      if (inMemExisting) {
        const isTerminal = ['Rejected', 'Withdrawn'].includes(inMemExisting.status);
        const errorMsg = isTerminal
          ? `You have already applied for this position previously. Re-applications are open ${COOLDOWN_DAYS} days after closure.`
          : `You have already applied and have an active application under review for "${jobTitle}".`;

        return res.status(409).json({
          success: false,
          error: errorMsg,
          applicationId: inMemExisting._id,
          appliedAt: inMemExisting.createdAt || new Date().toISOString(),
          status: inMemExisting.status || 'Applied',
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
        draftAnswers: {},
        status: 'Applied',
        stage: 'Application Received',
        anonymousCode: `TW-${(department || 'ENG').substring(0, 3).toUpperCase()}-${crypto.randomUUID()}`,
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
 * Safe ObjectId validator helper to prevent unhandled CastError 500 crashes
 */
const isValidApplicationId = (id) =>
  Boolean(id) &&
  (mongoose.isValidObjectId(id) ||
    (typeof id === 'string' && id.startsWith('app_')));

/**
 * Retrieve Screening Assessment for a Specific Application
 * GET /api/candidate/applications/:applicationId/assessment
 */
export const getApplicationAssessment = async (req, res) => {
  try {
    const candidateId = req.candidate._id || req.candidate.id;
    const { applicationId } = req.params;

    if (!isValidApplicationId(applicationId)) {
      return res.status(400).json({
        success: false,
        error:
          'Invalid application identifier format. Must be a valid 24-character hexadecimal ID.',
      });
    }

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
      draftAnswers: app.draftAnswers || {},
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

    if (!isValidApplicationId(applicationId)) {
      return res.status(400).json({
        success: false,
        error:
          'Invalid application identifier format. Must be a valid 24-character hexadecimal ID.',
      });
    }

    if (!requireProductionDb(res)) return;

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

    const dualScoreReport = buildDualScoreReport({
      resumeScore: app.fitScore || (app.aiAnalysis?.skillsMatch ? Math.round(app.aiAnalysis.skillsMatch) : 85),
      assessmentScore: evalResult.total_score,
      assessmentData: assessment,
      candidateAnswers: answers || {},
      evalResult,
      timeSpentMinutes: assessment.timeSpentMinutes || 14,
    });

    const updateData = {
      assessmentScore: evalResult.total_score,
      assessmentStatus: evalResult.passed ? 'Passed' : 'Failed',
      screeningPassed: evalResult.passed,
      stage: evalResult.gatekeeper_status,
      status: evalResult.passed ? 'Screening' : 'Screening',
      draftAnswers: {},
      evaluationReport: {
        ...(app.evaluationReport || {}),
        ...dualScoreReport,
      },
    };

    if (mongoose.connection.readyState === 1) {
      await JobApplication.findByIdAndUpdate(applicationId, updateData);
      await Candidate.findByIdAndUpdate(candidateId, {
        status: updateData.status,
        assessmentScore: evalResult.total_score,
        vettingScore: dualScoreReport.scores.candidateScore.overall,
      });
    } else {
      Object.assign(app, updateData);
    }

    // Alert recruitment team if candidate passed screening assessment (Issue #209)
    if (evalResult.passed) {
      sendRecruitmentNotificationEmail({
        jobTitle: app.jobTitle,
        location: app.location,
        firstName: app.firstName || req.candidate?.name,
        lastName: app.lastName || '',
        email: app.email || req.candidate?.email,
        totalExperienceYears: app.totalExperienceYears,
        noticePeriod: app.noticePeriod,
        screeningScore: evalResult.total_score,
        assessmentPassed: true,
        candidateNote: `Gatekeeper screening assessment PASSED with score ${evalResult.total_score}%. Verified Candidate Score: ${dualScoreReport.scores.candidateScore.overall}%, Resume Match: ${dualScoreReport.scores.resumeScore.overall}% (Inflation Risk: ${dualScoreReport.scores.divergenceAnalysis.inflationRisk}).`,
      }).catch((e) => console.warn('Recruiter screening pass alert notice:', e.message));
    }

    return res.status(200).json({
      success: true,
      message: evalResult.passed
        ? 'Congratulations! You passed the screening assessment.'
        : 'Assessment submitted. Your score has been recorded.',
      evaluation: evalResult,
      scores: dualScoreReport.scores,
      assessmentAudit: dualScoreReport.assessmentAudit,
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
 * Save Candidate Assessment Draft (Issue #207)
 * PUT /api/candidate/applications/:applicationId/assessment/draft
 */
export const saveAssessmentDraft = async (req, res) => {
  try {
    const candidateId = req.candidate?._id || req.candidate?.id;
    const { applicationId } = req.params;
    const { answers } = req.body;

    if (!candidateId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required.',
      });
    }

    if (!isValidApplicationId(applicationId)) {
      return res.status(400).json({
        success: false,
        error:
          'Invalid application identifier format. Must be a valid 24-character hexadecimal ID.',
      });
    }

    if (!requireProductionDb(res)) return;

    let app = null;
    if (mongoose.connection.readyState === 1) {
      app = await JobApplication.findOne({
        _id: applicationId,
        candidate: candidateId,
      });

      if (app) {
        await JobApplication.findByIdAndUpdate(applicationId, {
          draftAnswers: answers || {},
          assessmentStatus:
            app.assessmentStatus === 'Not Started'
              ? 'In Progress'
              : app.assessmentStatus,
        });
      }
    } else {
      app = localDevApplications.find(
        (a) =>
          (String(a._id) === String(applicationId) ||
            String(a.id) === String(applicationId)) &&
          String(a.candidate) === String(candidateId)
      );
      if (app) {
        app.draftAnswers = answers || {};
        if (app.assessmentStatus === 'Not Started') {
          app.assessmentStatus = 'In Progress';
        }
      }
    }

    if (!app) {
      return res.status(404).json({
        success: false,
        error: 'Application not found.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Assessment draft saved successfully.',
      draftAnswers: answers || {},
    });
  } catch (error) {
    console.error('Save assessment draft error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to save assessment draft.',
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

    if (!isValidApplicationId(applicationId)) {
      return res.status(400).json({
        success: false,
        error:
          'Invalid application identifier format. Must be a valid 24-character hexadecimal ID.',
      });
    }

    if (!requireProductionDb(res)) return;

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

    if (!isValidApplicationId(applicationId)) {
      return res.status(400).json({
        success: false,
        error:
          'Invalid application identifier format. Must be a valid 24-character hexadecimal ID.',
      });
    }

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

    if (dossier && !dossier.scores) {
      const dualScoreReport = buildDualScoreReport({
        resumeScore: dossier.overallMatchScore || application.fitScore || 85,
        assessmentScore: application.assessmentScore ?? 85,
        assessmentData: application.assessment || {},
        candidateAnswers: application.draftAnswers || {},
        evalResult: {
          total_score: application.assessmentScore ?? 85,
          passed: (application.assessmentScore ?? 85) >= 75,
        },
      });
      dossier.scores = dualScoreReport.scores;
      if (!dossier.assessmentAudit && dualScoreReport.assessmentAudit) {
        dossier.assessmentAudit = dualScoreReport.assessmentAudit;
      }
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
    if (!requireProductionDb(res)) return;
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
    if (!requireProductionDb(res)) return;
    const { presetId } = req.body;

    if (!presetId || typeof presetId !== 'string' || !/^[a-zA-Z0-9_-]{1,30}$/.test(presetId)) {
      return res.status(400).json({
        success: false,
        error:
          'Valid preset identifier is required (alphanumeric, max 30 chars).',
      });
    }

    const targetUrl = `/avatars/presets/${presetId}.svg`;

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
    if (!requireProductionDb(res)) return;

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

/**
 * Protected Resume Download Handler (Issue #178)
 * GET /api/candidate/resume/:filename
 * GET /uploads/resumes/:filename
 *
 * Enforces authentication and authorization:
 * - Candidate can only download their own resume
 * - Admin can download any resume
 * - Unauthenticated users are rejected with 401
 * - Filename is strictly sanitized against path traversal
 * - Headers set: Content-Disposition: attachment, X-Content-Type-Options: nosniff
 */
export const downloadResume = async (req, res) => {
  try {
    const rawFilename = req.params.filename || '';
    const safeFilename = path.basename(rawFilename);

    // Prevent path traversal
    if (!safeFilename || safeFilename !== rawFilename || safeFilename.includes('..')) {
      return res.status(400).json({
        success: false,
        error: 'Invalid resume file identifier.',
      });
    }

    // Only allow permitted resume extensions
    const ext = path.extname(safeFilename).toLowerCase();
    if (!['.pdf', '.doc', '.docx'].includes(ext)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid file format requested.',
      });
    }

    // Authenticate principal (Candidate or Admin)
    let candidatePrincipal = req.candidate || null;
    let isAdmin = false;

    // Check if candidate is already attached by middleware
    if (!candidatePrincipal) {
      const candidateToken =
        (req.cookies && req.cookies.thinkwires_candidate_jwt) ||
        (req.headers.authorization &&
          req.headers.authorization.startsWith('Bearer ') &&
          req.headers.authorization.split(' ')[1]);

      if (candidateToken) {
        try {
          const decoded = verifyCandidateToken(candidateToken);
          if (decoded && decoded.id && decoded.role === 'candidate') {
            candidatePrincipal = decoded;
          }
        } catch {
          // Token invalid or expired, continue to check admin token
        }
      }
    }

    // Check if admin is authenticated
    const adminToken =
      (req.cookies && req.cookies.thinkwires_admin_jwt) ||
      (req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer ') &&
        req.headers.authorization.split(' ')[1]) ||
      req.headers['x-admin-token'];

    if (adminToken) {
      try {
        const decodedAdmin = verifyAdminToken(adminToken);
        const role = (decodedAdmin?.role || '').toLowerCase();
        if (role === 'cms_admin') {
          return res.status(403).json({
            success: false,
            error:
              'Access denied: CMS Administrators are restricted from viewing candidate resumes (RBAC_CMS_ADMIN_RESTRICTED).',
          });
        }
        if (['superadmin', 'admin'].includes(role)) {
          isAdmin = true;
        }
      } catch {
        // Admin token invalid
      }
    }

    // If neither authenticated candidate nor admin, reject with 401
    if (!candidatePrincipal && !isAdmin) {
      return res.status(401).json({
        success: false,
        authenticated: false,
        error: 'Authentication required to access candidate resumes.',
      });
    }

    // If authenticated as candidate (and not admin), verify ownership
    if (!isAdmin && candidatePrincipal) {
      const candidateId = candidatePrincipal._id || candidatePrincipal.id;

      if (mongoose.connection.readyState === 1) {
        const targetResumePath = `/uploads/resumes/${safeFilename}`;
        const [candidateDoc, appDoc] = await Promise.all([
          Candidate.findOne({
            _id: candidateId,
            resumeUrl: { $in: [targetResumePath, safeFilename] },
          }).select('_id'),
          JobApplication.findOne({
            candidate: candidateId,
            resumeUrl: { $in: [targetResumePath, safeFilename] },
          }).select('_id'),
        ]);

        if (!candidateDoc && !appDoc) {
          return res.status(403).json({
            success: false,
            error: 'Access forbidden. You may only download your own resume.',
          });
        }
      }
    }

    const resumesDir = process.env.VERCEL
      ? path.resolve('/tmp', 'uploads', 'resumes')
      : path.resolve(process.cwd(), 'uploads/resumes');
    const filePath = path.resolve(resumesDir, safeFilename);

    // Backward compatibility: If the file exists on local disk, serve it directly
    if (fs.existsSync(filePath)) {
      res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`);
      res.setHeader('X-Content-Type-Options', 'nosniff');

      const mimeMap = {
        '.pdf': 'application/pdf',
        '.doc': 'application/msword',
        '.docx':
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      };
      res.setHeader('Content-Type', mimeMap[ext] || 'application/octet-stream');
      return res.sendFile(filePath);
    }

    // In cloud S3 / R2 mode, generate authentic time-limited signed download URL
    if (storageService.driver === 's3') {
      const signedUrl = storageService.getSignedDownloadUrl(safeFilename, 'resumes', 900);
      return res.redirect(signedUrl);
    }

    return res.status(404).json({
      success: false,
      error: 'Requested resume document not found.',
    });
  } catch (err) {
    console.error('Resume download error:', err);
    return res.status(500).json({
      success: false,
      error: 'An internal error occurred while downloading the resume.',
    });
  }
};

