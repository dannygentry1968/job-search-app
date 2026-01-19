/**
 * HigherEdJobs Scraper
 *
 * HigherEdJobs.com is the primary job board for higher education positions
 * https://www.higheredjobs.com/
 */

const HIGHEREDJOBS_BASE_URL = 'https://www.higheredjobs.com';

/**
 * Main HigherEdJobs scraper function
 */
function scrapeHigherEdJobs() {
  console.log('Starting HigherEdJobs scrape...');

  let newJobCount = 0;

  // Search for administration positions in target states
  const searchTerms = [
    'dean education',
    'dean college',
    'provost',
    'vice president academic',
    'director education'
  ];

  const states = ['California', 'Washington', 'Oregon', 'Idaho', 'Colorado', 'Nevada', 'Montana', 'Wyoming'];

  for (const term of searchTerms) {
    for (const state of states) {
      try {
        const jobs = searchHigherEdJobs(term, state);

        for (const job of jobs) {
          if (addJob(job)) {
            newJobCount++;
          }
        }

        Utilities.sleep(2000);

      } catch (e) {
        console.error(`Error searching HigherEdJobs for "${term}" in ${state}:`, e.message);
      }
    }
  }

  console.log(`HigherEdJobs: Found ${newJobCount} new jobs`);
  return newJobCount;
}

/**
 * Search HigherEdJobs
 */
function searchHigherEdJobs(searchTerm, state) {
  const jobs = [];

  // HigherEdJobs search URL
  const searchUrl = `${HIGHEREDJOBS_BASE_URL}/search/results.cfm?keyword=${encodeURIComponent(searchTerm)}&PosType=1&State=${encodeURIComponent(state)}`;

  const response = fetchWithRetry(searchUrl);
  if (!response) {
    return jobs;
  }

  const html = response.getContentText();

  // HigherEdJobs uses a specific listing format
  // Look for job entries

  const jobPattern = /<div[^>]*class="[^"]*job-result[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/gi;
  const linkPattern = /<a[^>]*href="([^"]*details\.cfm\?JobCode=\d+[^"]*)"[^>]*>([^<]+)<\/a>/i;

  let match;

  while ((match = jobPattern.exec(html)) !== null) {
    try {
      const jobHtml = match[1];

      const linkMatch = jobHtml.match(linkPattern);
      if (!linkMatch) continue;

      const jobUrl = linkMatch[1];
      const title = linkMatch[2].trim();

      if (!title) continue;

      // Extract organization
      const orgMatch = jobHtml.match(/(?:institution|employer|university|college)[^>]*>([^<]+)/i);
      const organization = orgMatch ? orgMatch[1].trim() : '';

      // Extract location
      const locMatch = jobHtml.match(/(?:location)[^>]*>([^<]+)/i);
      const location = locMatch ? locMatch[1].trim() : state;

      // Extract salary if present
      const salaryMatch = jobHtml.match(/\$[\d,]+(?:\s*[-–]\s*\$[\d,]+)?/);
      const salary = salaryMatch ? parseSalary(salaryMatch[0]) : null;

      const fullUrl = jobUrl.startsWith('http') ? jobUrl : HIGHEREDJOBS_BASE_URL + jobUrl;
      const jobId = generateJobId('HigherEdJobs', fullUrl);

      // Get state abbreviation
      const stateAbbrevMap = {
        'California': 'CA', 'Washington': 'WA', 'Oregon': 'OR',
        'Idaho': 'ID', 'Colorado': 'CO', 'Nevada': 'NV',
        'Montana': 'MT', 'Wyoming': 'WY'
      };

      jobs.push({
        job_id: jobId,
        source: 'HigherEdJobs',
        title: title,
        organization: organization,
        location: location,
        state: stateAbbrevMap[state] || extractState(location),
        salary_min: salary ? salary.min : null,
        salary_max: salary ? salary.max : null,
        deadline: null,
        url: fullUrl,
        date_posted: new Date()
      });

    } catch (e) {
      console.error('Error parsing HigherEdJobs job:', e.message);
    }
  }

  // Alternative: look for table-based listings
  if (jobs.length === 0) {
    const rowPattern = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;

    while ((match = rowPattern.exec(html)) !== null) {
      const rowHtml = match[1];

      // Skip header rows
      if (rowHtml.includes('<th')) continue;

      const linkMatch = rowHtml.match(/<a[^>]*href="([^"]*JobCode=\d+[^"]*)"[^>]*>([^<]+)<\/a>/i);

      if (linkMatch) {
        const jobUrl = linkMatch[1];
        const title = linkMatch[2].trim();

        if (title && title.length > 5) {
          const fullUrl = jobUrl.startsWith('http') ? jobUrl : HIGHEREDJOBS_BASE_URL + jobUrl;

          const stateAbbrevMap = {
            'California': 'CA', 'Washington': 'WA', 'Oregon': 'OR',
            'Idaho': 'ID', 'Colorado': 'CO', 'Nevada': 'NV',
            'Montana': 'MT', 'Wyoming': 'WY'
          };

          jobs.push({
            job_id: generateJobId('HigherEdJobs', fullUrl),
            source: 'HigherEdJobs',
            title: title,
            organization: '',
            location: state,
            state: stateAbbrevMap[state] || '',
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
 * Test function for HigherEdJobs scraper
 */
function testHigherEdJobsScraper() {
  console.log('Testing HigherEdJobs scraper...');

  const jobs = searchHigherEdJobs('dean', 'California');
  console.log('Jobs found:', jobs.length);

  if (jobs.length > 0) {
    console.log('Sample job:', JSON.stringify(jobs[0], null, 2));
  }
}
