import mongoose from "mongoose";

const documentChunkSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
      index: true,
    },

    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MedicalDocument",
      required: true,
      index: true,
    },

    content: {
      type: String,
      required: true,
    },

    chunkIndex: {
      type: Number,
      required: true,
    },

    embedding: {
      type: [Number],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

const DocumentChunk = mongoose.model(
  "DocumentChunk",
  documentChunkSchema
);

export default DocumentChunk;
