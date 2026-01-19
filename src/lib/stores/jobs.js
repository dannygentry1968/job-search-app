import { writable } from 'svelte/store';
import { fetchFromGAS } from '$lib/utils/api.js';

export const jobs = writable([]);
export const jobsLoading = writable(false);
export const jobsError = writable(null);

// Sample data for development/demo
const sampleJobs = [
  {
    job_id: 'edj-123456',
    source: 'EdJoin',
    title: 'Principal - Elementary School',
    organization: 'Sacramento City Unified School District',
    location: 'Sacramento, CA',
    state: 'CA',
    salary_min: 125000,
    salary_max: 155000,
    deadline: '2025-02-15',
    url: 'https://edjoin.org/Home/JobPosting/123456',
    date_posted: '2025-01-15',
    date_scraped: '2025-01-19',
    is_new: true,
    is_active: true,
    match_score: 92,
    match_notes: 'Strong match: Ed.D., 20 years admin experience, CA credential',
    status: 'New'
  },
  {
    job_id: 'wasa-789012',
    source: 'WASA',
    title: 'Superintendent',
    organization: 'Spokane Public Schools',
    location: 'Spokane, WA',
    state: 'WA',
    salary_min: 180000,
    salary_max: 220000,
    deadline: '2025-02-28',
    url: 'https://wasa-oly.org/jobs/789012',
    date_posted: '2025-01-10',
    date_scraped: '2025-01-19',
    is_new: true,
    is_active: true,
    match_score: 88,
    match_notes: 'Excellent match: Superintendent cert, district leadership experience',
    status: 'New'
  },
  {
    job_id: 'ss-345678',
    source: 'SchoolSpring',
    title: 'Assistant Superintendent of Curriculum & Instruction',
    organization: 'Portland Public Schools',
    location: 'Portland, OR',
    state: 'OR',
    salary_min: 145000,
    salary_max: 175000,
    deadline: '2025-02-20',
    url: 'https://schoolspring.com/job/345678',
    date_posted: '2025-01-12',
    date_scraped: '2025-01-19',
    is_new: false,
    is_active: true,
    match_score: 85,
    match_notes: 'Good match: Curriculum leadership experience, ASCD academy graduate',
    status: 'New'
  },
  {
    job_id: 'hej-901234',
    source: 'HigherEdJobs',
    title: 'Dean of Education',
    organization: 'University of Nevada, Reno',
    location: 'Reno, NV',
    state: 'NV',
    salary_min: 150000,
    salary_max: 190000,
    deadline: '2025-03-01',
    url: 'https://higheredjobs.com/job/901234',
    date_posted: '2025-01-08',
    date_scraped: '2025-01-19',
    is_new: false,
    is_active: true,
    match_score: 78,
    match_notes: 'Good match: Ed.D., publications, but limited higher ed admin experience',
    status: 'New'
  },
  {
    job_id: 'edj-567890',
    source: 'EdJoin',
    title: 'Director of Student Services',
    organization: 'Fairfield-Suisun Unified School District',
    location: 'Fairfield, CA',
    state: 'CA',
    salary_min: 135000,
    salary_max: 160000,
    deadline: '2025-02-10',
    url: 'https://edjoin.org/Home/JobPosting/567890',
    date_posted: '2025-01-14',
    date_scraped: '2025-01-19',
    is_new: true,
    is_active: true,
    match_score: 94,
    match_notes: 'Excellent match: Current FSUSD employee, strong student services background',
    status: 'New'
  }
];

export async function loadJobs() {
  jobsLoading.set(true);
  jobsError.set(null);

  try {
    // Try to load from Google Apps Script
    const data = await fetchFromGAS('getJobs');

    if (data && data.length > 0) {
      jobs.set(data);
    } else {
      // Use sample data for demo/development
      console.log('Using sample data (GAS not configured)');
      jobs.set(sampleJobs);
    }
  } catch (error) {
    console.error('Error loading jobs:', error);
    // Fall back to sample data
    jobs.set(sampleJobs);
    jobsError.set('Could not connect to Google Sheets. Showing sample data.');
  } finally {
    jobsLoading.set(false);
  }
}

export async function updateJobStatus(jobId, status) {
  try {
    await fetchFromGAS('updateJobStatus', { jobId, status });

    // Update local store
    jobs.update(currentJobs =>
      currentJobs.map(job =>
        job.job_id === jobId ? { ...job, status } : job
      )
    );
  } catch (error) {
    console.error('Error updating job status:', error);
    throw error;
  }
}

export async function getJobById(jobId) {
  // First check local store
  let job = null;
  jobs.subscribe(j => {
    job = j.find(item => item.job_id === jobId);
  })();

  if (job) return job;

  // Otherwise fetch from GAS
  try {
    return await fetchFromGAS('getJob', { id: jobId });
  } catch (error) {
    console.error('Error fetching job:', error);
    return null;
  }
}
