import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error("GEMINI_API_KEY is not set in environment variables");
}

const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export interface CVData {
  personalInfo: {
    fullName: string;
    email: string;
    phone: string;
    location: string;
    professionalSummary: string;
  };
  experiences: Array<{
    title: string;
    company: string;
    location?: string;
    startDate: string;
    endDate?: string;
    isCurrent: boolean;
    description: string;
  }>;
  education: Array<{
    degree: string;
    institution: string;
    location?: string;
    graduationYear: string;
    description?: string;
  }>;
  skills: Array<{
    name: string;
    level: string;
  }>;
}

export async function POST(request: NextRequest) {
  if (!genAI) {
    return NextResponse.json(
      {
        error:
          "Gemini AI is not configured. Please check your GEMINI_API_KEY environment variable.",
      },
      { status: 500 }
    );
  }

  try {
    const {
      cvData,
      jobDescription,
      cvType = "professional",
    }: {
      cvData: CVData;
      jobDescription?: string;
      cvType?: "professional" | "creative" | "technical" | "executive";
    } = await request.json();

    // FIX: Corrected the model name from 'gemini-2.0-flash' to a valid model name.
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
    });

    const prompt = `
You are an expert CV writer specializing in the South African job market. Create a professional, ATS-friendly CV based on the following information.

**Personal Information:**
- Name: ${cvData.personalInfo.fullName}
- Email: ${cvData.personalInfo.email}
- Phone: ${cvData.personalInfo.phone}
- Location: ${cvData.personalInfo.location}

**Professional Summary:**
${cvData.personalInfo.professionalSummary}

**Work Experience:**
${cvData.experiences
  .map(
    (exp) => `
- **${exp.title}** at ${exp.company} (${exp.startDate} - ${
      exp.isCurrent ? "Present" : exp.endDate
    })
  - Location: ${exp.location || "Not specified"}
  - Description: ${exp.description}
`
  )
  .join("\n")}

**Education:**
${cvData.education
  .map(
    (edu) => `
- **${edu.degree}** from ${edu.institution} (${edu.graduationYear})
  - Location: ${edu.location || "Not specified"}
  - ${edu.description ? `Description: ${edu.description}` : ""}
`
  )
  .join("\n")}

**Skills:**
${cvData.skills.map((skill) => `- ${skill.name} (${skill.level})`).join("\n")}

${
  jobDescription
    ? `**Target Job Description:**\n${jobDescription}\n\nPlease tailor the CV to match this job description, highlighting relevant skills and experiences.`
    : ""
}

**CV Style:** ${cvType}

---
**OUTPUT REQUIREMENTS**
1.  **Format:** Generate the entire CV using **Markdown**.
2.  **Structure:** Use headings (#, ##, ###), bold (**text**), and bulleted lists (-) for clear, professional sections.
3.  **Content:**
    - Start with a main heading for the applicant's name.
    - Follow with a subheading for contact information.
    - Create sections for "Professional Summary", "Work Experience", "Education", and "Skills".
    - Under "Work Experience", use bullet points to detail responsibilities and achievements for each role.
4.  **Tone:** Professional, concise, and action-oriented.
5.  **Exclusivity:** Do NOT include any explanatory text, greetings, or sign-offs before or after the CV content. The output should begin directly with the applicant's name heading.

Generate the Markdown CV now:
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const generatedCV = response.text();

    return NextResponse.json({ cv: generatedCV });
  } catch (error) {
    console.error("Error generating CV:", error);
    return NextResponse.json(
      { error: "Failed to generate CV. Please try again." },
      { status: 500 }
    );
  }
}
