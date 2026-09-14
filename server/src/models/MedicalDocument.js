import mongoose from "mongoose";

const medicalDocumentSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },

    title: {
      type: String,
      required: true,
    },

    content: {
      type: String,
      required: true,
    },

    documentType: {
      type: String,
      enum: ["report", "prescription", "diagnosis", "other"],
      default: "other",
    },
  },
  {
    timestamps: true,
  }
);

const MedicalDocument = mongoose.model(
  "MedicalDocument",
  medicalDocumentSchema
);

export default MedicalDocument;