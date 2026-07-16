import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { connectDB } from "../config/db.js";
import mongoose from "mongoose";
import { chunkText } from "../services/chunkingService.js";
import { getEmbeddings, EMBEDDING_MODEL, EMBEDDING_VERSION } from "../services/embeddingService.js";
import Chunk from "../models/Chunk.js";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function flattenRecord(record) {
  const claimsText =
    record.claims.length > 0
      ? record.claims
          .map(
            (c, i) =>
              `Claim ${i + 1}: date ${c.date}, amount ₹${c.amount}, reason: ${c.reason}, status: ${c.status}`
          )
          .join(". ")
      : "No claims filed.";

  return `Policy ${record.policyNumber} belongs to ${record.name}, age ${record.age}. ` +
    `It is a ${record.insuranceType} insurance policy on the ${record.plan} plan, ` +
    `with a premium of ₹${record.premium} and coverage of ₹${record.coverage}. ` +
    `The policy runs from ${record.startDate} to ${record.endDate}. ${claimsText}`;
}

async function seed() {
  await connectDB();

  const filePath = path.join(__dirname, "data", "insurance_data.json");
  const records = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  console.log(`Loaded ${records.length} records`);

  await Chunk.deleteMany({ source: "insurance_data.json" });

  const allChunks = [];
  for (const record of records) {
    const text = flattenRecord(record);
    const pieces = chunkText(text, 200, 50);
    allChunks.push(...pieces);
  }
  console.log(`Produced ${allChunks.length} chunks`);

  const embeddings = await getEmbeddings(allChunks, "document");

  const documents = allChunks.map((text, i) => ({
    text,
    embedding: embeddings[i],
    embeddingModel: EMBEDDING_MODEL,
    embeddingVersion: EMBEDDING_VERSION,
    source: "insurance_data.json",
  }));

  await Chunk.insertMany(documents);
  console.log(`Inserted ${documents.length} chunks into MongoDB`);

  await mongoose.connection.close();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});