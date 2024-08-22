import JobApplication from "../infrastructure/schemas/jobApplication";
import OpenAI from "openai";

const client = new OpenAI({apiKey: process.env.OPENAI_API_KEY})
export async function generateRating(jobApplicationId) {
    
    const jobApplication = await JobApplication.findById(jobApplicationId).populate("job");

    const content = `Role:${jobApplication?.job.title}, User Description: ${jobApplication?.answers.join(". ")}`

    const completion = await client.chat.completions.create(
        {
            messages: [{role: "user", content}],
            model: "ft:gpt-3.5-turbo-0125:stemlink:fullstack:9ygrKFvk"
        }
    )
    const strResponse = completion.choices[0].message.content;
    console.log(strResponse);
    const response = JSON.parse(strResponse);
    if (!response.rate) {
        return
    }
    await JobApplication.findOneAndUpdate({_id: jobApplicationId}, {rating: response.rate})
}