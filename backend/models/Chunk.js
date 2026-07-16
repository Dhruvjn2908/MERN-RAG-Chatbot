import mongoose from "mongoose";

const chunkSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: true,
    },
    embedding: {
      type: [Number], // an array of floats — the actual vector
      required: true,
    },
    embeddingModel: {
      type: String,
      required: true,
    },
    embeddingVersion: {
      type: String,
      required: true,
    },
    source: {
      type: String, // e.g. filename or a label for where this chunk came from
      default: "seed",
    },
  },
  { timestamps: true }
);

const Chunk = mongoose.model("Chunk", chunkSchema);

export default Chunk;