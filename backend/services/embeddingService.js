// ---- THE EMBEDDING SAFEGUARD ----
// Every vector we ever store gets tagged with exactly which model (and
// version string) produced it. If you ever switch embedding models,
// old vectors and new vectors will NOT be silently compared against
// each other — because a vector search only makes sense when the query
// vector and the stored vectors came from the same model.
//
// Bump EMBEDDING_VERSION any time you change the model, the output
// dimension, or anything else that changes what the vectors mean.
export const EMBEDDING_MODEL = "voyage-3.5-lite";
export const EMBEDDING_VERSION = "v1";

const VOYAGE_URL = "https://api.voyageai.com/v1/embeddings";

// inputType must be "document" (when embedding chunks to store) or
// "query" (when embedding a user's question to search with).
// Voyage tailors the vector differently depending on which one you say.
export async function getEmbeddings(texts, inputType) {
  const response = await fetch(VOYAGE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.VOYAGE_API_KEY}`,
    },
    body: JSON.stringify({
      input: texts, // Voyage accepts an array of strings — batch when you can
      model: EMBEDDING_MODEL,
      input_type: inputType,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Voyage AI error (${response.status}): ${errorBody}`);
  }

  const data = await response.json();
  // data.data is an array of { embedding, index } — one per input text,
  // in the same order we sent them
  return data.data.map((item) => item.embedding);
}