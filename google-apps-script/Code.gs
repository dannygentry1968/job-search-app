/**
 * EduJob Tracker - Google Apps Script Backend
 *
 * This script handles:
 * - Daily job scraping from multiple sites
 * - Data storage in Google Sheets
 * - Web App API for frontend communication
 * - Email notifications
 *
 * SETUP INSTRUCTIONS:
 * 1. Create a new Google Sheets document
 * 2. Open Extensions > Apps Script
 * 3. Copy all .gs files into the project
 * 4. Set up Script Properties (see Config.gs)
 * 5. Deploy as Web App
 * 6. Set up daily trigger
 */

// ========================================
// MAIN ENTRY POINTS
// ========================================

/**
 * Main function to run all scrapers
 * Set this up as a daily trigger (e.g., 6 AM)
 */
function runDailyScrape() {
  console.log('Starting daily job scrape...');

  const results = {
    edJoin: 0,
    schoolSpring: 0,
    wasa: 0,
    higherEdJobs: 0,
    k12JobSpot: 0,
    errors: []
  };

  try {
    results.edJoin = scrapeEdJoin();
    console.log(`EdJoin: ${results.edJoin} jobs`);
  } catch (e) {
    results.errors.push(`EdJoin: ${e.message}`);
    console.error('EdJoin error:', e);
  }

  try {
    results.schoolSpring = scrapeSchoolSpring();
    console.log(`SchoolSpring: ${results.schoolSpring} jobs`);
  } catch (e) {
    results.errors.push(`SchoolSpring: ${e.message}`);
    console.error('SchoolSpring error:', e);
  }

  try {
    results.wasa = scrapeWASA();
    console.log(`WASA: ${results.wasa} jobs`);
  } catch (e) {
    results.errors.push(`WASA: ${e.message}`);
    console.error('WASA error:', e);
  }

  try {
    results.higherEdJobs = scrapeHigherEdJobs();
    console.log(`HigherEdJobs: ${results.higherEdJobs} jobs`);
  } catch (e) {
    results.errors.push(`HigherEdJobs: ${e.message}`);
    console.error('HigherEdJobs error:', e);
  }

  try {
    results.k12JobSpot = scrapeK12JobSpot();
    console.log(`K12JobSpot: ${results.k12JobSpot} jobs`);
  } catch (e) {
    results.errors.push(`K12JobSpot: ${e.message}`);
    console.error('K12JobSpot error:', e);
  }

  // Mark old "new" jobs as not new
  markOldJobsAsNotNew();

  // Send summary email
  sendScrapeSummaryEmail(results);

  console.log('Daily scrape complete:', results);
  return results;
}

/**
 * Web App entry point for GET requests
 */
