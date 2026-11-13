import * as XLSX from 'xlsx';

/**
 * Robust date sanitizer that safely handles:
 * - Excel numeric date serials (e.g. 45234 -> "2023-10-25")
 * - Formatted date strings: "YYYY-MM-DD", "DD/MM/YYYY", "MM/DD/YYYY", "DD-MM-YYYY"
 * - ISO timestamp strings
 * - Text like "Immediate", "ASAP", "N/A" (preserved cleanly without throwing)
 */
export const sanitizeDateString = (val, fallback = '') => {
  if (val === undefined || val === null || val === '') return fallback;
  if (typeof val === 'number') {
    if (val > 20000 && val < 90000) {
      try {
        const jsDate = new Date(Math.round((val - 25569) * 86400 * 1000));
        if (!isNaN(jsDate.getTime())) {
          return jsDate.toISOString().split('T')[0];
        }
      } catch {
        // fall through
      }
    }
    return String(val);
  }
  const str = String(val).trim();
  if (!str) return fallback;
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;

  // DD/MM/YYYY or DD-MM-YYYY
  const dmy = str.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (dmy) {
    const day = dmy[1].padStart(2, '0');
    const month = dmy[2].padStart(2, '0');
    const year = dmy[3];
    return `${year}-${month}-${day}`;
  }

  const parsed = Date.parse(str);
  if (!isNaN(parsed)) {
    try {
      return new Date(parsed).toISOString().split('T')[0];
    } catch {
      // fall through
    }
  }
  return str;
};

/**
 * Robust number sanitizer that extracts numeric values from strings:
 * e.g. "5 yrs" -> 5, "₹28 LPA" -> 28, "$45" -> 45, "N/A" -> fallback
 */
export const sanitizeNumber = (val, fallback = 0) => {
  if (typeof val === 'number' && !isNaN(val)) return val;
  if (val === undefined || val === null || val === '') return fallback;
  const str = String(val).replace(/,/g, '').trim();
  const match = str.match(/-?\d+(\.\d+)?/);
  if (match) {
    const num = Number(match[0]);
    return isNaN(num) ? fallback : num;
  }
  return fallback;
};

/**
 * 1. Standard Job Requirements Column Definitions
 */
