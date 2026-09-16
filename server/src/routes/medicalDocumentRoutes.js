import express from "express";
import MedicalDocument from "../models/MedicalDocument.js";
import DocumentChunk from "../models/DocumentChunk.js";
import { createEmbedding } from "../utils/createEmbedding.js";

import multer from "multer";

import { chunkText } from "../utils/chunkText.js";
import { uploadFile } from "../services/s3Service.js";

const router = express.Router();

const upload = multer({
    storage: multer.memoryStorage(),
});

router.post("/upload", upload.single("file"), async (req, res) => {

    try {
        if (!req.file) {
            return res.status(400).json({
                error: "File is required",
            });
        }

        const key = await uploadFile(req.file);

        res.status(201).json({
            message: "File uploaded successfully",
            key,
        });
    } catch (error) {
        res.status(500).json({
            error: error.message,
        });
    }
});

router.post("/", async (req, res) => {
  try {
    const document = await MedicalDocument.create(req.body);

    const chunks = chunkText(document.content);

    // await DocumentChunk.insertMany(
    //   chunks.map((content, index) => ({
    //     patientId: document.patientId,
    //     documentId: document._id,
    //     content,
    //     chunkIndex: index,
    //   }))
    // );

    const chunksWithEmbeddings = await Promise.all(
      chunks.map(async (content, index) => {

        // console.log("Creating embedding for:", content);
        
        const embedding = await createEmbedding(content);

        return {
          patientId: document.patientId,
          documentId: document._id,
          content,
          chunkIndex: index,
          embedding,
        };
      })
    );
    
    // console.log("chunk embeddings created for:", chunksWithEmbeddings);

    await DocumentChunk.insertMany(chunksWithEmbeddings);

    res.status(201).json({
      document,
      chunksCreated: chunks.length,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/chunks/:documentId", async (req, res) => {
  try {
    const chunks = await DocumentChunk.find({
      documentId: req.params.documentId,
    }).sort({ chunkIndex: 1 });

    res.json(chunks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/chunks", async (req, res) => {
  try {
    const chunks = await DocumentChunk.find().sort({ chunkIndex: 1 });

    res.json(chunks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/patient/:patientId", async (req, res) => {
  try {
    const documents = await MedicalDocument.find({
      patientId: req.params.patientId,
    });

    res.json(documents);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/", async (req, res) => {
  try {
    const documents = await MedicalDocument.find();

    res.json(documents);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;