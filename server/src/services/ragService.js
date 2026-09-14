import mongoose from "mongoose";
import DocumentChunk from "../models/DocumentChunk.js";

export async function searchMedicalChunks(patientId, queryEmbedding) {
  return DocumentChunk.aggregate([
    {
      $vectorSearch: {
        index: "vector_index",
        path: "embedding",
        queryVector: queryEmbedding,
        numCandidates: 20,
        limit: 5,
        filter: {
          patientId: new mongoose.Types.ObjectId(patientId),
        },
      },
    },
    {
      $set: {
        score: { $meta: "vectorSearchScore" },
      },
    },
    {
      $match: {
        score: { $gte: 0.70 },
      },
    },
    {
      $project: {
        content: 1,
        patientId: 1,
        documentId: 1,
        chunkIndex: 1,
        score: 1,
      },
    },
  ]);
}