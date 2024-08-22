import JobApplication from "../infrastructure/schemas/jobApplication";
import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function generateRating(jobApplicationId: string) {
    // Fetch the job application and populate the 'job' field
    const jobApplication = await JobApplication.findById(jobApplicationId).populate("job");

    if (!jobApplication) {
        throw new Error("Job application not found");
    }

    // Check if the job has a title and answers are available
    const jobTitle = (jobApplication.job as { title?: string })?.title ?? "Unknown Role";
    const answers = jobApplication.answers ? jobApplication.answers.join(". ") : "No answers provided";

    // Create the content for the OpenAI completion
    const content = `Role: ${jobTitle}, User Description: ${answers}`;

    // Generate a rating using the OpenAI API
    const completion = await client.chat.completions.create({
        messages: [{ role: "user", content }],
        model: "ft:gpt-3.5-turbo-0125:stemlink:fullstack:9ygrKFvk",
    });

    const strResponse = completion.choices[0].message.content;
    console.log(strResponse);

    // Parse the response and check for the rating
    const response = JSON.parse(strResponse);
    if (!response.rate) {
        return;
    }

    // Update the job application with the generated rating
    await JobApplication.findOneAndUpdate({ _id: jobApplicationId }, { rating: response.rate });
}
