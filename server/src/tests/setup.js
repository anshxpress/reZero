import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

// Mock OpenAI client for tests
jest.mock('../services/openaiClient.js', () => ({
  getOpenAIClient: jest.fn(() => ({
    generateChatCompletion: jest.fn().mockResolvedValue({
      content: 'Mock response',
      usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 }
    }),
    generateEmbeddings: jest.fn().mockResolvedValue({
      embeddings: [[0.1, 0.2, 0.3]],
      usage: { prompt_tokens: 10, total_tokens: 10 }
    }),
    healthCheck: jest.fn().mockResolvedValue({ status: 'healthy' })
  }))
}));

let mongoServer;

beforeAll(async () => {
  // Close any existing connections
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  // Clean up collections
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
  
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  // Clean up collections after each test
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
});
