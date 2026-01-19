/**
 * K12JobSpot Scraper
 *
 * K12JobSpot is a national K-12 education job board
 * https://www.k12jobspot.com/
 */

const K12JOBSPOT_BASE_URL = 'https://www.k12jobspot.com';

/**
 * Main K12JobSpot scraper function
 */
function scrapeK12JobSpot() {
  console.log('Starting K12JobSpot scrape...');

  let newJobCount = 0;

  const searchTerms = [
    'principal',
    'superintendent',
    'assistant superintendent',
    'director'
  ];

  // K12JobSpot may use state abbreviations or full names
  const states = ['CA', 'WA', 'OR', 'ID', 'CO', 'WY', 'MT', 'NV'];

  for (const term of searchTerms) {
    for (const state of states) {
      try {
        const jobs = searchK12JobSpot(term, state);

        for (const job of jobs) {
          if (!isTargetPosition(job.title)) continue;

          if (addJob(job)) {
            newJobCount++;
          }
        }

        Utilities.sleep(1500);

      } catch (e) {
        console.error(`Error searching K12JobSpot for "${term}" in ${state}:`, e.message);
      }
    }
  }

  console.log(`K12JobSpot: Found ${newJobCount} new jobs`);
  return newJobCount;
}

/**
 * Search K12JobSpot
 */
function searchK12JobSpot(searchTerm, state) {
  const jobs = [];

  // K12JobSpot search URL pattern
  const searchUrl = `${K12JOBSPOT_BASE_URL}/Jobs/Search?keywords=${encodeURIComponent(searchTerm)}&state=${state}&category=Administration`;

  const response = fetchWithRetry(searchUrl);
  if (!response) {
    return jobs;
  }

  const html = response.getContentText();

  // K12JobSpot listing patterns
  const jobCardPattern = /<div[^>]*class="[^"]*job-card[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/gi;
  const linkPattern = /<a[^>]*href="([^"]*\/Jobs\/\d+[^"]*)"[^>]*>([^<]+)<\/a>/i;

  let match;

  while ((match = jobCardPattern.exec(html)) !== null) {
    try {
      const cardHtml = match[1];

      const linkMatch = cardHtml.match(linkPattern);
      if (!linkMatch) continue;

      const jobUrl = linkMatch[1];
      const title = linkMatch[2].trim();

      if (!title) continue;

      // Extract other details
      const orgMatch = cardHtml.match(/(?:district|school|employer)[^>]*>([^<]+)/i);
      const organization = orgMatch ? orgMatch[1].trim() : '';

      const locMatch = cardHtml.match(/(?:location)[^>]*>([^<]+)/i);
      const location = locMatch ? locMatch[1].trim() : state;

      const deadlineMatch = cardHtml.match(/(?:deadline|closes)[^>]*>([^<]*\d{1,2}\/\d{1,2}\/\d{2,4})/i);
      let deadline = null;
      if (deadlineMatch) {
        const dateMatch = deadlineMatch[1].match(/\d{1,2}\/\d{1,2}\/\d{2,4}/);
        if (dateMatch) deadline = new Date(dateMatch[0]);
      }

      const salaryMatch = cardHtml.match(/\$[\d,]+(?:\s*[-–]\s*\$[\d,]+)?/);
      const salary = salaryMatch ? parseSalary(salaryMatch[0]) : null;

      const fullUrl = jobUrl.startsWith('http') ? jobUrl : K12JOBSPOT_BASE_URL + jobUrl;
      const jobId = generateJobId('K12JobSpot', fullUrl);

      jobs.push({
        job_id: jobId,
        source: 'K12JobSpot',
        title: title,
        organization: organization,
        location: location,
        state: state,
        salary_min: salary ? salary.min : null,
        salary_max: salary ? salary.max : null,
        deadline: deadline,
        url: fullUrl,
        date_posted: new Date()
      });

    } catch (e) {
      console.error('Error parsing K12JobSpot job:', e.message);
    }
  }

  // Alternative: look for list items
  if (jobs.length === 0) {
    const listPattern = /<li[^>]*class="[^"]*job-listing[^"]*"[^>]*>([\s\S]*?)<\/li>/gi;

    while ((match = listPattern.exec(html)) !== null) {
      const itemHtml = match[1];
      const linkMatch = itemHtml.match(linkPattern);

      if (linkMatch) {
        const jobUrl = linkMatch[1];
        const title = linkMatch[2].trim();

        if (title && title.length > 5) {
          const fullUrl = jobUrl.startsWith('http') ? jobUrl : K12JOBSPOT_BASE_URL + jobUrl;

          jobs.push({
            job_id: generateJobId('K12JobSpot', fullUrl),
            source: 'K12JobSpot',
            title: title,
            organization: '',
            location: state,
            state: state,
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
 * Test function for K12JobSpot scraper
 */
function testK12JobSpotScraper() {
  console.log('Testing K12JobSpot scraper...');

  const jobs = searchK12JobSpot('principal', 'CA');
  console.log('Jobs found:', jobs.length);

  if (jobs.length > 0) {
    console.log('Sample job:', JSON.stringify(jobs[0], null, 2));
  }
}
