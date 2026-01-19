/**
 * WASA Career Connection Scraper
 *
 * Washington Association of School Administrators job board
 * https://wasa-oly.org/wasa/WASA/WASA_Services/Career_Connection/
 */

const WASA_BASE_URL = 'https://wasa-oly.org';
const WASA_JOBS_URL = 'https://wasa-oly.org/wasa/Responsive/WASA_Services/Career_Connection/Responsive/CareerConnections/Career_Connection_Instructions.aspx';

/**
 * Main WASA scraper function
 */
function scrapeWASA() {
  console.log('Starting WASA scrape...');

  let newJobCount = 0;

  // WASA has different categories
  const categories = [
    { name: 'Superintendent', url: getWASACategoryUrl('superintendent') },
    { name: 'Principal', url: getWASACategoryUrl('principal') },
    { name: 'Central Office', url: getWASACategoryUrl('central') }
  ];

  for (const category of categories) {
    try {
      const jobs = scrapeWASACategory(category.url);

      for (const job of jobs) {
        if (!isTargetPosition(job.title)) continue;

        if (addJob(job)) {
          newJobCount++;
        }
      }

      Utilities.sleep(2000);

    } catch (e) {
      console.error(`Error scraping WASA ${category.name}:`, e.message);
    }
  }

  console.log(`WASA: Found ${newJobCount} new jobs`);
  return newJobCount;
}

/**
 * Get WASA category URL
 */
function getWASACategoryUrl(category) {
  // WASA may use query parameters or different paths for categories
  const baseJobsUrl = 'https://wasa-oly.org/WASA/WASA_Services/Career_Connection/Job_Search-';

  const categoryMap = {
    'superintendent': 'Superintendent.aspx',
    'principal': 'Principal.aspx',
    'central': 'Central.aspx'
  };

  return baseJobsUrl + (categoryMap[category] || 'Superintendent.aspx');
}

/**
 * Scrape a WASA category page
 */
function scrapeWASACategory(url) {
  const jobs = [];

  const response = fetchWithRetry(url);
  if (!response) {
    console.log('Failed to fetch WASA category');
    return jobs;
  }

  const html = response.getContentText();

  // WASA typically displays jobs in a table or list format
  // Parse the HTML to extract job listings

  // Look for job listing patterns
  // This may need adjustment based on actual WASA HTML structure

  // Pattern for job listings - WASA often uses tables
  const tableRowPattern = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  const linkPattern = /<a[^>]*href="([^"]*)"[^>]*>([^<]+)<\/a>/i;

  let match;
  let isFirstRow = true;

  while ((match = tableRowPattern.exec(html)) !== null) {
    // Skip header row
    if (isFirstRow) {
      isFirstRow = false;
      if (match[1].includes('<th')) continue;
    }

    const rowHtml = match[1];

    // Skip if no link found
    const linkMatch = rowHtml.match(linkPattern);
    if (!linkMatch) continue;

    try {
      const jobUrl = linkMatch[1];
      const title = linkMatch[2].trim();

      // Skip non-job links
      if (!title || title.length < 5) continue;
      if (jobUrl.includes('javascript:') || jobUrl.includes('#')) continue;

      // Extract organization from another cell
      const cells = rowHtml.match(/<td[^>]*>([\s\S]*?)<\/td>/gi) || [];
      let organization = '';
      let location = 'Washington';
      let deadline = null;

      cells.forEach((cell, index) => {
        const cellText = cell.replace(/<[^>]+>/g, '').trim();

        // Heuristics for which cell contains what
        if (index === 1 && !cellText.includes('http')) {
          organization = cellText;
        }
        if (cellText.match(/\d{1,2}\/\d{1,2}\/\d{2,4}/)) {
          deadline = new Date(cellText.match(/\d{1,2}\/\d{1,2}\/\d{2,4}/)[0]);
        }
        if (cellText.match(/,\s*WA/i)) {
          location = cellText;
        }
      });

      const fullUrl = jobUrl.startsWith('http') ? jobUrl : WASA_BASE_URL + jobUrl;
      const jobId = generateJobId('WASA', fullUrl);

      jobs.push({
        job_id: jobId,
        source: 'WASA',
        title: title,
        organization: organization || 'Washington School District',
        location: location,
        state: 'WA',
        salary_min: null,
        salary_max: null,
        deadline: deadline,
        url: fullUrl,
        date_posted: new Date()
      });

    } catch (e) {
      console.error('Error parsing WASA row:', e.message);
    }
  }

  // Alternative: Look for div-based listings
  if (jobs.length === 0) {
    const divPattern = /<div[^>]*class="[^"]*job[^"]*"[^>]*>([\s\S]*?)<\/div>/gi;

    while ((match = divPattern.exec(html)) !== null) {
      const divHtml = match[1];
      const linkMatch = divHtml.match(linkPattern);

      if (linkMatch) {
        const jobUrl = linkMatch[1];
        const title = linkMatch[2].trim();

        if (title && title.length > 5) {
          const fullUrl = jobUrl.startsWith('http') ? jobUrl : WASA_BASE_URL + jobUrl;

          jobs.push({
            job_id: generateJobId('WASA', fullUrl),
            source: 'WASA',
            title: title,
            organization: 'Washington School District',
            location: 'Washington',
            state: 'WA',
            salary_min: null,
            salary_max: null,
            deadline: null,
            url: fullUrl,
            date_posted: new Date()
          });
        }
      }
    }
  }

  return jobs;
}

/**
 * Test function for WASA scraper
 */
function testWASAScraper() {
  console.log('Testing WASA scraper...');

  const url = getWASACategoryUrl('superintendent');
  console.log('Testing URL:', url);

  const response = fetchWithRetry(url);

  if (response) {
    console.log('Response code:', response.getResponseCode());
    console.log('Content length:', response.getContentText().length);

    // Log a snippet of the HTML for debugging
    const html = response.getContentText();
    console.log('HTML snippet:', html.substring(0, 1000));

  } else {
    console.log('Failed to fetch WASA');
  }
}