export const JOB_REQUIREMENT_COLUMNS = [
  {
    header: 'Job ID',
    key: 'jobId',
    aliases: ['job id', 'jobid', 'requisition id', 'req id', 'job code', 'mandate id', 'id'],
    default: () => `JOB-${Math.floor(10000 + Math.random() * 90000)}`,
    sample: 'JOB-10492',
    formatter: (item, val) =>
      val || item.id || `JOB-${Math.floor(10000 + Math.random() * 90000)}`,
  },
  {
    header: 'Job Title',
    key: 'title',
    aliases: ['job title', 'title', 'role', 'position', 'designation'],
    default: 'Senior Software Engineer',
    sample: 'Senior Full Stack Engineer',
    formatter: (item, val) =>
      val || item.role || item.position || 'Senior Software Engineer',
  },
  {
    header: 'Client Name',
    key: 'client',
    aliases: ['client name', 'client', 'company', 'organization', 'account'],
    default: 'Enterprise Partner',
    sample: 'Acme Global Corp',
    formatter: (item, val) => val || 'Enterprise Partner',
  },
  {
    header: 'Industry Sector',
    key: 'industry',
    aliases: ['industry sector', 'industry', 'domain'],
    default: 'Information Technology & Cloud',
    sample: 'Information Technology & Cloud',
  },
  {
    header: 'Employment Mode',
    key: 'jobMode',
    aliases: ['employment mode', 'job mode', 'engagement type', 'type'],
    default: 'Permanent',
    sample: 'Permanent',
  },
  {
    header: 'Work Mode',
    key: 'workMode',
    aliases: ['work mode', 'work arrangement', 'remote status'],
    default: 'Work From Office',
    sample: 'Hybrid',
  },
  {
    header: 'Office Location',
    key: 'officeLocation',
    aliases: ['office location', 'location', 'city'],
    default: 'Bangalore, India',
    sample: 'Bangalore, India',
    formatter: (item, val) => val || item.location || 'Bangalore, India',
  },
  {
    header: 'Experience (Years)',
    key: 'experienceRequired',
    type: 'number',
    aliases: ['experience (years)', 'experience', 'min experience', 'exp'],
    default: 3,
    sample: 5,
    formatter: (item, val) => sanitizeNumber(val ?? item.experience, 3),
  },
  {
    header: 'Notice Period',
    key: 'noticePeriod',
    aliases: ['notice period', 'joining', 'availability'],
    default: 'Immediate',
    sample: '15 Days',
  },
  {
    header: 'Job Creation Date',
    key: 'jobCreationDate',
    isDate: true,
    aliases: [
      'job creation date',
      'creation date',
      'created date',
      'posted date',
      'date of creation',
      'created at',
      'creation',
    ],
    default: () => new Date().toISOString().split('T')[0],
    sample: new Date().toISOString().split('T')[0],
    formatter: (item, val) =>
      sanitizeDateString(
        val || item.createdAt || item.postedDate,
        new Date().toISOString().split('T')[0]
      ),
  },
  {
    header: 'Expected Joining Date',
    key: 'expectedJoiningDate',
    isDate: true,
    aliases: [
      'expected joining date',
      'expected joining data',
      'target joining date',
      'joining date',
      'target date',
      'expected date',
      'expected joining',
      'joining',
    ],
    default: '',
    sample: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0],
    formatter: (item, val) => sanitizeDateString(val || item.joining, ''),
  },
  {
    header: 'Required Skills',
    key: 'requiredSkills',
    aliases: ['required skills', 'skills', 'tech stack', 'primary skills'],
    default: '',
    sample: 'React.js, Node.js, TypeScript, AWS',
    formatter: (item, val) =>
      Array.isArray(val)
        ? val.join(', ')
        : val || (Array.isArray(item.skills) ? item.skills.join(', ') : ''),
  },
  {
    header: 'Openings Count',
    key: 'openingsCount',
    type: 'number',
    aliases: ['openings count', 'openings', 'vacancies', 'headcount'],
    default: 1,
    sample: 2,
    formatter: (item, val) => sanitizeNumber(val, 1),
  },
  {
    header: 'Budget / Salary',
    key: 'budget',
    aliases: ['budget / salary', 'budget', 'salary', 'ctc', 'package'],
    default: '',
    sample: '₹28-35 LPA ($45-55k)',
    formatter: (item, val) => val || item.salary || '',
  },
  {
    header: 'Priority',
    key: 'priority',
    aliases: ['priority', 'urgency', 'sla'],
    default: 'High',
    sample: 'High',
  },
  {
    header: 'Status',
    key: 'status',
    aliases: ['status', 'state'],
    default: 'Open',
    sample: 'Open',
  },
  {
    header: 'Job Description',
    key: 'description',
    aliases: ['job description', 'description', 'summary', 'overview'],
    default: '',
    sample:
      'Lead core engineering initiatives and build high-scale microservices.',
  },
  {
    header: 'Key Requirements',
    key: 'requirements',
    aliases: ['key requirements', 'requirements', 'qualifications'],
    default: '',
    sample: 'Solid CS fundamentals; 4+ yrs React and Node in production.',
  },
];

/**
 * 2. Enterprise Candidate ATS Column Definitions
 * Includes all 17 tracker columns + Position Applied + Job ID
 */
