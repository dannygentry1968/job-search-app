# EduJob Tracker

A comprehensive job search management application for K-12 and higher education administration positions.

## Features

- **Automated Job Scraping**: Daily scraping from 5 major education job boards
- **AI Job Matching**: Claude-powered analysis to score jobs against your profile
- **Application Tracking**: Track application status, deadlines, and documents
- **Document Generation**: AI-generated cover letters and tailored resumes
- **Email Integration**: Track correspondence related to applications
- **Research Dossiers**: Generate reports on districts, schools, and housing

## Target Job Sites

1. **EdJoin** - California education jobs
2. **SchoolSpring** - National education jobs
3. **WASA Career Connection** - Washington state admin positions
4. **HigherEdJobs** - College/university positions
5. **K12JobSpot** - National K-12 administration

## Tech Stack

- **Frontend**: SvelteKit (static site)
- **Hosting**: Netlify
- **Backend/Automation**: Google Apps Script
- **Database**: Google Sheets
- **AI**: Claude API (Anthropic)
- **File Storage**: Google Drive

## Setup Instructions

### 1. Google Apps Script Setup

1. Create a new Google Sheets document
2. Go to **Extensions → Apps Script**
3. Delete any existing code
4. Create new files and copy the code from `google-apps-script/`:
   - `Code.gs`
   - `Config.gs`
   - `scrapers/EdJoinScraper.gs`
   - `scrapers/WASAScraper.gs`
   - `scrapers/SchoolSpringScraper.gs`
   - `scrapers/HigherEdJobsScraper.gs`
   - `scrapers/K12JobSpotScraper.gs`

5. Run the `initializeSheets()` function to create the required sheets

6. Set up Script Properties (click ⚙️ Project Settings → Script Properties):
   - `USER_EMAIL`: Your email address for notifications

7. Deploy as Web App:
   - Click **Deploy → New deployment**
   - Select type: **Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
   - Click **Deploy** and copy the Web App URL

8. Set up the daily trigger:
   - Run `createDailyTrigger()` function to enable automatic daily scraping at 6 AM

### 2. Netlify Setup

1. Push this project to a GitHub repository

2. Go to [Netlify](https://netlify.com) and create a new site from Git

3. Connect your GitHub repository

4. Configure build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `build`

5. Add environment variables (Site Settings → Environment Variables):
   - `ANTHROPIC_API_KEY`: Your Claude API key from [Anthropic Console](https://console.anthropic.com/)
   - `VITE_GAS_WEB_APP_URL`: Your Google Apps Script Web App URL

6. Deploy!

### 3. Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Project Structure

```
job-search-app/
├── src/
│   ├── routes/              # SvelteKit pages
│   │   ├── +page.svelte     # Dashboard
│   │   ├── jobs/            # Job listings
│   │   ├── applications/    # Application tracking
│   │   ├── documents/       # Document generation
│   │   ├── dossiers/        # Research dossiers
│   │   └── settings/        # Settings page
│   └── lib/
│       ├── components/      # Reusable components
│       ├── stores/          # Svelte stores
│       └── utils/           # Utility functions
├── netlify/
│   └── functions/           # Serverless functions for AI
├── google-apps-script/      # Backend code
│   ├── Code.gs              # Main entry point
│   ├── Config.gs            # Configuration
│   └── scrapers/            # Job site scrapers
├── static/                  # Static assets
└── netlify.toml             # Netlify configuration
```

## Usage

### Daily Workflow

1. Jobs are automatically scraped at 6 AM daily
2. New jobs appear on the dashboard with "New" badge
3. AI scores are calculated for job matching
4. Review high-match jobs and start applications
5. Generate tailored cover letters with one click
6. Track application progress through the pipeline

### Manual Scraping

In Google Apps Script, run `runDailyScrape()` to manually trigger scraping.

### Testing Scrapers

Each scraper has a test function:
- `testEdJoinScraper()`
- `testWASAScraper()`
- `testSchoolSpringScraper()`
- `testHigherEdJobsScraper()`
- `testK12JobSpotScraper()`

## Customization

### Updating Your Profile

Edit the `USER_PROFILE` object in:
- `netlify/functions/claude-match.js`
- `netlify/functions/claude-generate.js`

### Adding Job Sources

1. Create a new scraper file in `google-apps-script/scrapers/`
2. Follow the pattern from existing scrapers
3. Add the scraper call to `runDailyScrape()` in `Code.gs`

### Changing Target States

Edit `TARGET_STATES` in `google-apps-script/Config.gs`

## Costs

| Service | Monthly Cost |
|---------|-------------|
| Netlify Hosting | $0 (free tier) |
| Google Apps Script | $0 |
| Google Sheets | $0 |
| Claude API | $5-20 (usage-based) |
| **Total** | **$5-20/month** |

## Troubleshooting

### Jobs not appearing

1. Check Google Apps Script execution logs
2. Verify the Web App URL is correct
3. Run a test scraper function manually

### AI matching not working

1. Verify `ANTHROPIC_API_KEY` is set in Netlify
2. Check Netlify function logs for errors
3. Ensure you have API credits

### Scraper returning no results

1. Run the test function for that scraper
2. Check if the website structure has changed
3. Verify rate limiting isn't blocking requests

## License

MIT License - feel free to modify for your own use.

## Support

For issues, create a GitHub issue or contact the developer.
