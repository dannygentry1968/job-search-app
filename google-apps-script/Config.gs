/**
 * Configuration and Utilities
 *
 * SETUP INSTRUCTIONS:
 * 1. Go to Project Settings (gear icon)
 * 2. Scroll to Script Properties
 * 3. Add the following properties:
 *    - USER_EMAIL: Your email address for notifications
 *    - CLAUDE_API_KEY: Your Anthropic API key (optional, for direct GAS calls)
 */

// ========================================
// CONFIGURATION
// ========================================

/**
 * Target states for job filtering
 */
const TARGET_STATES = ['CA', 'WA', 'OR', 'ID', 'CO', 'WY', 'MT', 'NV'];

/**
 * Job title keywords to look for (admin positions)
 */
const TARGET_KEYWORDS = [
  'principal',
  'superintendent',
  'assistant superintendent',
  'director',
  'dean',
  'administrator',
  'coordinator',
  'head of school',
  'chief',
  'executive director'
];

// ========================================
// UTILITY FUNCTIONS
// ========================================

/**
 * Get a sheet by name
 */
function getSheet(name) {
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
}

/**
 * Get user email from script properties
 */
function getUserEmail() {
  return PropertiesService.getScriptProperties().getProperty('USER_EMAIL');
}

/**
 * Get Claude API key from script properties
 */
function getClaudeApiKey() {
  return PropertiesService.getScriptProperties().getProperty('CLAUDE_API_KEY');
}

/**
 * Generate a unique job ID from URL
 */
function generateJobId(source, url) {
  const hash = Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, url);
  const hashStr = hash.map(b => (b < 0 ? b + 256 : b).toString(16).padStart(2, '0')).join('').substring(0, 8);
  return `${source.toLowerCase().replace(/\s/g, '')}-${hashStr}`;
}

/**
 * Check if a job already exists
 */
function jobExists(jobId) {
  const sheet = getSheet('Jobs');
  const data = sheet.getDataRange().getValues();
  const jobIdIndex = data[0].indexOf('job_id');

  for (let i = 1; i < data.length; i++) {
    if (data[i][jobIdIndex] === jobId) {
      return true;
    }
  }
  return false;
}

/**
 * Add a new job to the sheet
 */
function addJob(job) {
  const sheet = getSheet('Jobs');

  // Check if job already exists
  if (jobExists(job.job_id)) {
    // Update the job instead (mark as still active)
    updateJobActive(job.job_id, true);
    return false; // Not a new job
  }

  const row = [
    job.job_id,
    job.source,
    job.title,
    job.organization,
    job.location,
    job.state || extractState(job.location),
    job.salary_min || '',
    job.salary_max || '',
    job.deadline || '',
    job.url,
    job.date_posted || new Date(),
    new Date(), // date_scraped
    true, // is_new
    true, // is_active
    '', // match_score (to be filled by AI)
    '', // match_notes
    'New' // status
  ];

  sheet.appendRow(row);
  return true; // New job added
}

/**
 * Update job active status
 */
function updateJobActive(jobId, isActive) {
  const sheet = getSheet('Jobs');
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const jobIdIndex = headers.indexOf('job_id');
  const isActiveIndex = headers.indexOf('is_active');

  for (let i = 1; i < data.length; i++) {
    if (data[i][jobIdIndex] === jobId) {
      sheet.getRange(i + 1, isActiveIndex + 1).setValue(isActive);
      return;
    }
  }
}

/**
 * Extract state abbreviation from location string
 */
function extractState(location) {
  if (!location) return '';

  // Common patterns: "City, CA", "City, CA 94533", "City, California"
  const stateMap = {
    'california': 'CA', 'washington': 'WA', 'oregon': 'OR',
    'idaho': 'ID', 'colorado': 'CO', 'wyoming': 'WY',
    'montana': 'MT', 'nevada': 'NV', 'texas': 'TX'
  };

  // Try to find state abbreviation
  const abbrevMatch = location.match(/,\s*([A-Z]{2})(?:\s|$|\d)/);
  if (abbrevMatch) {
    return abbrevMatch[1];
  }

  // Try to find full state name
  const locationLower = location.toLowerCase();
  for (const [name, abbrev] of Object.entries(stateMap)) {
    if (locationLower.includes(name)) {
      return abbrev;
    }
  }

  return '';
}

/**
 * Parse salary from string
 * Returns { min, max } or null
 */
function parseSalary(salaryStr) {
  if (!salaryStr) return null;

  // Remove common text
  const cleaned = salaryStr.replace(/[,$]/g, '').replace(/per year|annually|\/yr/gi, '');

  // Try to find range: "$100,000 - $150,000"
  const rangeMatch = cleaned.match(/(\d+)\s*[-–to]+\s*(\d+)/);
  if (rangeMatch) {
    return {
      min: parseInt(rangeMatch[1]),
      max: parseInt(rangeMatch[2])
    };
  }

  // Single number
  const singleMatch = cleaned.match(/(\d+)/);
  if (singleMatch) {
    const val = parseInt(singleMatch[1]);
    return { min: val, max: val };
  }

  return null;
}

/**
 * Check if job title matches our target positions
 */
function isTargetPosition(title) {
  if (!title) return false;
  const titleLower = title.toLowerCase();
  return TARGET_KEYWORDS.some(keyword => titleLower.includes(keyword));
}

/**
 * Check if location is in target states
 */
function isTargetState(location) {
  const state = extractState(location);
  return TARGET_STATES.includes(state) || state === ''; // Include if state unclear
}

/**
 * Fetch URL with retry logic
 */
function fetchWithRetry(url, options = {}, maxRetries = 3) {
  const defaultOptions = {
    muteHttpExceptions: true,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  };

  const mergedOptions = { ...defaultOptions, ...options };

  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = UrlFetchApp.fetch(url, mergedOptions);
      const code = response.getResponseCode();

      if (code === 200) {
        return response;
      }

      console.log(`Attempt ${i + 1}: HTTP ${code} for ${url}`);

      // Exponential backoff
      if (i < maxRetries - 1) {
        Utilities.sleep(Math.pow(2, i) * 1000);
      }
    } catch (e) {
      console.error(`Attempt ${i + 1} failed:`, e.message);
      if (i < maxRetries - 1) {
        Utilities.sleep(Math.pow(2, i) * 1000);
      }
    }
  }

  return null;
}

/**
 * Get user profile for AI matching
 */
function getUserProfile() {
  return {
    name: "Danny Gentry",
    education: [
      { degree: "Ed.D.", field: "Educational Leadership", year: 2018 },
      { degree: "M.Ed.", field: "Educational Administration", year: 1998 },
      { degree: "B.S.", field: "Biology", year: 1991 }
    ],
    certifications: [
      "California Administrative Credential (Clear)",
      "Texas Superintendent Certificate",
      "Texas Principal Certificate",
      "CPI Nonviolent Crisis Intervention"
    ],
    experience_years: {
      admin: 20,
      teaching: 12
    },
    current_role: "Principal, Rolling Hills Elementary (2015-present)",
    target_roles: ["Principal", "Superintendent", "Assistant Superintendent", "Director", "Dean"],
    target_states: TARGET_STATES,
    strengths: [
      "Ed.D. in Educational Leadership",
      "20 years administrative experience",
      "PK-12 experience across all levels",
      "Superintendent certification",
      "Diverse student population experience",
      "Technology integration expertise",
      "Published author"
    ]
  };
}
