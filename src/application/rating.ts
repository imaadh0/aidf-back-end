import dotenv from "dotenv";
import JobApplication from "../infrastructure/schemas/jobApplication";
import { Types } from "mongoose";

// Load environment variables
dotenv.config();

// Define an interface for the Job schema
interface Job {
  title: string;
  description?: string;
  questions?: string[];
}

// Define an interface for the JobApplication schema
interface JobApplicationSchema {
  userId: string;
  fullName: string;
  answers: string[];
  job: Job | Types.ObjectId;
  rating?: string | null;
}

interface OpenRouterResponse {
  choices: Array<{
    message: {
      content: string | null;
    };
  }>;
}

interface AiFeedback {
  overallRating: "Excellent" | "Good" | "Average" | "Below Average" | "Poor";
  score: number;
  summary: string;
  answerFeedback: Array<{
    questionIndex: number;
    rating: "Strong" | "Adequate" | "Weak";
    feedback: string;
  }>;
  strengths: string[];
  improvements: string[];
}

// Do not throw during module load. We'll validate inside the function
const apiKey = process.env.OPENROUTER_API_KEY;
const model = process.env.OPENROUTER_MODEL || "openai/gpt-oss-20b:free";

const extractJson = (value: string) => {
  const trimmed = value.trim();
  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fencedMatch) {
    return fencedMatch[1];
  }
  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1);
  }
  return trimmed;
};

const normalizeFeedback = (value: unknown, answerCount: number): AiFeedback | null => {
  if (!value || typeof value !== "object") {
    return null;
  }

  const raw = value as Partial<AiFeedback>;
  const allowedOverall = [
    "Excellent",
    "Good",
    "Average",
    "Below Average",
    "Poor",
  ] as const;
  const allowedAnswerRatings = ["Strong", "Adequate", "Weak"] as const;

  const answerFeedback = Array.from({ length: answerCount }, (_, index) => {
    const item = Array.isArray(raw.answerFeedback)
      ? raw.answerFeedback.find((feedback) => feedback.questionIndex === index)
      : undefined;
    const rating = allowedAnswerRatings.includes(item?.rating as AiFeedback["answerFeedback"][number]["rating"])
      ? (item?.rating as AiFeedback["answerFeedback"][number]["rating"])
      : "Adequate";

    return {
      questionIndex: index,
      rating,
      feedback:
        typeof item?.feedback === "string" && item.feedback.trim()
          ? item.feedback.trim()
          : "The answer was reviewed, but the model did not provide detailed notes for this response.",
    };
  });

  const ratingScores = {
    Strong: 8.5,
    Adequate: 6,
    Weak: 3,
  };
  const derivedScore = Math.round(
    answerFeedback.reduce((total, item) => total + ratingScores[item.rating], 0) /
      Math.max(1, answerFeedback.length)
  );
  const modelScore = Math.min(
    10,
    Math.max(1, Math.round(Number(raw.score) || derivedScore))
  );
  const score = Math.abs(modelScore - derivedScore) > 2 ? derivedScore : modelScore;

  const derivedOverallRating = (() => {
    if (score >= 9) return "Excellent";
    if (score >= 7) return "Good";
    if (score >= 5) return "Average";
    if (score >= 3) return "Below Average";
    return "Poor";
  })();

  const overallRating = allowedOverall.includes(raw.overallRating as AiFeedback["overallRating"])
    ? (raw.overallRating as AiFeedback["overallRating"])
    : derivedOverallRating;
  const finalOverallRating =
    Math.abs(
      allowedOverall.indexOf(overallRating) - allowedOverall.indexOf(derivedOverallRating)
    ) > 1
      ? derivedOverallRating
      : overallRating;

  return {
    overallRating: finalOverallRating,
    score,
    summary:
      typeof raw.summary === "string" && raw.summary.trim()
        ? raw.summary.trim()
        : "The candidate has been reviewed against the role requirements.",
    answerFeedback,
    strengths: Array.isArray(raw.strengths)
      ? raw.strengths.filter((item): item is string => typeof item === "string" && Boolean(item.trim())).slice(0, 4)
      : [],
    improvements: Array.isArray(raw.improvements)
      ? raw.improvements.filter((item): item is string => typeof item === "string" && Boolean(item.trim())).slice(0, 4)
      : [],
  };
};

export async function generateRating(jobApplicationId: Types.ObjectId) {
  // If no API key, skip rating generation gracefully
  if (!apiKey) {
    console.warn("OPENROUTER_API_KEY is missing; skipping rating generation.");
    return;
  }
  const jobApplication = await JobApplication.findById(
    jobApplicationId
  ).populate("job");

  if (!jobApplication) {
    throw new Error("Job application not found");
  }

  const job = jobApplication.job as unknown as Job;
  const answers = jobApplication.answers;

  if (!job || !job.title || !answers) {
    throw new Error("Invalid job application data");
  }

  const content = [
    "You are an experienced technical recruiter. Evaluate this job application and return only valid JSON.",
    "Score consistently with the answer ratings: Strong answers are usually 8-10, Adequate answers are usually 5-7, and Weak answers are usually 1-4.",
    "The overallRating must match the score: Excellent 9-10, Good 7-8, Average 5-6, Below Average 3-4, Poor 1-2.",
    "Use this exact JSON shape:",
    `{"overallRating":"Excellent|Good|Average|Below Average|Poor","score":1,"summary":"2-3 sentences","answerFeedback":[{"questionIndex":0,"rating":"Strong|Adequate|Weak","feedback":"specific feedback"}],"strengths":["specific strength"],"improvements":["specific improvement"]}`,
    `Role: ${job.title}`,
    `Job description: ${job.description || "Not provided"}`,
    "Candidate answers:",
    answers
      .map((answer, index) => {
        const question = job.questions?.[index] || `Question ${index + 1}`;
        return `${index}. ${question}\nAnswer: ${answer}`;
      })
      .join("\n\n"),
    "Assess relevance, specificity, experience signals, communication quality, and evidence of fit. Do not use generic good/bad labels.",
  ].join("\n\n");

  const response = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": "https://hirely-ai.netlify.app",
        "X-Title": "Hirely AI",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "user",
            content: content,
          },
        ],
      }),
    }
  );

  if (!response.ok) {
    throw new Error(
      `OpenRouter API error: ${response.status} ${response.statusText}`
    );
  }

  const data = (await response.json()) as OpenRouterResponse;
  const strResponse = data.choices[0].message.content;

  if (strResponse === null) {
    throw new Error("Response content is null");
  }

  let parsedResponse: unknown;
  try {
    parsedResponse = JSON.parse(extractJson(strResponse));
  } catch (error) {
    console.error("Unable to parse OpenRouter rating response:", strResponse);
    throw error;
  }
  const aiFeedback = normalizeFeedback(parsedResponse, answers.length);
  if (!aiFeedback) {
    return;
  }

  await JobApplication.findOneAndUpdate(
    { _id: jobApplicationId },
    {
      rating: aiFeedback.overallRating,
      aiFeedback,
    }
  );
}
