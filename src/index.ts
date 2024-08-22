import "dotenv/config";
import express from "express";
import jobsRouter from "./api/jobs";
import { connectDB } from "./infrastructure/db";
import jobApplicationRouter from "./api/jobApplication";
import cors from "cors";
import GlobalErrorHandlingMiddleware from "./api/middleware/global-error-handler";

const app = express();

app.use(express.json()); // Middleware to parse JSON data from incoming requests and make it available in req.body
app.use(cors());

connectDB();

app.use("/jobs", jobsRouter);
app.use("/jobApplications", jobApplicationRouter);

app.use(GlobalErrorHandlingMiddleware)

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`Server is listening on port ${PORT}.`));

