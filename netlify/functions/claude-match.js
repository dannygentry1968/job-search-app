// Netlify Function to match jobs using Claude API
// This keeps your API key secure on the server side

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

// Danny Gentry's profile for job matching
const USER_PROFILE = {
  name: "Danny Gentry",
  education: [
    { degree: "Ed.D.", field: "Educational Leadership", institution: "Lamar University", year: 2018 },
    { degree: "M.Ed.", field: "Educational Administration", institution: "Baylor University", year: 1998 },
    { degree: "B.S.", field: "Biology", institution: "Stephen F. Austin State University", year: 1991 }
  ],
  certifications: [
    "EC-12 California Administrative Credential (Clear)",
    "EC-12 Superintendent Certificate (Texas)",
    "EC-12 Principal Certificate (Texas)",
    "6-12 Secondary Mathematics (Texas)",
    "6-12 Secondary Science Composite (Texas)",
    "CPI Nonviolent Crisis Intervention (Current)",
    "ASCD Curriculum Leadership Academy Graduate"
  ],
  experience: {
    total_admin_years: 20,
    total_teaching_years: 12,
    current_role: "Principal, Rolling Hills Elementary, Fairfield-Suisun USD (2015-present)",
    highlights: [
      "Principal experience at elementary, PK-12, and high school levels",
      "Superintendent Intern, Perryton ISD",
      "Director of Alternative Education Initiative (Gates Foundation Grant)",
      "Created non-traditional high school program",
      "California Honor Roll School leadership",
      "Experience with diverse populations (20+ nationalities)",
      "MTSS implementation specialist",
      "Technology integration leader (1:1 device programs, STEAM, Robotics)",
      "Grant writing experience (major technology grants)",
      "PBIS implementation across multiple campuses",
      "Experience in Texas, California, and Colorado"
    ]
  },
  publications: [
    "The Collapse: How America Abandoned Its Teachers (2025)",
    "Help Wanted: Classroom Jobs that Build Responsibility (2025)",
    "Dissertation on Mentoring and Transformational Leadership (2018)",
    "Published research in American Journal of Physiology"
  ],
  geographic_preferences: [
    "California", "Washington", "Oregon", "Idaho",
    "Colorado", "Wyoming", "Montana", "Nevada",
    "Remote/Online positions welcome"
  ],
  deal_breakers: [],
  strengths: [
    "Doctoral degree in Educational Leadership",
    "Both California and Texas administrative credentials",
    "Superintendent certification",
    "PK-12 experience across all levels",
    "Diverse student population experience",
    "Technology integration expertise",
    "Grant writing success",
    "Published author",
    "Bilingual program development experience"
  ]
};

export async function handler(event, context) {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  // Check for API key
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'API key not configured' })
    };
  }

  try {
    const { jobs } = JSON.parse(event.body);

    if (!jobs || !Array.isArray(jobs) || jobs.length === 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Jobs array is required' })
      };
    }

    // Build the prompt
    const prompt = buildMatchPrompt(jobs);

    // Call Claude API
    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Claude API error:', error);
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: 'Claude API error', details: error })
      };
    }

    const data = await response.json();
    const content = data.content[0].text;

    // Parse the JSON response from Claude
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Could not parse Claude response' })
      };
    }

    const matchResults = JSON.parse(jsonMatch[0]);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(matchResults)
    };

  } catch (error) {
    console.error('Error in claude-match:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
}

function buildMatchPrompt(jobs) {
  return `You are an expert career advisor specializing in K-12 and higher education administration positions.

## CANDIDATE PROFILE

**Name:** ${USER_PROFILE.name}

**Education:**
${USER_PROFILE.education.map(e => `- ${e.degree} in ${e.field}, ${e.institution} (${e.year})`).join('\n')}

**Certifications:**
${USER_PROFILE.certifications.map(c => `- ${c}`).join('\n')}

**Experience:**
- Total Administrative Experience: ${USER_PROFILE.experience.total_admin_years} years
- Total Teaching Experience: ${USER_PROFILE.experience.total_teaching_years} years
- Current Role: ${USER_PROFILE.experience.current_role}

**Key Accomplishments:**
${USER_PROFILE.experience.highlights.map(h => `- ${h}`).join('\n')}

**Publications:**
${USER_PROFILE.publications.map(p => `- ${p}`).join('\n')}

**Geographic Preferences:** ${USER_PROFILE.geographic_preferences.join(', ')}

**Key Strengths:**
${USER_PROFILE.strengths.map(s => `- ${s}`).join('\n')}

---

## JOBS TO ANALYZE

${jobs.map((job, i) => `
### Job ${i + 1}: ${job.title}
- **Organization:** ${job.organization}
- **Location:** ${job.location}
- **Salary Range:** $${job.salary_min?.toLocaleString() || 'Not specified'} - $${job.salary_max?.toLocaleString() || 'Not specified'}
- **Deadline:** ${job.deadline || 'Not specified'}
- **Source:** ${job.source}
- **Job ID:** ${job.job_id}
`).join('\n')}

---

## YOUR TASK

Analyze each job and rate how well the candidate matches. For each job, provide:

1. **match_score** (0-100): How well does this candidate match the likely requirements?
   - 90-100: Exceptional match, highly competitive candidate
   - 80-89: Strong match, well-qualified
   - 70-79: Good match, meets most requirements
   - 60-69: Moderate match, may need to address gaps
   - Below 60: Weak match, significant gaps

2. **match_notes**: A brief 1-2 sentence explanation of the score

3. **recommendation**: One of "STRONG APPLY", "APPLY", "CONSIDER", or "SKIP"

4. **key_matches**: Array of 2-4 specific qualifications that match well

5. **concerns**: Array of 0-2 potential concerns or gaps (empty if none)

Return your analysis as a JSON array with one object per job. Each object should have:
- job_id (from the input)
- match_score
- match_notes
- recommendation
- key_matches
- concerns

Return ONLY the JSON array, no other text.`;
}
