<script>
  let gasWebAppUrl = '';
  let claudeApiKey = '';
  let saved = false;

  function saveSettings() {
    // In a real app, these would be saved securely
    // For now, we'll just show them as saved
    saved = true;
    setTimeout(() => saved = false, 3000);
  }
</script>

<svelte:head>
  <title>Settings - EduJob Tracker</title>
</svelte:head>

<div class="settings-page">
  <header class="page-header">
    <h1>Settings</h1>
    <p class="text-light">Configure your job search preferences and connections</p>
  </header>

  <!-- Connection Settings -->
  <section class="section">
    <div class="card">
      <h2>🔗 Google Apps Script Connection</h2>
      <p class="text-light mb-4">
        Connect to your Google Apps Script backend for job scraping and data storage.
      </p>

      <div class="form-group">
        <label for="gasUrl">Web App URL</label>
        <input
          id="gasUrl"
          type="url"
          placeholder="https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec"
          bind:value={gasWebAppUrl}
        />
        <p class="help-text">
          Deploy your Google Apps Script as a Web App and paste the URL here.
        </p>
      </div>

      <div class="form-group">
        <label for="apiKey">Claude API Key (Optional)</label>
        <input
          id="apiKey"
          type="password"
          placeholder="sk-ant-..."
          bind:value={claudeApiKey}
        />
        <p class="help-text">
          Your Claude API key is stored in Netlify environment variables for security.
          Only enter here for local testing.
        </p>
      </div>

      <button class="btn btn-primary" on:click={saveSettings}>
        Save Settings
      </button>

      {#if saved}
        <span class="save-message">✓ Settings saved!</span>
      {/if}
    </div>
  </section>

  <!-- Profile Summary -->
  <section class="section">
    <div class="card">
      <h2>👤 Your Profile</h2>
      <p class="text-light mb-4">
        This information is used for AI job matching and document generation.
      </p>

      <div class="profile-summary">
        <div class="profile-item">
          <strong>Name:</strong> Danny Gentry, Ed.D.
        </div>
        <div class="profile-item">
          <strong>Education:</strong>
          <ul>
            <li>Ed.D. Educational Leadership, Lamar University (2018)</li>
            <li>M.Ed. Educational Administration, Baylor University (1998)</li>
            <li>B.S. Biology, Stephen F. Austin State University (1991)</li>
          </ul>
        </div>
        <div class="profile-item">
          <strong>Certifications:</strong>
          <ul>
            <li>California Administrative Credential (Clear)</li>
            <li>Texas Superintendent Certificate</li>
            <li>Texas Principal Certificate</li>
          </ul>
        </div>
        <div class="profile-item">
          <strong>Experience:</strong> 20 years administrative, 12 years teaching
        </div>
        <div class="profile-item">
          <strong>Current Role:</strong> Principal, Rolling Hills Elementary
        </div>
        <div class="profile-item">
          <strong>Target States:</strong> CA, WA, OR, ID, CO, WY, MT, NV + Remote
        </div>
      </div>

      <p class="text-sm text-light mt-4">
        To update your profile, modify the USER_PROFILE in the Netlify function files.
      </p>
    </div>
  </section>

  <!-- Job Sources -->
  <section class="section">
    <div class="card">
      <h2>📋 Job Sources</h2>
      <p class="text-light mb-4">
        The following job boards are scraped daily at 6 AM.
      </p>

      <div class="sources-list">
        <div class="source-item">
          <span class="source-icon">🍊</span>
          <div class="source-info">
            <strong>EdJoin</strong>
            <span class="text-light">California education jobs</span>
          </div>
          <span class="badge badge-new">Active</span>
        </div>

        <div class="source-item">
          <span class="source-icon">🌸</span>
          <div class="source-info">
            <strong>SchoolSpring</strong>
            <span class="text-light">National education jobs</span>
          </div>
          <span class="badge badge-new">Active</span>
        </div>

        <div class="source-item">
          <span class="source-icon">🌲</span>
          <div class="source-info">
            <strong>WASA Career Connection</strong>
            <span class="text-light">Washington state admin jobs</span>
          </div>
          <span class="badge badge-new">Active</span>
        </div>

        <div class="source-item">
          <span class="source-icon">🎓</span>
          <div class="source-info">
            <strong>HigherEdJobs</strong>
            <span class="text-light">College/university positions</span>
          </div>
          <span class="badge badge-new">Active</span>
        </div>

        <div class="source-item">
          <span class="source-icon">📚</span>
          <div class="source-info">
            <strong>K12JobSpot</strong>
            <span class="text-light">National K-12 administration</span>
          </div>
          <span class="badge badge-new">Active</span>
        </div>
      </div>
    </div>
  </section>

  <!-- Setup Instructions -->
  <section class="section">
    <div class="card">
      <h2>📖 Setup Instructions</h2>

      <div class="instructions">
        <h3>1. Google Apps Script Setup</h3>
        <ol>
          <li>Create a new Google Sheet</li>
          <li>Go to Extensions → Apps Script</li>
          <li>Copy all .gs files from the <code>google-apps-script</code> folder</li>
          <li>Run the <code>initializeSheets()</code> function to create sheet structure</li>
          <li>Add your email to Script Properties as <code>USER_EMAIL</code></li>
          <li>Deploy as Web App (Execute as: Me, Access: Anyone)</li>
          <li>Copy the Web App URL and paste it above</li>
          <li>Run <code>createDailyTrigger()</code> to enable automatic scraping</li>
        </ol>

        <h3>2. Netlify Setup</h3>
        <ol>
          <li>Push this project to a GitHub repository</li>
          <li>Connect the repo to Netlify</li>
          <li>Add environment variables:
            <ul>
              <li><code>ANTHROPIC_API_KEY</code> - Your Claude API key</li>
              <li><code>VITE_GAS_WEB_APP_URL</code> - Your Google Apps Script Web App URL</li>
            </ul>
          </li>
          <li>Deploy!</li>
        </ol>

        <h3>3. Testing</h3>
        <ol>
          <li>In Google Apps Script, run <code>testEdJoinScraper()</code> to verify scraping works</li>
          <li>Run <code>runDailyScrape()</code> manually to populate initial data</li>
          <li>Visit your Netlify URL to see the dashboard</li>
        </ol>
      </div>
    </div>
  </section>
</div>

<style>
  .settings-page {
    max-width: 800px;
  }

  .page-header {
    margin-bottom: 2rem;
  }

  .page-header h1 {
    font-size: 1.75rem;
    margin-bottom: 0.25rem;
  }

  .section {
    margin-bottom: 1.5rem;
  }

  .section h2 {
    font-size: 1.25rem;
    margin-bottom: 0.5rem;
  }

  .form-group {
    margin-bottom: 1.5rem;
  }

  .help-text {
    font-size: 0.75rem;
    color: var(--text-light);
    margin-top: 0.5rem;
  }

  .save-message {
    margin-left: 1rem;
    color: var(--success);
    font-weight: 500;
  }

  .profile-summary {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .profile-item {
    padding-bottom: 0.75rem;
    border-bottom: 1px solid var(--border);
  }

  .profile-item:last-child {
    border-bottom: none;
  }

  .profile-item ul {
    margin: 0.5rem 0 0 1.5rem;
    padding: 0;
  }

  .profile-item li {
    font-size: 0.875rem;
    color: var(--text-light);
  }

  .sources-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .source-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.75rem;
    background: var(--background);
    border-radius: var(--radius);
  }

  .source-icon {
    font-size: 1.5rem;
  }

  .source-info {
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  .source-info span {
    font-size: 0.75rem;
  }

  .instructions {
    font-size: 0.875rem;
  }

  .instructions h3 {
    font-size: 1rem;
    margin: 1.5rem 0 0.75rem;
  }

  .instructions h3:first-child {
    margin-top: 0;
  }

  .instructions ol {
    margin-left: 1.5rem;
    padding: 0;
  }

  .instructions li {
    margin-bottom: 0.5rem;
  }

  .instructions ul {
    margin: 0.5rem 0 0.5rem 1rem;
  }

  .instructions code {
    background: var(--background);
    padding: 0.125rem 0.375rem;
    border-radius: 4px;
    font-size: 0.813rem;
  }
</style>
