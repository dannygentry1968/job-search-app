// Google Apps Script Web App URL
// Replace this with your deployed GAS Web App URL
const GAS_WEB_APP_URL = import.meta.env.VITE_GAS_WEB_APP_URL || '';

// Netlify Functions base URL
const NETLIFY_FUNCTIONS_URL = '/.netlify/functions';

/**
 * Fetch data from Google Apps Script Web App
 * @param {string} action - The action to perform (e.g., 'getJobs', 'updateJobStatus')
 * @param {object} params - Additional parameters to send
 * @returns {Promise<any>} - The response data
 */
export async function fetchFromGAS(action, params = {}) {
  if (!GAS_WEB_APP_URL) {
    console.warn('GAS Web App URL not configured. Set VITE_GAS_WEB_APP_URL environment variable.');
    return null;
  }

  const url = new URL(GAS_WEB_APP_URL);
  url.searchParams.set('action', action);

  // Add additional params to URL
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, typeof value === 'object' ? JSON.stringify(value) : value);
  });

  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching from GAS:', error);
    throw error;
  }
}

/**
 * Post data to Google Apps Script Web App
 * @param {string} action - The action to perform
 * @param {object} data - The data to send
 * @returns {Promise<any>} - The response data
 */
export async function postToGAS(action, data = {}) {
  if (!GAS_WEB_APP_URL) {
    console.warn('GAS Web App URL not configured');
    return null;
  }

  try {
    const response = await fetch(GAS_WEB_APP_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ action, ...data })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error posting to GAS:', error);
    throw error;
  }
}

/**
 * Call Claude API via Netlify Function for job matching
 * @param {array} jobs - Array of jobs to analyze
 * @returns {Promise<array>} - Jobs with match scores
 */
export async function matchJobs(jobs) {
  try {
    const response = await fetch(`${NETLIFY_FUNCTIONS_URL}/claude-match`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ jobs })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error matching jobs:', error);
    throw error;
  }
}

/**
 * Generate cover letter via Netlify Function
 * @param {object} job - The job to generate letter for
 * @returns {Promise<string>} - Generated cover letter
 */
export async function generateCoverLetter(job) {
  try {
    const response = await fetch(`${NETLIFY_FUNCTIONS_URL}/claude-generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ job, type: 'cover_letter' })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.content;
  } catch (error) {
    console.error('Error generating cover letter:', error);
    throw error;
  }
}

/**
 * Generate research dossier via Netlify Function
 * @param {string} organization - The organization to research
 * @param {string} location - The location
 * @returns {Promise<object>} - Generated dossier
 */
export async function generateDossier(organization, location) {
  try {
    const response = await fetch(`${NETLIFY_FUNCTIONS_URL}/claude-dossier`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ organization, location })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error generating dossier:', error);
    throw error;
  }
}
