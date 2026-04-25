import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

async function listModels() {
  try {
    // The listModels method is on the genAI instance, not on a specific model instance
    const result = await (genAI as any).listModels();
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("Error listing models:", error);
    
    // Alternative approach if listModels is not directly accessible
    console.log("Attempting to list models via a model instance...");
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        // Some versions of the SDK might have it elsewhere
        console.log("Checking model capabilities for embedding-001...");
        const embedModel = genAI.getGenerativeModel({ model: "embedding-001" });
        console.log("embedding-001 retrieved successfully");
    } catch (e) {
        console.error("Failed to retrieve embedding-001");
    }
  }
}

listModels();
