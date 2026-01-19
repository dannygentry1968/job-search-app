<script>
  export let job;

  function getScoreClass(score) {
    if (score >= 80) return 'score-high';
    if (score >= 50) return 'score-medium';
    return 'score-low';
  }

  function formatDate(dateStr) {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  }

  function getSourceBadge(source) {
    const badges = {
      'EdJoin': '🍊',
      'SchoolSpring': '🌸',
      'WASA': '🌲',
      'HigherEdJobs': '🎓',
      'K12JobSpot': '📚'
    };
    return badges[source] || '💼';
  }
</script>

<article class="job-card card">
  <div class="job-header">
    <div class="job-source">
      <span class="source-icon">{getSourceBadge(job.source)}</span>
      <span class="source-name">{job.source}</span>
    </div>
    {#if job.match_score !== undefined}
      <div class="score {getScoreClass(job.match_score)}">
        {job.match_score}
      </div>
    {/if}
  </div>

  <h3 class="job-title">
    <a href="/jobs/{job.job_id}">{job.title}</a>
  </h3>

  <p class="job-org">{job.organization}</p>

  <div class="job-meta">
    <span class="meta-item">
      📍 {job.location}
    </span>
    {#if job.salary_min || job.salary_max}
      <span class="meta-item">
        💰 ${job.salary_min?.toLocaleString() || '?'} - ${job.salary_max?.toLocaleString() || '?'}
      </span>
    {/if}
  </div>

  <div class="job-footer">
    <div class="job-dates">
      {#if job.deadline}
        <span class="deadline" class:urgent={new Date(job.deadline) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)}>
          ⏰ Due: {formatDate(job.deadline)}
        </span>
      {/if}
    </div>
    <div class="job-badges">
      {#if job.is_new}
        <span class="badge badge-new">New</span>
      {/if}
      {#if job.status && job.status !== 'New'}
        <span class="badge badge-{job.status.toLowerCase()}">{job.status}</span>
      {/if}
    </div>
  </div>

  <div class="job-actions">
    <a href={job.url} target="_blank" rel="noopener" class="btn btn-secondary">
      View Posting ↗
    </a>
    <a href="/jobs/{job.job_id}" class="btn btn-primary">
      Details
    </a>
  </div>
</article>

<style>
  .job-card {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .job-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .job-source {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.75rem;
    color: var(--text-light);
  }

  .source-icon {
    font-size: 1rem;
  }

  .job-title {
    font-size: 1.125rem;
    line-height: 1.3;
  }

  .job-title a {
    color: var(--text);
  }

  .job-title a:hover {
    color: var(--primary);
  }

  .job-org {
    color: var(--text-light);
    font-size: 0.875rem;
  }

  .job-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    font-size: 0.813rem;
    color: var(--text-light);
  }

  .meta-item {
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  .job-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 0.5rem;
    border-top: 1px solid var(--border);
  }

  .deadline {
    font-size: 0.75rem;
    color: var(--text-light);
  }

  .deadline.urgent {
    color: var(--danger);
    font-weight: 600;
  }

  .job-badges {
    display: flex;
    gap: 0.5rem;
  }

  .job-actions {
    display: flex;
    gap: 0.5rem;
    margin-top: 0.5rem;
  }

  .job-actions .btn {
    flex: 1;
    justify-content: center;
  }
</style>
