/**
 * EdJoin Scraper
 *
 * EdJoin.org is the primary job board for California education jobs.
 * This scraper uses their search functionality to find admin positions.
 *
 * Target URL pattern:
 * https://www.edjoin.org/Home/Jobs?keywords=principal&page=1
 */

const EDJOIN_BASE_URL = 'https://www.edjoin.org';
const EDJOIN_SEARCH_URL = 'https://www.edjoin.org/Home/Jobs';

/**
 * Main EdJoin scraper function
 * Returns number of new jobs found
 */
function scrapeEdJoin() {
  console.log('Starting EdJoin scrape...');

  const searchTerms = [
    'principal',
    'superintendent',
    'assistant superintendent',
    'director curriculum',
    'director student services',
    'dean'
  ];

  let newJobCount = 0;
  const seenJobIds = new Set();

  for (const term of searchTerms) {
    try {
      const jobs = searchEdJoin(term);

      for (const job of jobs) {
        // Skip if we've already processed this job in this run
        if (seenJobIds.has(job.job_id)) continue;
        seenJobIds.add(job.job_id);

        // Filter for target positions and states
        if (!isTargetPosition(job.title)) continue;
        if (!isTargetState(job.location)) continue;

        // Add job (returns true if new)
        if (addJob(job)) {
          newJobCount++;
        }
      }

      // Be nice to the server
      Utilities.sleep(2000);

    } catch (e) {
      console.error(`Error searching EdJoin for "${term}":`, e.message);
    }
  }

  console.log(`EdJoin: Found ${newJobCount} new jobs`);
  return newJobCount;
}

/**
 * Search EdJoin for a specific term
 */
function searchEdJoin(searchTerm, maxPages = 3) {
  const jobs = [];

  for (let page = 1; page <= maxPages; page++) {
    const url = `${EDJOIN_SEARCH_URL}?keywords=${encodeURIComponent(searchTerm)}&page=${page}`;

    const response = fetchWithRetry(url);
    if (!response) {
      console.log(`Failed to fetch EdJoin page ${page}`);
      break;
    }

    const html = response.getContentText();
    const pageJobs = parseEdJoinSearchResults(html);

    if (pageJobs.length === 0) {
      break; // No more results
    }

    jobs.push(...pageJobs);

    // Don't fetch more pages if we got fewer than expected
    if (pageJobs.length < 20) {
      break;
    }

    Utilities.sleep(1000);
  }

  return jobs;
}

/**
 * Parse EdJoin search results HTML
 */
