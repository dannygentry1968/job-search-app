<script>
  import '../app.css';

  const navItems = [
    { href: '/', label: 'Dashboard', icon: '📊' },
    { href: '/jobs', label: 'Jobs', icon: '💼' },
    { href: '/applications', label: 'Applications', icon: '📝' },
    { href: '/documents', label: 'Documents', icon: '📄' },
    { href: '/dossiers', label: 'Research', icon: '🔍' },
    { href: '/settings', label: 'Settings', icon: '⚙️' }
  ];
</script>

<div class="app-layout">
  <nav class="sidebar">
    <div class="logo">
      <span class="logo-icon">🎓</span>
      <span class="logo-text">EduJob Tracker</span>
    </div>

    <ul class="nav-list">
      {#each navItems as item}
        <li>
          <a href={item.href} class="nav-link">
            <span class="nav-icon">{item.icon}</span>
            <span class="nav-label">{item.label}</span>
          </a>
        </li>
      {/each}
    </ul>

    <div class="nav-footer">
      <div class="user-info">
        <div class="user-avatar">DG</div>
        <div class="user-details">
          <div class="user-name">Danny Gentry</div>
          <div class="user-role">Ed.D.</div>
        </div>
      </div>
    </div>
  </nav>

  <main class="main-content">
    <slot />
  </main>
</div>

<style>
  .app-layout {
    display: flex;
    min-height: 100vh;
  }

  .sidebar {
    width: 250px;
    background: var(--surface);
    border-right: 1px solid var(--border);
    display: flex;
    flex-direction: column;
    position: fixed;
    height: 100vh;
    left: 0;
    top: 0;
  }

  .logo {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1.5rem;
    border-bottom: 1px solid var(--border);
  }

  .logo-icon {
    font-size: 1.5rem;
  }

  .logo-text {
    font-weight: 700;
    font-size: 1.125rem;
    color: var(--text);
  }

  .nav-list {
    list-style: none;
    padding: 1rem 0.75rem;
    flex: 1;
  }

  .nav-link {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    border-radius: var(--radius);
    color: var(--text);
    transition: all 0.2s;
    text-decoration: none;
  }

  .nav-link:hover {
    background: var(--background);
    text-decoration: none;
  }

  .nav-icon {
    font-size: 1.25rem;
  }

  .nav-label {
    font-weight: 500;
  }

  .nav-footer {
    padding: 1rem;
    border-top: 1px solid var(--border);
  }

  .user-info {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .user-avatar {
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 50%;
    background: var(--primary);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    font-size: 0.875rem;
  }

  .user-name {
    font-weight: 600;
    font-size: 0.875rem;
  }

  .user-role {
    font-size: 0.75rem;
    color: var(--text-light);
  }

  .main-content {
    flex: 1;
    margin-left: 250px;
    padding: 2rem;
    min-height: 100vh;
  }

  @media (max-width: 768px) {
    .sidebar {
      width: 100%;
      height: auto;
      position: relative;
      border-right: none;
      border-bottom: 1px solid var(--border);
    }

    .main-content {
      margin-left: 0;
    }

    .nav-list {
      display: flex;
      overflow-x: auto;
      padding: 0.5rem;
    }

    .nav-footer {
      display: none;
    }
  }
</style>
