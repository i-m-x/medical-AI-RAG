import "dotenv/config";
// import "./utils/createEmbedding.js";

import cors from "cors";
import express from "express";
import mongoose from "mongoose";
import chatRoutes from "./routes/chatRoutes.js";
import searchRoutes from "./routes/searchRoutes.js";
import patientRoutes from "./routes/patientRoutes.js";
import medicalDocumentRoutes from "./routes/medicalDocumentRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/chat", chatRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/medical-documents", medicalDocumentRoutes);

app.get("/api/health", (req, res) => {
    res.json({ message: "Medical RAG API is running" });
});

mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => {
        console.log("MongoDB connected");

        app.listen(process.env.PORT || 5000, () => {
            console.log("Server running on http://localhost:5000");
        });
    })
    .catch((error) => {
        console.error("MongoDB connection failed:", error.message);
    });