function doGet(e) {
  const action = e.parameter.action;

  let result;

  switch (action) {
    case 'getJobs':
      result = getJobs(e.parameter);
      break;
    case 'getJob':
      result = getJobById(e.parameter.id);
      break;
    case 'getApplications':
      result = getApplications();
      break;
    case 'getEmails':
      result = getEmails(e.parameter.appId);
      break;
    case 'getUserProfile':
      result = getUserProfile();
      break;
    case 'getStats':
      result = getStats();
      break;
    default:
      result = { error: 'Unknown action' };
  }

  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Web App entry point for POST requests
 */
function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  const action = data.action;

  let result;

  switch (action) {
    case 'updateJobStatus':
      result = updateJobStatus(data.jobId, data.status);
      break;
    case 'createApplication':
      result = createApplication(data);
      break;
    case 'updateApplication':
      result = updateApplication(data);
      break;
    case 'saveMatchScores':
      result = saveMatchScores(data.scores);
      break;
    default:
      result = { error: 'Unknown action' };
  }

  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

// ========================================
// DATA ACCESS FUNCTIONS
// ========================================

/**
 * Get all jobs with optional filtering
 */
function getJobs(params = {}) {
  const sheet = getSheet('Jobs');
  const data = sheet.getDataRange().getValues();
  const headers = data[0];

  let jobs = [];
  for (let i = 1; i < data.length; i++) {
    const job = {};
    headers.forEach((header, index) => {
      job[header] = data[i][index];
    });

    // Apply filters
    if (params.source && job.source !== params.source) return;
    if (params.state && job.state !== params.state) return;
    if (params.is_active === 'true' && !job.is_active) return;

    jobs.push(job);
  }

  return jobs;
}

/**
 * Get a single job by ID
 */
function getJobById(jobId) {
  const sheet = getSheet('Jobs');
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const jobIdIndex = headers.indexOf('job_id');

  for (let i = 1; i < data.length; i++) {
    if (data[i][jobIdIndex] === jobId) {
      const job = {};
      headers.forEach((header, index) => {
        job[header] = data[i][index];
      });
      return job;
    }
  }

  return null;
}

/**
 * Update job status
 */
function updateJobStatus(jobId, status) {
  const sheet = getSheet('Jobs');
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const jobIdIndex = headers.indexOf('job_id');
  const statusIndex = headers.indexOf('status');

  for (let i = 1; i < data.length; i++) {
    if (data[i][jobIdIndex] === jobId) {
      sheet.getRange(i + 1, statusIndex + 1).setValue(status);
      return { success: true };
    }
  }

  return { success: false, error: 'Job not found' };
}

/**
 * Save match scores from AI analysis
 */
function saveMatchScores(scores) {
  const sheet = getSheet('Jobs');
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const jobIdIndex = headers.indexOf('job_id');
  const scoreIndex = headers.indexOf('match_score');
  const notesIndex = headers.indexOf('match_notes');

  let updated = 0;

  scores.forEach(score => {
    for (let i = 1; i < data.length; i++) {
      if (data[i][jobIdIndex] === score.job_id) {
        sheet.getRange(i + 1, scoreIndex + 1).setValue(score.match_score);
        sheet.getRange(i + 1, notesIndex + 1).setValue(score.match_notes);
        updated++;
        break;
      }
    }
  });

  return { success: true, updated };
}

/**
 * Mark jobs older than 24 hours as not new
 */
function markOldJobsAsNotNew() {
  const sheet = getSheet('Jobs');
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const dateScrapedIndex = headers.indexOf('date_scraped');
  const isNewIndex = headers.indexOf('is_new');

  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  for (let i = 1; i < data.length; i++) {
    const dateScraped = new Date(data[i][dateScrapedIndex]);
    if (dateScraped < oneDayAgo && data[i][isNewIndex] === true) {
      sheet.getRange(i + 1, isNewIndex + 1).setValue(false);
    }
  }
}

/**
 * Get dashboard stats
 */
function getStats() {
  const jobs = getJobs();

  return {
    total: jobs.length,
    newJobs: jobs.filter(j => j.is_new).length,
    highMatch: jobs.filter(j => j.match_score >= 80).length,
    applied: jobs.filter(j => j.status === 'Applied').length,
    bySource: {
      EdJoin: jobs.filter(j => j.source === 'EdJoin').length,
      SchoolSpring: jobs.filter(j => j.source === 'SchoolSpring').length,
      WASA: jobs.filter(j => j.source === 'WASA').length,
      HigherEdJobs: jobs.filter(j => j.source === 'HigherEdJobs').length,
      K12JobSpot: jobs.filter(j => j.source === 'K12JobSpot').length
    }
  };
}

// ========================================
// APPLICATION TRACKING
// ========================================

/**
 * Get all applications
 */
function getApplications() {
  const sheet = getSheet('Applications');
  const data = sheet.getDataRange().getValues();
  const headers = data[0];

  const applications = [];
  for (let i = 1; i < data.length; i++) {
    const app = {};
    headers.forEach((header, index) => {
      app[header] = data[i][index];
    });
    applications.push(app);
  }

  return applications;
}

/**
 * Create new application
 */
function createApplication(data) {
  const sheet = getSheet('Applications');
  const appId = 'app-' + Utilities.getUuid();

  const row = [
    appId,
    data.job_id,
    data.status || 'Draft',
    new Date(),
    data.deadline || '',
    data.materials_sent || '',
    data.contact_name || '',
    data.contact_email || '',
    data.notes || '',
    data.next_action || '',
    data.next_action_date || '',
    data.cover_letter_url || '',
    data.resume_url || ''
  ];

  sheet.appendRow(row);

  // Update job status
  updateJobStatus(data.job_id, 'Applied');

  return { success: true, app_id: appId };
}

/**
 * Update existing application
 */
function updateApplication(data) {
  const sheet = getSheet('Applications');
  const dataRange = sheet.getDataRange().getValues();
  const headers = dataRange[0];
  const appIdIndex = headers.indexOf('app_id');

  for (let i = 1; i < dataRange.length; i++) {
    if (dataRange[i][appIdIndex] === data.app_id) {
      // Update each field that was provided
      Object.keys(data).forEach(key => {
        const colIndex = headers.indexOf(key);
        if (colIndex !== -1 && key !== 'app_id') {
          sheet.getRange(i + 1, colIndex + 1).setValue(data[key]);
        }
      });
      return { success: true };
    }
  }

  return { success: false, error: 'Application not found' };
}

// ========================================
// EMAIL NOTIFICATIONS
// ========================================

/**
 * Send daily scrape summary email
 */
function sendScrapeSummaryEmail(results) {
  const email = getUserEmail();
  if (!email) return;

  const totalJobs = results.edJoin + results.schoolSpring + results.wasa +
                    results.higherEdJobs + results.k12JobSpot;

  let body = `Daily Job Scrape Summary\n\n`;
  body += `Total new jobs found: ${totalJobs}\n\n`;
  body += `By Source:\n`;
  body += `- EdJoin: ${results.edJoin}\n`;
  body += `- SchoolSpring: ${results.schoolSpring}\n`;
  body += `- WASA: ${results.wasa}\n`;
  body += `- HigherEdJobs: ${results.higherEdJobs}\n`;
  body += `- K12JobSpot: ${results.k12JobSpot}\n`;

  if (results.errors.length > 0) {
    body += `\nErrors:\n`;
    results.errors.forEach(err => {
      body += `- ${err}\n`;
    });
  }

  body += `\nView your jobs: [Your Netlify URL here]`;

  GmailApp.sendEmail(email, `EduJob Tracker: ${totalJobs} New Jobs Found`, body);
}

/**
 * Send deadline reminder email
 */
function sendDeadlineReminders() {
  const email = getUserEmail();
  if (!email) return;

  const applications = getApplications();
  const upcoming = applications.filter(app => {
    if (!app.deadline || app.status === 'Submitted') return false;
    const deadline = new Date(app.deadline);
    const daysUntil = (deadline - new Date()) / (1000 * 60 * 60 * 24);
    return daysUntil > 0 && daysUntil <= 7;
  });

  if (upcoming.length === 0) return;

  let body = `Upcoming Application Deadlines\n\n`;

  upcoming.forEach(app => {
    const job = getJobById(app.job_id);
    const deadline = new Date(app.deadline).toLocaleDateString();
    body += `- ${job.title} at ${job.organization}\n`;
    body += `  Deadline: ${deadline}\n`;
    body += `  Status: ${app.status}\n\n`;
  });

  GmailApp.sendEmail(email, `EduJob Tracker: ${upcoming.length} Upcoming Deadlines`, body);
}

// ========================================
// SETUP & INITIALIZATION
// ========================================

/**
 * Create all required sheets with proper headers
 * Run this once to set up your spreadsheet
 */
function initializeSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // Jobs sheet
  createSheetIfNotExists(ss, 'Jobs', [
    'job_id', 'source', 'title', 'organization', 'location', 'state',
    'salary_min', 'salary_max', 'deadline', 'url', 'date_posted',
    'date_scraped', 'is_new', 'is_active', 'match_score', 'match_notes', 'status'
  ]);

  // Applications sheet
  createSheetIfNotExists(ss, 'Applications', [
    'app_id', 'job_id', 'status', 'date_applied', 'deadline',
    'materials_sent', 'contact_name', 'contact_email', 'notes',
    'next_action', 'next_action_date', 'cover_letter_url', 'resume_url'
  ]);

  // Emails sheet
  createSheetIfNotExists(ss, 'Emails', [
    'email_id', 'app_id', 'date', 'direction', 'subject',
    'from', 'to', 'snippet', 'gmail_link'
  ]);

  // Dossiers sheet
  createSheetIfNotExists(ss, 'Dossiers', [
    'dossier_id', 'organization', 'location', 'date_created',
    'content', 'rentals_data'
  ]);

  // Settings sheet
  createSheetIfNotExists(ss, 'Settings', [
    'key', 'value'
  ]);

  console.log('Sheets initialized successfully!');
}

function createSheetIfNotExists(ss, name, headers) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

/**
 * Set up daily trigger for scraping
 * Run this once to enable automatic daily scraping
 */
function createDailyTrigger() {
  // Delete existing triggers
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'runDailyScrape') {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  // Create new daily trigger at 6 AM
  ScriptApp.newTrigger('runDailyScrape')
    .timeBased()
    .atHour(6)
    .everyDays(1)
    .create();

  console.log('Daily trigger created for 6 AM');
}

/**
 * Set up deadline reminder trigger
 */
function createDeadlineReminderTrigger() {
  ScriptApp.newTrigger('sendDeadlineReminders')
    .timeBased()
    .atHour(8)
    .everyDays(1)
    .create();

  console.log('Deadline reminder trigger created for 8 AM');
}
