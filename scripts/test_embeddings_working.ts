import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

async function testEmbeddings() {
  const models = ["embedding-001", "text-embedding-004", "models/embedding-001", "models/text-embedding-004"];
  
  for (const modelName of models) {
    console.log(`Testing model: ${modelName}`);
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.embedContent("Hello world");
      console.log(`✅ Success with ${modelName}:`, result.embedding.values.length, "dimensions");
      return;
    } catch (error: any) {
      console.log(`❌ Failed with ${modelName}: ${error.message}`);
    }
  }
}

testEmbeddings();
