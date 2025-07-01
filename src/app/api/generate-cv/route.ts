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
You are an expert CV writer specializing in South African job market. Create a professional, ATS-friendly CV based on the following information:

**Personal Information:**
- Name: ${cvData.personalInfo.fullName}
- Email: ${cvData.personalInfo.email}
- Phone: ${cvData.personalInfo.phone}
- Location: ${cvData.personalInfo.location}
- Professional Summary: ${cvData.personalInfo.professionalSummary}

**Work Experience:**
${cvData.experiences
  .map(
    (exp) => `
- ${exp.title} at ${exp.company} (${exp.startDate} - ${
      exp.isCurrent ? "Present" : exp.endDate
    })
  Location: ${exp.location || "Not specified"}
  Description: ${exp.description}
`
  )
  .join("\n")}

**Education:**
${cvData.education
  .map(
    (edu) => `
- ${edu.degree} from ${edu.institution} (${edu.graduationYear})
  Location: ${edu.location || "Not specified"}
  ${edu.description ? `Description: ${edu.description}` : ""}
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

**Requirements:**
1. Create a professional, well-structured CV suitable for the South African job market
2. Use proper formatting with clear sections
3. Make it ATS-friendly with appropriate keywords
4. Keep it concise but comprehensive (2-3 pages max)
5. Use action verbs and quantify achievements where possible
6. Include a compelling professional summary
7. Format as clean, readable text that can be easily copied

**Output the CV in clean, formatted text that includes:**
- Header with contact information
- Professional Summary
- Work Experience (reverse chronological order)
- Education
- Skills
- Any additional relevant sections

Please generate the CV now:
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
