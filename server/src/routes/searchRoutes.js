import express from "express";
import mongoose from "mongoose";
import OpenAI from "openai";
import DocumentChunk from "../models/DocumentChunk.js";
import { createEmbedding } from "../utils/createEmbedding.js";

const router = express.Router();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});


router.post("/", async (req, res) => {
    try {
        const { question, patientId, limit } = req.body;

        const queryEmbedding = await createEmbedding(question);

        console.log("Query embedding length:", queryEmbedding.length);

        // res.json({
        //     message: "Question embedded successfully",
        //     embeddingLength: queryEmbedding.length,
        // });

        const results = await DocumentChunk.aggregate([
            {
                $vectorSearch: {
                    index: "vector_index",
                    path: "embedding",
                    queryVector: queryEmbedding,
                    numCandidates: 20,
                    limit: limit || 5,
                    filter: {
                        patientId: new mongoose.Types.ObjectId(patientId)
                    }
                },
            },
            {
                $set: {
                    score: { $meta: "vectorSearchScore" }
                }
            },
            {
                $match: {
                    score: { $gte: 0.70 }
                }
            },
            {
                $project: {
                    content: 1,
                    patientId: 1,
                    documentId: 1,
                    chunkIndex: 1,
                    score: { $meta: "vectorSearchScore" },
                },
            },
        ]);

        const context = results
            .map((result) => result.content)
            .join("\n\n");

        const response = await openai.responses.create({
            model: "gpt-5.6-luna",
            input: `
                    Answer the patient's question using only the medical information below.

                    Medical information:
                    ${context}

                    Question:
                    ${question}

                    If the answer is not present in the medical information, say:
                    "I don't have enough information in the provided medical records."
                    `,
        });

        res.json({
            answer: response.output_text,
            sources: results,
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


export default router;
