import express from "express";
import multer from "multer";
import { uploadFile } from "../services/s3Service.js";

const router = express.Router();

const upload = multer({
    storage: multer.memoryStorage(),
});

router.post("/upload", upload.single("file"), async (req, res) => {

    console.log("API hit");
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

        res.status(201).json({ message: "File uploaded successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;