<script>
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import JobCard from '$lib/components/JobCard.svelte';
  import { jobs, loadJobs, jobsLoading } from '$lib/stores/jobs.js';

  let searchTerm = '';
  let sourceFilter = 'all';
  let stateFilter = 'all';
  let scoreFilter = 'all';
  let sortBy = 'match_score';
  let sortOrder = 'desc';

  const sources = ['EdJoin', 'SchoolSpring', 'WASA', 'HigherEdJobs', 'K12JobSpot'];
  const states = ['CA', 'WA', 'OR', 'ID', 'CO', 'WY', 'MT', 'NV'];

  onMount(async () => {
    if ($jobs.length === 0) {
      await loadJobs();
    }

    // Handle URL filters
    const filter = $page.url.searchParams.get('filter');
    if (filter === 'new') {
      // Show only new jobs
    } else if (filter === 'high-match') {
      scoreFilter = '80';
    }
  });

  $: filteredJobs = $jobs
    .filter(job => {
      // Search filter
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchesSearch =
          job.title?.toLowerCase().includes(term) ||
          job.organization?.toLowerCase().includes(term) ||
          job.location?.toLowerCase().includes(term);
        if (!matchesSearch) return false;
      }

      // Source filter
      if (sourceFilter !== 'all' && job.source !== sourceFilter) return false;

      // State filter
      if (stateFilter !== 'all' && job.state !== stateFilter) return false;

      // Score filter
      if (scoreFilter !== 'all') {
        const minScore = parseInt(scoreFilter);
        if (!job.match_score || job.match_score < minScore) return false;
      }

      return true;
    })
    .sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];

      // Handle dates
      if (sortBy === 'deadline' || sortBy === 'date_posted') {
        aVal = aVal ? new Date(aVal).getTime() : 0;
        bVal = bVal ? new Date(bVal).getTime() : 0;
      }

      // Handle numbers
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortOrder === 'desc' ? bVal - aVal : aVal - bVal;
      }

      // Handle strings
      aVal = aVal || '';
      bVal = bVal || '';
      return sortOrder === 'desc'
        ? bVal.toString().localeCompare(aVal.toString())
        : aVal.toString().localeCompare(bVal.toString());
    });

  function clearFilters() {
    searchTerm = '';
    sourceFilter = 'all';
    stateFilter = 'all';
    scoreFilter = 'all';
    sortBy = 'match_score';
    sortOrder = 'desc';
  }
</script>

<svelte:head>
  <title>Jobs - EduJob Tracker</title>
</svelte:head>

<div class="jobs-page">
  <header class="page-header">
    <div>
      <h1>Job Listings</h1>
      <p class="text-light">{filteredJobs.length} jobs found</p>
    </div>
    <button class="btn btn-primary" on:click={loadJobs} disabled={$jobsLoading}>
      {#if $jobsLoading}
        <span class="spinner"></span>
      {:else}
        🔄
      {/if}
      Refresh
    </button>
  </header>

  <!-- Filters -->
  <div class="filters card">
    <div class="filter-row">
      <div class="filter-group search-group">
        <label for="search">Search</label>
        <input
          id="search"
          type="text"
          placeholder="Search jobs, organizations, locations..."
          bind:value={searchTerm}
        />
      </div>

      <div class="filter-group">
        <label for="source">Source</label>
        <select id="source" bind:value={sourceFilter}>
          <option value="all">All Sources</option>
          {#each sources as source}
            <option value={source}>{source}</option>
          {/each}
        </select>
      </div>

      <div class="filter-group">
        <label for="state">State</label>
        <select id="state" bind:value={stateFilter}>
          <option value="all">All States</option>
          {#each states as state}
            <option value={state}>{state}</option>
          {/each}
        </select>
      </div>

      <div class="filter-group">
        <label for="score">Min Score</label>
        <select id="score" bind:value={scoreFilter}>
          <option value="all">Any Score</option>
          <option value="90">90+</option>
          <option value="80">80+</option>
          <option value="70">70+</option>
          <option value="50">50+</option>
        </select>
      </div>

      <div class="filter-group">
        <label for="sort">Sort By</label>
        <select id="sort" bind:value={sortBy}>
          <option value="match_score">Match Score</option>
          <option value="deadline">Deadline</option>
          <option value="date_posted">Date Posted</option>
          <option value="salary_max">Salary</option>
          <option value="title">Title</option>
        </select>
      </div>

      <div class="filter-group">
        <label>&nbsp;</label>
        <button class="btn btn-secondary" on:click={clearFilters}>
          Clear Filters
        </button>
      </div>
    </div>
  </div>

  <!-- Job Listings -->
  {#if $jobsLoading}
    <div class="loading-state">
      <div class="spinner"></div>
      <p>Loading jobs...</p>
    </div>
  {:else if filteredJobs.length === 0}
    <div class="empty-state card">
      <p>No jobs match your filters.</p>
      <button class="btn btn-primary mt-4" on:click={clearFilters}>
        Clear Filters
      </button>
    </div>
  {:else}
    <div class="jobs-grid">
      {#each filteredJobs as job (job.job_id)}
        <JobCard {job} />
      {/each}
    </div>
  {/if}
</div>

<style>
  .jobs-page {
    max-width: 1400px;
  }

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
  }

  .page-header h1 {
    font-size: 1.75rem;
    margin-bottom: 0.25rem;
  }

  .filters {
    margin-bottom: 1.5rem;
  }

  .filter-row {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    align-items: flex-end;
  }

  .filter-group {
    display: flex;
    flex-direction: column;
    min-width: 150px;
  }

  .search-group {
    flex: 1;
    min-width: 250px;
  }

  .jobs-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
    gap: 1rem;
  }

  .loading-state,
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 4rem 2rem;
    text-align: center;
    color: var(--text-light);
  }

  .loading-state {
    gap: 1rem;
  }

  @media (max-width: 768px) {
    .filter-row {
      flex-direction: column;
    }

    .filter-group {
      width: 100%;
    }

    .jobs-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
