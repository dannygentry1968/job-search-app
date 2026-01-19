// Netlify Function to generate cover letters and tailored resumes using Claude API

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

// Danny Gentry's full profile for document generation
const USER_PROFILE = {
  name: "Danny Gentry, Ed.D.",
  contact: {
    address: "2468 Lake Club Drive, Fairfield, CA 94533",
    phone: "(214) 980-0924",
    email: "mountainviewlearning@gmail.com"
  },
  education: [
    { degree: "Ed.D.", field: "Educational Leadership", institution: "Lamar University", location: "Beaumont, TX", year: 2018 },
    { degree: "M.Ed.", field: "Educational Administration", institution: "Baylor University", location: "Waco, TX", year: 1998 },
    { degree: "B.S.", field: "Biology", institution: "Stephen F. Austin State University", location: "Nacogdoches, TX", year: 1991 }
  ],
  certifications: [
    "EC-12 California Administrative Credential (Clear) - 2015",
    "EC-12 Superintendent Certificate (Texas) - 2014",
    "EC-12 Principal Certificate (Texas) - 1999",
    "6-12 Secondary Mathematics (Texas) - 1998",
    "6-12 Secondary Science Composite (Texas) - 1998",
    "CPI Nonviolent Crisis Intervention - Current",
    "ASCD Curriculum Leadership Academy - 2015",
    "Instructional Leadership Development - 2011"
  ],
  experience: [
    {
      title: "Principal",
      organization: "Rolling Hills Elementary, Fairfield-Suisun USD",
      location: "Fairfield, CA",
      dates: "2015 - Present",
      highlights: [
        "Lead 500-student elementary school (TK-5) with highly diverse population (20+ nationalities)",
        "Achieved California Honor Roll School designation (2018-2019)",
        "Implemented comprehensive MTSS framework",
        "Established NWEA MAP testing program with data dialogues and student goal-setting",
        "Created STEAM and Robotics programs for grades 1-5",
        "Implemented 1:1 technology device ratio for students",
        "Graduate of California Principal's Institute at UCLA (2015)",
        "Established successful PBIS program",
        "Assisted with district program for new and aspiring administrators"
      ]
    },
    {
      title: "Principal / Superintendent Intern",
      organization: "James L. Wright Elementary, Perryton ISD",
      location: "Perryton, TX",
      dates: "2012 - 2015",
      highlights: [
        "Led 611-student school (grades 1-3) with 67% English Language Learners, Title I",
        "Completed ASCD Curriculum Leadership Academy",
        "Established successful parental involvement program for non-English speaking families",
        "Developed comprehensive campus technology integration plan",
        "Wrote and secured major technology grant for mobile iPad carts",
        "Assisted with district budgeting, technology infrastructure, and professional development"
      ]
    },
    {
      title: "Principal",
      organization: "Bob Kirksey Elementary, Booker ISD",
      location: "Booker, TX",
      dates: "2011 - 2012",
      highlights: []
    },
    {
      title: "Assistant Principal / Director",
      organization: "Rifle High School, Garfield Re-2 School District",
      location: "Rifle, CO",
      dates: "2002 - 2005",
      highlights: [
        "Director of District Alternative Education Initiative (Bill and Melinda Gates Foundation Grant)",
        "Administrator in charge of creating new non-traditional high school",
        "Assisted with development of IB courses",
        "Established Multicultural Society and peer mediation programs"
      ]
    },
    {
      title: "Principal",
      organization: "Spade School (PK-12)",
      location: "Spade, TX",
      dates: "2000 - 2002",
      highlights: [
        "Led PK-12 campus",
        "Organized Site-Based Decision Making Committee",
        "Led development of new teacher evaluation system"
      ]
    },
    {
      title: "Assistant Principal",
      organization: "Mexia High School",
      location: "Mexia, TX",
      dates: "1998 - 2000",
      highlights: []
    }
  ],
  teaching: {
    years: 12,
    levels: "High School, Middle School, and Elementary",
    subjects: "Science and Mathematics",
    highlights: [
      "Designed and supervised construction of new science facilities",
      "Developed tutoring and after-school programs",
      "Led curriculum development and scope/sequence implementation",
      "Achieved exemplary scores for math students in all sub-populations"
    ]
  },
  publications: [
    "Gentry, D. (2025). The Collapse: How America Abandoned Its Teachers and What Comes Next. MountainView Learning Press.",
    "Gentry, D. (2025). Help Wanted: Classroom Jobs that Build Responsibility and Community. MountainView Learning Press.",
    "Gentry, D. (2019). The Influence of Mentoring on the Acquisition of Transformational Leadership Skills by Successful Title I Elementary Principals. ICPEL Conference.",
    "Gentry, D. (2018). Four Pieces of Advice for New Teachers. School Leaders Now.",
    "Gentry, D. (2018). Doctoral Dissertation on Mentoring and Transformational Leadership. Lamar University."
  ],
  strengths: [
    "Doctoral-level educational leadership preparation",
    "Both California and Texas administrative credentials including Superintendent certification",
    "PK-12 administrative experience across elementary, middle, and high school levels",
    "Proven success with diverse student populations and English Language Learners",
    "Strong technology integration and grant writing track record",
    "Published author and presenter on educational leadership topics",
    "MTSS, PBIS, and data-driven instruction implementation experience",
    "Experience in rural, suburban, and diverse community settings"
  ]
};

