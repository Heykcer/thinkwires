import nodemailer from 'nodemailer';

let transporter = null;

export const getTransporter = () => {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;

  if (
    !host ||
    !user ||
    !pass ||
    pass.includes('your_smtp_app_password_here') ||
    pass.includes('your_zoho_app_password_here') ||
    pass.includes('placeholder')
  ) {
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
 * Resolves destination email based on inquiry category and global environment variables.
 * In testing, OVERRIDE_NOTIFICATION_EMAIL (e.g. websiteadmin@thinkwires.com) overrides all destinations.
 * In production:
 * - General information & company inquiries -> COMPANY_INFO_EMAIL (info@thinkwires.com)
 * - Requisitions, scoping, talent requests, & consultations -> HR_REQUISITION_EMAIL (hr@thinkwires.com)
 */
export const resolveNotificationEmail = (category) => {
  if (process.env.OVERRIDE_NOTIFICATION_EMAIL && process.env.OVERRIDE_NOTIFICATION_EMAIL.trim()) {
    return process.env.OVERRIDE_NOTIFICATION_EMAIL.trim();
  }

  const normalized = (category || '').toLowerCase();

  // General company inquiries and info requests
  if (
    normalized.includes('general') ||
    normalized.includes('info') ||
    normalized.includes('contact') ||
    normalized.includes('partnership')
  ) {
    return process.env.COMPANY_INFO_EMAIL || 'info@thinkwires.com';
  }

  // Requisitions, hiring, scoping, callbacks, and talent requests
  return process.env.HR_REQUISITION_EMAIL || 'hr@thinkwires.com';
};

/**
 * Dispatches HTML notification email for HelpDesk tickets.
 */
export const sendHelpDeskNotificationEmail = async (ticketData) => {
  const {
    ticketId,
    category,
    fullName,
    email,
    phone,
    company,
    subject,
    message,
    metadata = {},
    recipientEmail,
  } = ticketData;

  const destination = recipientEmail || resolveNotificationEmail(category);
  const fromAddress =
    process.env.EMAIL_FROM ||
    `"Thinkwires HelpDesk" <${process.env.SMTP_USER || 'notifications@thinkwires.com'}>`;

  const emailSubject = `[HelpDesk Alert] [${category}] ${subject || 'New Inbound Inquiry'} - ${company || fullName}`;

  const escape = (str) =>
    str
      ? String(str).replace(
          /[&<>"']/g,
          (m) =>
            ({
              '&': '&amp;',
              '<': '&lt;',
              '>': '&gt;',
              '"': '&quot;',
              "'": '&#39;',
            })[m]
        )
      : '-';

  const metadataRows = Object.entries(metadata || {})
    .filter(([_, v]) => v !== undefined && v !== null && v !== '')
    .map(
      ([k, v]) => `
      <tr style="border-bottom: 1px solid #f1f5f9;">
        <td style="padding: 8px 0; color: #64748b; font-weight: 600; text-transform: capitalize; width: 35%;">
          ${escape(k.replace(/([A-Z])/g, ' $1'))}:
        </td>
        <td style="padding: 8px 0; color: #0f172a;">
          ${escape(Array.isArray(v) ? v.join(', ') : v)}
        </td>
      </tr>
    `
    )
    .join('');

  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 650px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px; background: #ffffff;">
      <div style="border-bottom: 2px solid #008F68; padding-bottom: 16px; margin-bottom: 24px;">
        <div style="display: inline-block; padding: 4px 10px; background: #e6f4ea; color: #008F68; font-size: 11px; font-weight: 700; border-radius: 9999px; text-transform: uppercase; margin-bottom: 8px;">
          Ticket ${escape(ticketId)}
        </div>
        <h2 style="color: #0f172a; margin: 0 0 8px 0; font-size: 20px;">
          New Inbound Inquiry: ${escape(category)}
        </h2>
        <p style="color: #64748b; margin: 0; font-size: 13px;">
          Received at Thinkwires HelpDesk and routed to: <strong>${escape(destination)}</strong>
        </p>
      </div>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <tbody>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 8px 0; color: #64748b; font-weight: 600; width: 35%;">Sender Name:</td>
            <td style="padding: 8px 0; color: #0f172a; font-weight: 700;">${escape(fullName)}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Work Email:</td>
            <td style="padding: 8px 0; color: #0f172a;">
              <a href="mailto:${escape(email)}" style="color: #2563eb; text-decoration: none;">${escape(email)}</a>
            </td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Phone / WhatsApp:</td>
            <td style="padding: 8px 0; color: #0f172a;">${escape(phone)}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Company / Organization:</td>
            <td style="padding: 8px 0; color: #0f172a;">${escape(company)}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Subject / Topic:</td>
            <td style="padding: 8px 0; color: #0f172a; font-weight: 600;">${escape(subject)}</td>
          </tr>
          ${metadataRows}
        </tbody>
      </table>

      ${
        message
          ? `
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 14px 16px; margin-bottom: 24px;">
          <div style="font-size: 12px; font-weight: 700; color: #475569; text-transform: uppercase; margin-bottom: 6px;">
            Message / Brief:
          </div>
          <div style="font-size: 14px; color: #0f172a; line-height: 1.5; white-space: pre-wrap;">
            ${escape(message)}
          </div>
        </div>
      `
          : ''
      }

      <div style="background: #f1f5f9; padding: 12px 16px; border-radius: 6px; font-size: 12px; color: #64748b;">
        <strong>Action:</strong> Open the Thinkwires Admin Portal HelpDesk (/admin/helpdesk) to review, update status, or convert this inquiry to a Client Requisition.
      </div>
    </div>
  `;

  const transport = getTransporter();

  if (!transport) {
    console.log('----------------------------------------------------');
    console.log('[HELPDESK MOCK EMAIL] SMTP unconfigured. Logged notification:');
    console.log(`To: ${destination}`);
    console.log(`Subject: ${emailSubject}`);
    console.log(`Sender: ${fullName} <${email}> (${company || 'Individual'})`);
    console.log(`Ticket: ${ticketId} [${category}]`);
    console.log('----------------------------------------------------');
    return {
      success: true,
      mode: 'mock_logged',
      recipient: destination,
      ticketId,
    };
  }

  try {
    const info = await transport.sendMail({
      from: fromAddress,
      to: destination,
      subject: emailSubject,
      html: htmlContent,
    });
    console.log(
      `[HELPDESK EMAIL DELIVERED] To ${destination} (Ticket: ${ticketId}): ${info.messageId}`
    );
    return {
      success: true,
      mode: 'smtp_delivered',
      recipient: destination,
      messageId: info.messageId,
      ticketId,
    };
  } catch (err) {
    console.warn(
      `[HELPDESK EMAIL ERROR] Failed delivering to ${destination}:`,
      err.message
    );
    return {
      success: false,
      error: err.message,
      recipient: destination,
      ticketId,
    };
  }
};