export const CANDIDATE_ATS_COLUMNS = [
  {
    header: 'Application Date',
    key: 'applicationDate',
    isDate: true,
    aliases: ['application date', 'app date', 'date of application', 'date'],
    default: () => new Date().toISOString().split('T')[0],
    sample: new Date().toISOString().split('T')[0],
    formatter: (item, val) =>
      sanitizeDateString(
        val || item.createdAt,
        new Date().toISOString().split('T')[0]
      ),
  },
  {
    header: 'Month',
    key: 'month',
    aliases: ['month', 'application month', 'cohort'],
    default: () =>
      new Date().toLocaleString('default', { month: 'long', year: 'numeric' }),
    sample: 'November 2026',
    formatter: (item, val) =>
      val ||
      new Date().toLocaleString('default', { month: 'long', year: 'numeric' }),
  },
  {
    header: 'Mode',
    key: 'mode',
    aliases: ['mode', 'employment mode', 'work mode', 'engagement mode'],
    default: 'Permanent',
    sample: 'Permanent',
    formatter: (item, val) => val || item.workMode || 'Permanent',
  },
  {
    header: 'Name',
    key: 'name',
    aliases: ['name', 'full name', 'candidate name', 'candidate'],
    default: 'Candidate',
    sample: 'Arjun Sharma',
    formatter: (item, val) => val || item.candidateName || 'Candidate',
  },
  {
    header: 'Contact No',
    key: 'phone',
    aliases: [
      'contact no',
      'contact',
      'mobile',
      'mobile no',
      'phone',
      'phone number',
    ],
    default: '',
    sample: '+91 98765 43210',
    formatter: (item, val) => val || item.mobileNumber || '',
  },
  {
    header: 'Email',
    key: 'email',
    isEmail: true,
    aliases: ['email', 'email address', 'email id'],
    default: () => `candidate_${Date.now()}@imported.thinkwires.com`,
    sample: 'arjun.sharma@example.com',
    formatter: (item, val) => val || '',
  },
  {
    header: 'Client',
    key: 'client',
    aliases: ['client', 'client name', 'target client', 'account'],
    default: 'Enterprise Partner',
    sample: 'Goldman Sachs',
    formatter: (item, val) => val || 'Enterprise Partner',
  },
  {
    header: 'Position Applied',
    key: 'positionApplied',
    aliases: [
      'position applied',
      'position',
      'applied for',
      'job title',
      'role applied',
      'job role',
      'role',
      'designation',
    ],
    default: 'Lead Full Stack & Frontend Engineer',
    sample: 'Senior Full Stack Engineer',
    formatter: (item, val) =>
      val ||
      item.jobTitle ||
      item.currentRole ||
      'Lead Full Stack & Frontend Engineer',
  },
  {
    header: 'Job ID',
    key: 'jobId',
    aliases: [
      'job id',
      'jobid',
      'requisition id',
      'req id',
      'job code',
      'mandate id',
    ],
    default: '',
    sample: 'JOB-10492',
    formatter: (item, val) => val || '',
  },
  {
    header: 'Primary Skill',
    key: 'primarySkill',
    aliases: [
      'primary skill',
      'primary skills',
      'technical skills',
      'skills',
      'skillset',
    ],
    default: '',
    sample: 'React.js, Node.js, TypeScript, PostgreSQL',
    formatter: (item, val) =>
      val ||
      (Array.isArray(item.technicalSkills)
        ? item.technicalSkills.join(', ')
        : Array.isArray(item.skills)
          ? item.skills.join(', ')
          : ''),
  },
  {
    header: 'Total Experience',
    key: 'totalExperience',
    type: 'number',
    aliases: ['total experience', 'total exp', 'experience', 'total years'],
    default: 0,
    sample: 6.5,
    formatter: (item, val) =>
      sanitizeNumber(val ?? item.experience ?? item.totalExperienceYears, 0),
  },
  {
    header: 'Relevant Experience',
    key: 'relevantExperience',
    type: 'number',
    aliases: ['relevant experience', 'relevant exp', 'rel exp'],
    default: 0,
    sample: 4.5,
    formatter: (item, val) =>
      sanitizeNumber(val ?? item.relevantExperienceYears, 0),
  },
  {
    header: 'Current Location',
    key: 'currentLocation',
    aliases: ['current location', 'location', 'city'],
    default: 'Bangalore',
    sample: 'Bangalore, India',
    formatter: (item, val) => val || item.location || item.city || 'Bangalore',
  },
  {
    header: 'Preferred Location',
    key: 'preferredLocation',
    aliases: ['preferred location', 'preference', 'work location preference'],
    default: 'Bangalore / Remote',
    sample: 'Bangalore / Remote',
    formatter: (item, val) => val || 'Bangalore / Remote',
  },
  {
    header: 'Current Company',
    key: 'currentCompany',
    aliases: [
      'current company',
      'current employer',
      'company',
      'organization',
    ],
    default: '',
    sample: 'Infosys Ltd',
    formatter: (item, val) => val || item.currentEmployer || '',
  },
  {
    header: 'CTC',
    key: 'currentCTC',
    aliases: ['ctc', 'current ctc', 'current salary', 'present ctc'],
    default: '',
    sample: '₹18 LPA',
    formatter: (item, val) => val || '',
  },
  {
    header: 'Expected CTC',
    key: 'expectedCTC',
    aliases: ['expected ctc', 'expected salary', 'ectc'],
    default: '',
    sample: '₹24 LPA',
    formatter: (item, val) => val || item.expectedSalary || '',
  },
  {
    header: 'Rate Card',
    key: 'rateCard',
    aliases: [
      'rate card',
      'rate',
      'hourly rate',
      'billing rate',
      'monthly rate',
    ],
    default: '',
    sample: '$45/hr',
    formatter: (item, val) => val || '',
  },
  {
    header: 'Notice Period',
    key: 'noticePeriod',
    aliases: ['notice period', 'np', 'availability', 'joining'],
    default: 'Immediate',
    sample: '15 Days',
    formatter: (item, val) => val || 'Immediate',
  },
];

