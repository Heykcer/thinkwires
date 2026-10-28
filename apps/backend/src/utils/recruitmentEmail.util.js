import nodemailer from 'nodemailer';

/**
 * Creates and caches a Nodemailer transport instance.
 * Reads SMTP credentials from environment variables:
 * - SMTP_HOST
 * - SMTP_PORT (default 587)
 * - SMTP_SECURE (true for 465, false for 587)
 * - SMTP_USER
 * - SMTP_PASS
 * - RECRUITMENT_NOTIFICATION_EMAIL (destination HR / recruitment address)
 * - EMAIL_FROM (sender address, e.g. "Thinkwires Recruitment <careers@thinkwires.com>")
 */
let transporter = null;

const getTransporter = () => {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;

  if (!host || !user || !pass || pass.includes('your_smtp_app_password_here') || pass.includes('placeholder')) {
    return null;
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
    tls: {
      rejectUnauthorized: process.env.NODE_ENV === 'production',
    },
  });

  return transporter;
};

/**
 * Generates clean, responsive HTML table template matching the recruitment reference screenshot.
 * Compatible with Gmail, Outlook, Apple Mail, and standard corporate webmail.
 */
export const buildRecruitmentEmailHtml = (data) => {
  const {
    jobTitle = 'Technical Specialist',
    location = 'Remote',
    employmentType = 'Permanent',
    postingDate = 'Recently Posted',
    resumeFileName = 'Resume-Attached',
    lastName = '',
    firstName = '',
    mobileNumber = '',
    email = '',
    applicationType = 'Permanent',
    noticePeriod = 'Immediate',
    city = 'Not Specified',
    state = 'Not Specified',
    totalExperienceYears = '0',
    relevantExperienceYears = '0',
    currentEmployer = 'Not Specified',
    currentCTC = 'Confidential',
    expectedCTC = 'Negotiable',
    skillSet = '',
    linkedInLink = '',
    facebookLink = '',
    candidateNote = '',
  } = data;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Candidate Submission - ${escapeHtml(jobTitle)}</title>
</head>
<body style="margin: 0; padding: 24px; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 680px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 16px rgba(15, 23, 42, 0.08); border: 1px solid #e2e8f0;">
    
    <!-- HEADER -->
    <tr>
      <td style="padding: 24px 28px; background: linear-gradient(135deg, #003399 0%, #1e40af 100%); color: #ffffff;">
        <p style="margin: 0 0 6px 0; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #93c5fd;">
          Thinkwires Recruitment Intake Engine
        </p>
        <h1 style="margin: 0 0 8px 0; font-size: 20px; font-weight: 700; line-height: 1.3; color: #ffffff;">
          Submit Candidate for - ${escapeHtml(jobTitle)}
        </h1>
        <p style="margin: 0; font-size: 13px; color: #e0e7ff; line-height: 1.4;">
          <strong>${escapeHtml(location)}</strong> | <strong>${escapeHtml(employmentType)}</strong><br>
          <span style="color: #cbd5e1; font-size: 12px;">Posted on ${escapeHtml(postingDate || 'Active Mandate')}</span>
        </p>
      </td>
    </tr>

    <!-- RESUME SECTION -->
    <tr>
      <td style="padding: 20px 28px 12px 28px; background-color: #f8fafc; border-bottom: 1px solid #e2e8f0;">
        <h2 style="margin: 0 0 10px 0; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em; color: #003399;">
          RESUME
        </h2>
        <div style="background-color: #ffffff; border: 1px solid #cbd5e1; border-radius: 6px; padding: 10px 14px; display: inline-block;">
          <span style="font-size: 13px; font-weight: 600; color: #0f172a;">${escapeHtml(resumeFileName || 'Resume Attached')}</span>
        </div>
      </td>
    </tr>

    <!-- BASIC INFO SECTION -->
    <tr>
      <td style="padding: 20px 28px 12px 28px; border-bottom: 1px solid #e2e8f0;">
        <h2 style="margin: 0 0 14px 0; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em; color: #003399;">
          BASIC INFO
        </h2>
        <table role="presentation" width="100%" cellpadding="6" cellspacing="0" border="0" style="font-size: 13px;">
          <tr>
            <td width="38%" style="color: #64748b; font-weight: 600; padding: 6px 0;">Last Name:</td>
            <td width="62%" style="color: #0f172a; font-weight: 600; padding: 6px 0;">${escapeHtml(lastName || '-')}</td>
          </tr>
          <tr>
            <td style="color: #64748b; font-weight: 600; padding: 6px 0;">First Name:</td>
            <td style="color: #0f172a; font-weight: 600; padding: 6px 0;">${escapeHtml(firstName || '-')}</td>
          </tr>
          <tr>
            <td style="color: #64748b; font-weight: 600; padding: 6px 0;">Mobile:</td>
            <td style="color: #0f172a; font-weight: 600; padding: 6px 0;">
              <a href="tel:${escapeHtml(mobileNumber)}" style="color: #2563eb; text-decoration: none;">${escapeHtml(mobileNumber || '-')}</a>
            </td>
          </tr>
          <tr>
            <td style="color: #64748b; font-weight: 600; padding: 6px 0;">Email:</td>
            <td style="color: #0f172a; font-weight: 600; padding: 6px 0;">
              <a href="mailto:${escapeHtml(email)}" style="color: #2563eb; text-decoration: none;">${escapeHtml(email || '-')}</a>
            </td>
          </tr>
          <tr>
            <td style="color: #64748b; font-weight: 600; padding: 6px 0;">Application Type:</td>
            <td style="color: #0f172a; padding: 6px 0;">
              <span style="background-color: #eff6ff; color: #1d4ed8; padding: 2px 8px; border-radius: 4px; font-weight: 600; font-size: 12px; border: 1px solid #bfdbfe;">
                ${escapeHtml(applicationType || 'Permanent')}
              </span>
            </td>
          </tr>
          <tr>
            <td style="color: #64748b; font-weight: 600; padding: 6px 0;">Notice Period:</td>
            <td style="color: #0f172a; padding: 6px 0;">
              <span style="background-color: #f0fdf4; color: #15803d; padding: 2px 8px; border-radius: 4px; font-weight: 600; font-size: 12px; border: 1px solid #bbf7d0;">
                ${escapeHtml(noticePeriod || 'Immediate')}
              </span>
            </td>
          </tr>
          <tr>
            <td style="color: #64748b; font-weight: 600; padding: 6px 0;">City:</td>
            <td style="color: #0f172a; padding: 6px 0;">${escapeHtml(city || '-')}</td>
          </tr>
          <tr>
            <td style="color: #64748b; font-weight: 600; padding: 6px 0;">State:</td>
            <td style="color: #0f172a; padding: 6px 0;">${escapeHtml(state || '-')}</td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- PROFESSIONAL DETAILS SECTION -->
    <tr>
      <td style="padding: 20px 28px 24px 28px;">
        <h2 style="margin: 0 0 14px 0; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em; color: #003399;">
          PROFESSIONAL DETAILS
        </h2>
        <table role="presentation" width="100%" cellpadding="6" cellspacing="0" border="0" style="font-size: 13px;">
          <tr>
            <td width="38%" style="color: #64748b; font-weight: 600; padding: 6px 0;">Total Experience in Years:</td>
            <td width="62%" style="color: #0f172a; font-weight: 600; padding: 6px 0;">${escapeHtml(totalExperienceYears || '0')}</td>
          </tr>
          <tr>
            <td style="color: #64748b; font-weight: 600; padding: 6px 0;">Relevant Experience in Years:</td>
            <td style="color: #0f172a; font-weight: 600; padding: 6px 0;">${escapeHtml(relevantExperienceYears || '0')}</td>
          </tr>
          <tr>
            <td style="color: #64748b; font-weight: 600; padding: 6px 0;">Current Employer:</td>
            <td style="color: #0f172a; font-weight: 600; padding: 6px 0;">${escapeHtml(currentEmployer || 'Confidential / Self')}</td>
          </tr>
          <tr>
            <td style="color: #64748b; font-weight: 600; padding: 6px 0;">Current CTC:</td>
            <td style="color: #0f172a; font-weight: 600; padding: 6px 0;">${escapeHtml(currentCTC || 'Confidential')}</td>
          </tr>
          <tr>
            <td style="color: #64748b; font-weight: 600; padding: 6px 0;">Expected CTC:</td>
            <td style="color: #0f172a; font-weight: 600; padding: 6px 0;">${escapeHtml(expectedCTC || 'Negotiable')}</td>
          </tr>
          <tr>
            <td style="color: #64748b; font-weight: 600; padding: 6px 0; vertical-align: top;">Skill Set:</td>
            <td style="color: #0f172a; padding: 6px 0; line-height: 1.4;">${escapeHtml(skillSet || '-')}</td>
          </tr>
          <tr>
            <td style="color: #64748b; font-weight: 600; padding: 6px 0;">LinkedIn Link:</td>
            <td style="padding: 6px 0;">
              ${
                linkedInLink
                  ? `<a href="${escapeHtml(linkedInLink)}" style="color: #2563eb; text-decoration: underline;" target="_blank">${escapeHtml(linkedInLink)}</a>`
                  : '<span style="color: #94a3b8;">Not Provided</span>'
              }
            </td>
          </tr>
          <tr>
            <td style="color: #64748b; font-weight: 600; padding: 6px 0;">Facebook Link:</td>
            <td style="padding: 6px 0;">
              ${
                facebookLink
                  ? `<a href="${escapeHtml(facebookLink)}" style="color: #2563eb; text-decoration: underline;" target="_blank">${escapeHtml(facebookLink)}</a>`
                  : '<span style="color: #94a3b8;">Not Provided</span>'
              }
            </td>
          </tr>
          <tr>
            <td style="color: #64748b; font-weight: 600; padding: 6px 0; vertical-align: top;">Candidate Note:</td>
            <td style="color: #334155; padding: 6px 0; line-height: 1.5; background-color: #f8fafc; border-radius: 4px; padding: 8px 10px;">
              ${escapeHtml(candidateNote || 'No additional notes provided.')}
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- FOOTER -->
    <tr>
      <td style="padding: 16px 28px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center; font-size: 11px; color: #64748b;">
        Thinkwires Automated Candidate Dispatch System • This email was generated upon verified candidate application.
      </td>
    </tr>

  </table>
</body>
</html>
`;
};

/**
 * Escapes HTML characters to prevent XSS in email clients.
 */
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Sends recruitment notification email matching the layout from the specification.
 * Attaches the uploaded resume if available on disk.
 */
export const sendRecruitmentNotificationEmail = async (
  applicationData,
  resumeAttachment = null
) => {
  try {
    const transport = getTransporter();

    const recipient =
      process.env.RECRUITMENT_NOTIFICATION_EMAIL ||
      process.env.RECRUITMENT_EMAIL ||
      process.env.ADMIN_NOTIFICATION_EMAIL ||
      'hr@thinkwires.com';

    const fromAddress =
      process.env.EMAIL_FROM ||
      `"Thinkwires Talent Engine" <${process.env.SMTP_USER || 'hr@thinkwires.com'}>`;

    const subject =
      `Submit Candidate for - ${applicationData.jobTitle || 'Technical Specialist'} [${applicationData.firstName || ''} ${applicationData.lastName || ''}]`.trim();

    const htmlContent = buildRecruitmentEmailHtml(applicationData);

    const attachments = [];
    if (resumeAttachment && resumeAttachment.path) {
      attachments.push({
        filename:
          resumeAttachment.filename ||
          applicationData.resumeFileName ||
          'Resume.pdf',
        path: resumeAttachment.path,
      });
    }

    if (!transport) {
      console.log('----------------------------------------------------');
      console.log('[MOCK EMAIL SERVICE] SMTP credentials not set or using placeholder.');
      console.log(`To: ${recipient}`);
      console.log(`Subject: ${subject}`);
      console.log(
        `Candidate: ${applicationData.firstName} ${applicationData.lastName} (${applicationData.email})`
      );
      console.log(
        `Job: ${applicationData.jobTitle} [${applicationData.jobId}]`
      );
      console.log('----------------------------------------------------');
      return {
        success: true,
        mode: 'mock_logged',
        recipient,
        message: 'Notification logged to server console (SMTP not configured).',
      };
    }

    const info = await transport.sendMail({
      from: fromAddress,
      to: recipient,
      subject,
      html: htmlContent,
      attachments,
    });

    console.log(
      `[EMAIL SENT] Recruitment notification delivered to ${recipient}: ${info.messageId}`
    );
    return {
      success: true,
      mode: 'smtp_delivered',
      messageId: info.messageId,
      recipient,
    };
  } catch (error) {
    console.error(
      '[EMAIL ERROR] Failed to send recruitment notification email:',
      error.message
    );
    return {
      success: false,
      error: error.message,
    };
  }
};
