import express from "express";
import mongoose from "mongoose";
import Chat from "../models/Chat.js";
import { generateAnswer } from "../services/llmService.js";
import { createEmbedding } from "../utils/createEmbedding.js";
import { searchMedicalChunks } from "../services/ragService.js";

const router = express.Router();

router.post("/", async (req, res) => {
    try {
        const { patientId, question, chatId } = req.body;

        // Validate patientId
        if (!mongoose.Types.ObjectId.isValid(patientId)) {
            return res.status(400).json({
                error: "Invalid patientId",
            });
        }

        // Validate question
        if (!question || !question.trim()) {
            return res.status(400).json({
                error: "Question is required",
            });
        }

        // Validate chatId
        if (chatId && !mongoose.Types.ObjectId.isValid(chatId)) {
            return res.status(400).json({
                error: "Invalid chatId",
            });
        }

        // Load previous chat
        let previousChat = null;

        if (chatId) {
            previousChat = await Chat.findOne({
                _id: chatId,
                patientId,
            });

            if (!previousChat) {
                return res.status(404).json({
                    error: "Chat not found",
                });
            }
        }

        // Create conversation history
        const history = previousChat
            ? previousChat.messages
                .map(
                    (message) =>
                        `${message.role}: ${message.content}`
                )
                .join("\n")
            : "";

        // Create search query
        const searchQuery = history
            ? `${history}\nuser: ${question}`
            : question;

        // Create embedding from search query
        const queryEmbedding = await createEmbedding(searchQuery);

        // Search patient's medical records
        const results = await searchMedicalChunks(
            patientId,
            queryEmbedding
        );

        // No relevant medical information
        if (results.length === 0) {
            return res.json({
                answer:
                    "I don't have enough information in the provided medical records.",
                chatId,
                sources: [],
            });
        }

        // Build medical context
        const context = results
            .map((result) => result.content)
            .join("\n\n");

        // Generate answer
        const answer = await generateAnswer({
            question,
            context,
            history,
        });

        // Save chat
        let chat;

        if (chatId) {
            chat = await Chat.findOneAndUpdate(
                {
                    _id: chatId,
                    patientId,
                },
                {
                    $push: {
                        messages: [
                            {
                                role: "user",
                                content: question,
                            },
                            {
                                role: "assistant",
                                content: answer,
                            },
                        ],
                    },
                },
                {
                    returnDocument: "after",
                }
            );
        } else {
            chat = await Chat.create({
                patientId,
                messages: [
                    {
                        role: "user",
                        content: question,
                    },
                    {
                        role: "assistant",
                        content: answer,
                    },
                ],
            });
        }

        // Response
        res.json({
            answer,
            chatId: chat._id,
            sources: results,
        });

    } catch (error) {
        res.status(500).json({
            error: error.message,
        });
    }
});

router.get("/:chatId", async (req, res) => {
    try {
        const { chatId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(chatId)) {
            return res.status(400).json({
                error: "Invalid chatId",
            });
        }

        const chat = await Chat.findById(chatId);

        if (!chat) {
            return res.status(404).json({
                error: "Chat not found",
            });
        }

        res.json(chat);
    } catch (error) {
        res.status(500).json({
            error: error.message,
        });
    }
});

router.get("/patient/:patientId", async (req, res) => {
    try {
        const { patientId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(patientId)) {
            return res.status(400).json({
                error: "Invalid patientId",
            });
        }

        const chats = await Chat.find({
            patientId,
        })
            .sort({ updatedAt: -1 })
            .select("_id messages createdAt updatedAt");

        res.json(chats);
    } catch (error) {
        res.status(500).json({
            error: error.message,
        });
    }
});

export default router;
