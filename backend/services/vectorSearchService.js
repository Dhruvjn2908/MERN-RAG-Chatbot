import Chunk from "../models/Chunk.js";
import { EMBEDDING_MODEL, EMBEDDING_VERSION } from "./embeddingService.js";

// Given a query vector, find the most similar chunks in MongoDB.
export async function searchSimilarChunks(queryEmbedding, topK = 3) {
  const results = await Chunk.aggregate([
    {
      $vectorSearch: {
        index: "vector_index",
        path: "embedding",
        queryVector: queryEmbedding,
        numCandidates: 100, // how many candidates Atlas scans before picking the best matches
        limit: topK,
      },
    },
    // ---- SAFEGUARD ENFORCED AT QUERY TIME ----
    // Only ever match chunks embedded by the exact model/version we're
    // currently using. If old vectors from a retired model are still
    // sitting in the collection, this filter keeps them out of results
    // instead of silently mixing incompatible vectors together.
    {
      $match: {
        embeddingModel: EMBEDDING_MODEL,
        embeddingVersion: EMBEDDING_VERSION,
      },
    },
    {
      $project: {
        text: 1,
        score: { $meta: "vectorSearchScore" },
      },
    },
  ]);

  return results;
}