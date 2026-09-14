import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateAnswer({
  question,
  context,
  history,
}) {
  const response = await openai.responses.create({
    model: "gpt-5.6-luna",
    input: `
Use the medical information and conversation history to answer the patient's question.

Conversation history:
${history}

Medical information:
${context}

Question:
${question}

Answer only using the provided medical information.
If the answer is not present, say:
"I don't have enough information in the provided medical records."
`,
  });

  return response.output_text;
}