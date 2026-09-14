import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function createEmbedding(text) {
    const response = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: text,
    });

    // console.log("Embedding response:", response.data[0].embedding);

    return response.data[0].embedding;
}

// createEmbedding("Fasting blood glucose was 145 mg/dL.")
//     .then((embedding) => {
//         console.log("Embedding length:", embedding.length);
//     })
//     .catch((error) => {
//         console.error("Embedding failed:", error.message);
//     });