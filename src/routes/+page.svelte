<script>
  import { onMount } from 'svelte';
  import JobCard from '$lib/components/JobCard.svelte';
  import StatsCard from '$lib/components/StatsCard.svelte';
  import { jobs, loadJobs } from '$lib/stores/jobs.js';

  let loading = true;
  let recentJobs = [];

  onMount(async () => {
    await loadJobs();
    loading = false;
  });

  $: recentJobs = $jobs
    .filter(j => j.is_new || j.status === 'New')
    .slice(0, 5);

  $: stats = {
    total: $jobs.length,
    newJobs: $jobs.filter(j => j.is_new).length,
    highMatch: $jobs.filter(j => j.match_score >= 80).length,
    applied: $jobs.filter(j => j.status === 'Applied').length
  };
</script>

<svelte:head>
  <title>Dashboard - EduJob Tracker</title>
</svelte:head>

<div class="dashboard">
  <header class="page-header">
    <div>
      <h1>Welcome back, Danny!</h1>
      <p class="text-light">Here's your job search overview</p>
    </div>
    <button class="btn btn-primary" on:click={loadJobs}>
      🔄 Refresh Jobs
    </button>
  </header>

  <!-- Stats Grid -->
  <div class="stats-grid">
    <StatsCard
      title="Total Jobs"
      value={stats.total}
      icon="💼"
      color="blue"
    />
    <StatsCard
      title="New Today"
      value={stats.newJobs}
      icon="✨"
      color="green"
    />
    <StatsCard
      title="High Match (80+)"
      value={stats.highMatch}
      icon="🎯"
      color="purple"
    />
    <StatsCard
      title="Applied"
      value={stats.applied}
      icon="📨"
      color="orange"
    />
  </div>

  <!-- Recent High-Match Jobs -->
  <section class="section">
    <div class="section-header">
      <h2>🔥 New & High-Match Jobs</h2>
      <a href="/jobs" class="btn btn-secondary">View All →</a>
    </div>

    {#if loading}
      <div class="loading-state">
        <div class="spinner"></div>
        <p>Loading jobs...</p>
      </div>
    {:else if recentJobs.length === 0}
      <div class="empty-state card">
        <p>No new jobs found. Jobs are scraped daily at 6 AM.</p>
        <p class="text-sm text-light mt-2">
          Configure your Google Apps Script to start scraping job sites.
        </p>
      </div>
    {:else}
      <div class="jobs-grid">
        {#each recentJobs as job}
          <JobCard {job} />
        {/each}
      </div>
    {/if}
  </section>

  <!-- Quick Actions -->
  <section class="section">
    <h2>Quick Actions</h2>
    <div class="actions-grid mt-4">
      <a href="/jobs?filter=new" class="action-card">
        <span class="action-icon">🆕</span>
        <span class="action-label">View New Jobs</span>
      </a>
      <a href="/jobs?filter=high-match" class="action-card">
        <span class="action-icon">🎯</span>
        <span class="action-label">High Match Jobs</span>
      </a>
      <a href="/applications" class="action-card">
        <span class="action-icon">📋</span>
        <span class="action-label">Track Applications</span>
      </a>
      <a href="/settings" class="action-card">
        <span class="action-icon">⚙️</span>
        <span class="action-label">Update Profile</span>
      </a>
    </div>
  </section>
</div>

<style>
  .dashboard {
    max-width: 1200px;
  }

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
  }

  .page-header h1 {
    font-size: 1.75rem;
    margin-bottom: 0.25rem;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    margin-bottom: 2rem;
  }

  .section {
    margin-bottom: 2rem;
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .section h2 {
    font-size: 1.25rem;
  }

  .jobs-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: 1rem;
  }

  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    padding: 3rem;
    color: var(--text-light);
  }

  .empty-state {
    text-align: center;
    padding: 3rem;
    color: var(--text-light);
  }

  .actions-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 1rem;
  }

  .action-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
    padding: 1.5rem;
    background: var(--surface);
    border-radius: var(--radius);
    box-shadow: var(--shadow);
    text-decoration: none;
    color: var(--text);
    transition: all 0.2s;
  }

  .action-card:hover {
    box-shadow: var(--shadow-lg);
    transform: translateY(-2px);
    text-decoration: none;
  }

  .action-icon {
    font-size: 2rem;
  }

  .action-label {
    font-weight: 500;
    font-size: 0.875rem;
  }
</style>
