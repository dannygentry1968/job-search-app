<script>
  export let title;
  export let value;
  export let icon;
  export let color = 'blue';
</script>

<div class="stats-card card" style="--accent-color: var(--{color})">
  <div class="stats-icon">{icon}</div>
  <div class="stats-content">
    <div class="stats-value">{value}</div>
    <div class="stats-title">{title}</div>
  </div>
</div>

<style>
  .stats-card {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .stats-icon {
    font-size: 2rem;
    width: 3.5rem;
    height: 3.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--background);
    border-radius: var(--radius);
  }

  .stats-value {
    font-size: 1.75rem;
    font-weight: 700;
    color: var(--text);
    line-height: 1;
  }

  .stats-title {
    font-size: 0.813rem;
    color: var(--text-light);
    margin-top: 0.25rem;
  }
</style>