export async function handler(event, context) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'API key not configured' })
    };
  }

  try {
    const { job, type } = JSON.parse(event.body);

    if (!job || !type) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Job and type are required' })
      };
    }

    let prompt;
    if (type === 'cover_letter') {
      prompt = buildCoverLetterPrompt(job);
    } else if (type === 'resume_highlights') {
      prompt = buildResumeHighlightsPrompt(job);
    } else {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid type. Use cover_letter or resume_highlights' })
      };
    }

    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
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

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ content, type })
    };

  } catch (error) {
    console.error('Error in claude-generate:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
}

function buildCoverLetterPrompt(job) {
  return `You are an expert cover letter writer specializing in educational administration positions.

## CANDIDATE INFORMATION

**Name:** ${USER_PROFILE.name}
**Contact:** ${USER_PROFILE.contact.email} | ${USER_PROFILE.contact.phone}
**Address:** ${USER_PROFILE.contact.address}

**Education:**
${USER_PROFILE.education.map(e => `- ${e.degree} in ${e.field}, ${e.institution} (${e.year})`).join('\n')}

**Key Certifications:**
${USER_PROFILE.certifications.slice(0, 4).map(c => `- ${c}`).join('\n')}

**Current Position:** ${USER_PROFILE.experience[0].title}, ${USER_PROFILE.experience[0].organization} (${USER_PROFILE.experience[0].dates})

**Key Accomplishments:**
${USER_PROFILE.experience[0].highlights.slice(0, 5).map(h => `- ${h}`).join('\n')}

**Key Strengths:**
${USER_PROFILE.strengths.map(s => `- ${s}`).join('\n')}

---

## TARGET POSITION

**Title:** ${job.title}
**Organization:** ${job.organization}
**Location:** ${job.location}
**Source:** ${job.source}

---

## YOUR TASK

Write a compelling, professional cover letter for this position. The letter should:

1. Be addressed appropriately (use "Dear Hiring Committee" if specific contact unknown)
2. Open with enthusiasm for the specific position and organization
3. Highlight 3-4 most relevant qualifications that match this specific role
4. Include specific accomplishments with measurable outcomes where possible
5. Demonstrate knowledge of or interest in the organization/community
6. Close with a clear call to action
7. Be approximately 400-500 words
8. Use professional but warm tone appropriate for education leadership

Format the letter properly with:
- Date
- Recipient address (use organization name if specific person unknown)
- Salutation
- 3-4 body paragraphs
- Professional closing
- Signature line

Write ONLY the cover letter, no additional commentary.`;
}

function buildResumeHighlightsPrompt(job) {
  return `You are an expert resume consultant specializing in educational administration positions.

## CANDIDATE'S FULL EXPERIENCE

${JSON.stringify(USER_PROFILE.experience, null, 2)}

## TARGET POSITION

**Title:** ${job.title}
**Organization:** ${job.organization}
**Location:** ${job.location}

## YOUR TASK

Analyze the candidate's experience and suggest which accomplishments and experiences should be emphasized for THIS specific position.

Provide:
1. **Top 5 Bullet Points** - The most impactful accomplishments to highlight, reworded if needed to better align with this role
2. **Skills to Emphasize** - 5-7 key skills most relevant to this position
3. **Experience to Prioritize** - Which roles should be most detailed on the resume
4. **Optional Additions** - Any experiences or accomplishments that might be worth adding or expanding

Return as JSON with keys: top_bullets, skills, priority_roles, additions`;
}
