/**
 * SchoolSpring Scraper
 *
 * SchoolSpring (including MacNJake) is a major education job board
 * https://macnjake.schoolspring.com/
 */

const SCHOOLSPRING_BASE_URL = 'https://www.schoolspring.com';
const MACNJAKE_URL = 'https://macnjake.schoolspring.com';

/**
 * Main SchoolSpring scraper function
 */
function scrapeSchoolSpring() {
  console.log('Starting SchoolSpring scrape...');

  let newJobCount = 0;

  const searchTerms = [
    'principal',
    'superintendent',
    'assistant superintendent',
    'director'
  ];

  // Target states
  const states = ['CA', 'WA', 'OR', 'ID', 'CO', 'WY', 'MT', 'NV'];

  for (const term of searchTerms) {
    for (const state of states) {
      try {
        const jobs = searchSchoolSpring(term, state);

        for (const job of jobs) {
          if (!isTargetPosition(job.title)) continue;

          if (addJob(job)) {
            newJobCount++;
          }
        }

        // Rate limiting
        Utilities.sleep(1500);

      } catch (e) {
        console.error(`Error searching SchoolSpring for "${term}" in ${state}:`, e.message);
      }
    }
  }

  console.log(`SchoolSpring: Found ${newJobCount} new jobs`);
  return newJobCount;
}

/**
 * Search SchoolSpring for jobs
 */
function searchSchoolSpring(searchTerm, state) {
  const jobs = [];

  // SchoolSpring search URL pattern
  const searchUrl = `${SCHOOLSPRING_BASE_URL}/job/search?keyword=${encodeURIComponent(searchTerm)}&state=${state}&jobtype=3`; // jobtype=3 is typically administration

  const response = fetchWithRetry(searchUrl);
  if (!response) {
    return jobs;
  }

  const html = response.getContentText();

  // SchoolSpring uses specific HTML structure
  // Look for job cards/rows

  // Pattern for job listings
  const jobCardPattern = /<div[^>]*class="[^"]*job-listing-card[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>/gi;
  const linkPattern = /<a[^>]*href="([^"]*\/job\/\d+[^"]*)"[^>]*>([^<]*)<\/a>/i;

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
      const orgMatch = cardHtml.match(/(?:school|district|employer)[^>]*>([^<]+)/i);
      const organization = orgMatch ? orgMatch[1].trim() : '';

      const locMatch = cardHtml.match(/(?:location)[^>]*>([^<]+)/i);
      const location = locMatch ? locMatch[1].trim() : state;

      const deadlineMatch = cardHtml.match(/(?:deadline|closes?)[^>]*>([^<]*\d{1,2}\/\d{1,2}\/\d{2,4}[^<]*)/i);
      let deadline = null;
      if (deadlineMatch) {
        const dateMatch = deadlineMatch[1].match(/\d{1,2}\/\d{1,2}\/\d{2,4}/);
        if (dateMatch) {
          deadline = new Date(dateMatch[0]);
        }
      }

      const salaryMatch = cardHtml.match(/\$[\d,]+(?:\s*[-–]\s*\$[\d,]+)?/);
      const salary = salaryMatch ? parseSalary(salaryMatch[0]) : null;

      const fullUrl = jobUrl.startsWith('http') ? jobUrl : SCHOOLSPRING_BASE_URL + jobUrl;
      const jobId = generateJobId('SchoolSpring', fullUrl);

      jobs.push({
        job_id: jobId,
        source: 'SchoolSpring',
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
      console.error('Error parsing SchoolSpring job:', e.message);
    }
  }

  // Alternative pattern - table rows
  if (jobs.length === 0) {
    const rowPattern = /<tr[^>]*class="[^"]*job-row[^"]*"[^>]*>([\s\S]*?)<\/tr>/gi;

    while ((match = rowPattern.exec(html)) !== null) {
      try {
        const rowHtml = match[1];
        const linkMatch = rowHtml.match(linkPattern);

        if (linkMatch) {
          const jobUrl = linkMatch[1];
          const title = linkMatch[2].trim();

          if (title) {
            const fullUrl = jobUrl.startsWith('http') ? jobUrl : SCHOOLSPRING_BASE_URL + jobUrl;

            jobs.push({
              job_id: generateJobId('SchoolSpring', fullUrl),
              source: 'SchoolSpring',
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
      } catch (e) {
        console.error('Error parsing SchoolSpring row:', e.message);
      }
    }
  }

  return jobs;
}

/**
 * Test function for SchoolSpring scraper
 */
function testSchoolSpringScraper() {
  console.log('Testing SchoolSpring scraper...');

  const searchUrl = `${SCHOOLSPRING_BASE_URL}/job/search?keyword=principal&state=CA`;
  console.log('Testing URL:', searchUrl);

  const response = fetchWithRetry(searchUrl);

  if (response) {
    console.log('Response code:', response.getResponseCode());
    console.log('Content length:', response.getContentText().length);

    const jobs = searchSchoolSpring('principal', 'CA');
    console.log('Jobs found:', jobs.length);

    if (jobs.length > 0) {
      console.log('Sample job:', JSON.stringify(jobs[0], null, 2));
    }
  } else {
    console.log('Failed to fetch SchoolSpring');
  }
}