/**
 * 3. Export Data to Excel (.xlsx) or CSV (.csv)
 */
export const exportToExcel = ({
  data = [],
  columns = [],
  filename = 'export',
  format = 'xlsx',
}) => {
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error('No records available to export.');
  }

  // Format rows according to specified columns
  const formattedRows = data.map((item) => {
    const row = {};
    columns.forEach((col) => {
      let val = item[col.key];

      // Custom column formatter if available
      if (typeof col.formatter === 'function') {
        val = col.formatter(item, val);
      } else {
        // Array handling (e.g. skills)
        if (Array.isArray(val)) {
          val = val.join(', ');
        }
        // Fallbacks
        if (val === undefined || val === null) {
          val =
            typeof col.default === 'function' ? col.default() : col.default || '';
        }
      }

      row[col.header] = val;
    });
    return row;
  });

  // Create sheet
  const ws = XLSX.utils.json_to_sheet(formattedRows);

  // Auto-calculate column widths
  const colWidths = columns.map((col) => {
    let maxLen = col.header.length;
    formattedRows.forEach((row) => {
      const cellValue = String(row[col.header] || '');
      if (cellValue.length > maxLen) {
        maxLen = Math.min(cellValue.length, 60);
      }
    });
    return { wch: Math.max(maxLen + 3, 12) };
  });
  ws['!cols'] = colWidths;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Data');

  const fileExt = format.toLowerCase() === 'csv' ? 'csv' : 'xlsx';
  const cleanFilename = `${filename.replace(/\.[^/.]+$/, '')}.${fileExt}`;

  if (fileExt === 'csv') {
    const csvOutput = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([csvOutput], { type: 'text/csv;charset=utf-8;' });
    triggerDownload(blob, cleanFilename);
  } else {
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    triggerDownload(blob, cleanFilename);
  }

  return cleanFilename;
};

/**
 * 4. Generate Sample Template File
 */
export const generateSampleTemplate = ({
  columns = [],
  filename = 'sample_template',
  format = 'xlsx',
}) => {
  const sampleRow = {};
  columns.forEach((col) => {
    sampleRow[col.header] = col.sample !== undefined ? col.sample : '';
  });

  const ws = XLSX.utils.json_to_sheet([sampleRow]);

  const colWidths = columns.map((col) => ({
    wch: Math.max(col.header.length + 4, 14),
  }));
  ws['!cols'] = colWidths;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Template');

  const fileExt = format.toLowerCase() === 'csv' ? 'csv' : 'xlsx';
  const cleanFilename = `${filename.replace(/\.[^/.]+$/, '')}.${fileExt}`;

  if (fileExt === 'csv') {
    const csvOutput = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([csvOutput], { type: 'text/csv;charset=utf-8;' });
    triggerDownload(blob, cleanFilename);
  } else {
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    triggerDownload(blob, cleanFilename);
  }

  return cleanFilename;
};

/**
 * Helper to download Blob in browser
 */
const triggerDownload = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

/**
 * 5. Parse and Validate Uploaded File (.xlsx, .xls, .csv)
 * Bulletproof error-free parser: auto-heals missing/mistyped values
 * and converts Excel date serial numbers without throwing errors.
 */
