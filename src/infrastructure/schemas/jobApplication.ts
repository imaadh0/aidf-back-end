import mongoose from "mongoose";

const answerFeedbackSchema = new mongoose.Schema(
  {
    questionIndex: { type: Number, required: true },
    rating: {
      type: String,
      enum: ["Strong", "Adequate", "Weak"],
      required: true,
    },
    feedback: { type: String, required: true },
  },
  { _id: false }
);

const aiFeedbackSchema = new mongoose.Schema(
  {
    overallRating: {
      type: String,
      enum: ["Excellent", "Good", "Average", "Below Average", "Poor"],
      required: true,
    },
    score: { type: Number, min: 1, max: 10, required: true },
    summary: { type: String, required: true },
    answerFeedback: { type: [answerFeedbackSchema], default: [] },
    strengths: { type: [String], default: [] },
  },
  { _id: false }
);

const jobApplicationSchema = new mongoose.Schema({
    userId: {
      type: String,
      required: true,
    },
    fullName: {
      type: String,
      required: true,
    },
    answers: {
      type: [String],
      required: true,
    },
    job:{
        type: mongoose.Schema.Types.ObjectId,
        ref:"Job",
        required:true
    },
    rating: { type: String },
    aiFeedback: { type: aiFeedbackSchema, default: null },
  });

  const JobApplication = mongoose.model("JobApplication", jobApplicationSchema);

  export default JobApplication;