function parseEdJoinSearchResults(html) {
  const jobs = [];

  // EdJoin uses a specific HTML structure for job listings
  // Look for job cards with class "job-listing" or similar

  // Pattern to match job listing blocks
  // This is a simplified regex - may need adjustment based on actual HTML
  const jobPattern = /<div[^>]*class="[^"]*job-item[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/gi;
  const titlePattern = /<a[^>]*href="([^"]*\/Home\/JobPosting\/(\d+)[^"]*)"[^>]*>([^<]+)<\/a>/i;
  const orgPattern = /<span[^>]*class="[^"]*employer[^"]*"[^>]*>([^<]+)<\/span>/i;
  const locationPattern = /<span[^>]*class="[^"]*location[^"]*"[^>]*>([^<]+)<\/span>/i;
  const deadlinePattern = /deadline[^<]*<[^>]*>([^<]+)/i;
  const salaryPattern = /salary[^<]*<[^>]*>([^<]+)/i;

  // Alternative: Parse based on EdJoin's actual structure
  // EdJoin typically has job cards with specific data attributes

  // Try to extract job data using data attributes or JSON embedded in page
  const jsonDataPattern = /var\s+jobData\s*=\s*(\[[\s\S]*?\]);/;
  const jsonMatch = html.match(jsonDataPattern);

  if (jsonMatch) {
    // If there's embedded JSON data, use that
    try {
      const jobData = JSON.parse(jsonMatch[1]);
      return jobData.map(job => formatEdJoinJob(job));
    } catch (e) {
      console.log('Could not parse EdJoin JSON data');
    }
  }

  // Fallback: Parse HTML directly
  // Look for job listing rows
  const rowPattern = /<tr[^>]*class="[^"]*clickable-row[^"]*"[^>]*data-href="([^"]*)"[^>]*>([\s\S]*?)<\/tr>/gi;

  let match;
  while ((match = rowPattern.exec(html)) !== null) {
    try {
      const jobUrl = match[1];
      const rowHtml = match[2];

      // Extract job ID from URL
      const idMatch = jobUrl.match(/\/(\d+)/);
      if (!idMatch) continue;

      const jobId = generateJobId('EdJoin', jobUrl);

      // Extract title (usually first column)
      const titleMatch = rowHtml.match(/<td[^>]*>[\s\S]*?<a[^>]*>([^<]+)<\/a>/i);
      const title = titleMatch ? titleMatch[1].trim() : '';

      // Extract organization
      const orgMatch = rowHtml.match(/<td[^>]*class="[^"]*employer[^"]*"[^>]*>([^<]+)/i);
      const organization = orgMatch ? orgMatch[1].trim() : '';

      // Extract location
      const locMatch = rowHtml.match(/<td[^>]*class="[^"]*location[^"]*"[^>]*>([^<]+)/i);
      const location = locMatch ? locMatch[1].trim() : 'California';

      // Extract deadline
      const deadlineMatch = rowHtml.match(/(\d{1,2}\/\d{1,2}\/\d{2,4})/);
      const deadline = deadlineMatch ? new Date(deadlineMatch[1]) : null;

      if (title) {
        jobs.push({
          job_id: jobId,
          source: 'EdJoin',
          title: title,
          organization: organization,
          location: location,
          state: extractState(location) || 'CA',
          salary_min: null,
          salary_max: null,
          deadline: deadline,
          url: jobUrl.startsWith('http') ? jobUrl : EDJOIN_BASE_URL + jobUrl,
          date_posted: new Date()
        });
      }
    } catch (e) {
      console.error('Error parsing EdJoin row:', e.message);
    }
  }

  // If row pattern didn't work, try card pattern
  if (jobs.length === 0) {
    const cardPattern = /<div[^>]*class="[^"]*job-card[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>/gi;

    while ((match = cardPattern.exec(html)) !== null) {
      try {
        const cardHtml = match[1];

        const linkMatch = cardHtml.match(/<a[^>]*href="([^"]*\/Home\/JobPosting\/\d+[^"]*)"[^>]*>([^<]+)<\/a>/i);
        if (!linkMatch) continue;

        const jobUrl = linkMatch[1];
        const title = linkMatch[2].trim();
        const jobId = generateJobId('EdJoin', jobUrl);

        const orgMatch = cardHtml.match(/(?:employer|district|organization)[^>]*>([^<]+)/i);
        const organization = orgMatch ? orgMatch[1].trim() : '';

        const locMatch = cardHtml.match(/(?:location|city)[^>]*>([^<]+)/i);
        const location = locMatch ? locMatch[1].trim() : 'California';

        jobs.push({
          job_id: jobId,
          source: 'EdJoin',
          title: title,
          organization: organization,
          location: location,
          state: extractState(location) || 'CA',
          salary_min: null,
          salary_max: null,
          deadline: null,
          url: jobUrl.startsWith('http') ? jobUrl : EDJOIN_BASE_URL + jobUrl,
          date_posted: new Date()
        });
      } catch (e) {
        console.error('Error parsing EdJoin card:', e.message);
      }
    }
  }

  return jobs;
}

/**
 * Format EdJoin job data from JSON
 */
function formatEdJoinJob(data) {
  const url = `${EDJOIN_BASE_URL}/Home/JobPosting/${data.Id || data.id}`;

  const salary = parseSalary(data.Salary || data.salary || '');

  return {
    job_id: generateJobId('EdJoin', url),
    source: 'EdJoin',
    title: data.Title || data.title || '',
    organization: data.Employer || data.employer || data.DistrictName || '',
    location: data.Location || data.location || data.City || 'California',
    state: extractState(data.Location || data.location || '') || 'CA',
    salary_min: salary ? salary.min : null,
    salary_max: salary ? salary.max : null,
    deadline: data.Deadline ? new Date(data.Deadline) : null,
    url: url,
    date_posted: data.PostedDate ? new Date(data.PostedDate) : new Date()
  };
}

/**
 * Test function for EdJoin scraper
 */
function testEdJoinScraper() {
  console.log('Testing EdJoin scraper...');

  const url = `${EDJOIN_SEARCH_URL}?keywords=principal&page=1`;
  const response = fetchWithRetry(url);

  if (response) {
    console.log('Response code:', response.getResponseCode());
    console.log('Content length:', response.getContentText().length);

    const jobs = parseEdJoinSearchResults(response.getContentText());
    console.log('Jobs found:', jobs.length);

    if (jobs.length > 0) {
      console.log('Sample job:', JSON.stringify(jobs[0], null, 2));
    }
  } else {
    console.log('Failed to fetch EdJoin');
  }
}