export const parseFile = async (file, columnDefinitions = []) => {
  if (!file) throw new Error('Please select a file to parse.');

  const fileExt = file.name.split('.').pop().toLowerCase();
  if (!['xlsx', 'xls', 'csv'].includes(fileExt)) {
    throw new Error(
      'Unsupported file format. Please upload an Excel (.xlsx, .xls) or CSV file.'
    );
  }

  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });

  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    throw new Error('The uploaded spreadsheet contains no sheets.');
  }

  const worksheet = workbook.Sheets[firstSheetName];
  // defval: '' guarantees undefined cell lookups never crash
  const rawRows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

  if (rawRows.length === 0) {
    throw new Error(
      'The uploaded file is empty. Please check the sheet and try again.'
    );
  }

  // Pre-build a map of normalized headers to column definition
  const headerMap = new Map();
  columnDefinitions.forEach((col) => {
    const cleanHeader = normalizeString(col.header);
    headerMap.set(cleanHeader, col);
    if (Array.isArray(col.aliases)) {
      col.aliases.forEach((alias) =>
        headerMap.set(normalizeString(alias), col)
      );
    }
  });

  const validRows = [];
  const invalidRows = [];

  rawRows.forEach((rawRow, rowIndex) => {
    const rowNumber = rowIndex + 2; // Row 1 is header
    const parsedData = {};
    const warnings = [];

    // Check if row is completely blank (all cells empty or whitespace)
    const hasAnyContent = Object.values(rawRow).some(
      (v) => v !== undefined && v !== null && String(v).trim() !== ''
    );
    if (!hasAnyContent) {
      return; // Skip completely blank row gracefully with zero error
    }

    // Map properties from incoming row
    Object.keys(rawRow).forEach((rawHeader) => {
      const cleanHeader = normalizeString(rawHeader);
      const colDef = headerMap.get(cleanHeader);
      if (colDef) {
        let value = rawRow[rawHeader];
        if (typeof value === 'string') {
          value = value.trim();
        }
        parsedData[colDef.key] = value;
      }
    });

    // Auto-heal and normalize fields against schema
    columnDefinitions.forEach((col) => {
      let val = parsedData[col.key];

      // Date normalization (handles Excel serial numbers like 45234 and formatted dates)
      if (col.isDate) {
        const defaultDate =
          typeof col.default === 'function' ? col.default() : col.default || '';
        parsedData[col.key] = sanitizeDateString(val, defaultDate);
        return;
      }

      // Number coercion (extracts number from strings like "5 yrs", "₹24 LPA", or defaults)
      if (col.type === 'number') {
        const defaultNum = typeof col.default === 'number' ? col.default : 0;
        parsedData[col.key] = sanitizeNumber(val, defaultNum);
        return;
      }

      // Populate default if empty
      if (val === undefined || val === null || String(val).trim() === '') {
        val =
          typeof col.default === 'function' ? col.default() : col.default || '';
        parsedData[col.key] = val;
      }

      // Email normalization & auto-healing
      if (col.isEmail) {
        const emailStr = String(val).trim().toLowerCase();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailStr || !emailRegex.test(emailStr)) {
          // Auto-heal missing or mistyped email so no error blocks import
          const safeNamePart = String(parsedData.name || 'candidate')
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '.');
          const healedEmail = `${safeNamePart || 'candidate'}_${Date.now()}_${rowNumber}@imported.thinkwires.com`;
          parsedData[col.key] = healedEmail;
          warnings.push(`Auto-generated email for row #${rowNumber}`);
        } else {
          parsedData[col.key] = emailStr;
        }
      }
    });

    // Smart cross-field fallbacks
    if (parsedData.positionApplied && !parsedData.jobTitle) {
      parsedData.jobTitle = parsedData.positionApplied;
    }
    if (parsedData.jobTitle && !parsedData.positionApplied) {
      parsedData.positionApplied = parsedData.jobTitle;
    }
    if (!parsedData.name && parsedData.email) {
      const nameGuess = String(parsedData.email)
        .split('@')[0]
        .replace(/[._]/g, ' ');
      parsedData.name =
        nameGuess.charAt(0).toUpperCase() + nameGuess.slice(1);
    }
    if (!parsedData.jobId && parsedData.id) {
      parsedData.jobId = parsedData.id;
    }

    validRows.push({
      rowNumber,
      data: parsedData,
      warnings,
    });
  });

  return {
    fileName: file.name,
    totalCount: rawRows.length,
    validCount: validRows.length,
    errorCount: invalidRows.length,
    validRows: validRows.map((r) => r.data),
    invalidRows,
  };
};

const normalizeString = (str) =>
  String(str || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
