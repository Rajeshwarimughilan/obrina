const mongoose = require("mongoose");

const NewsItemSchema = new mongoose.Schema(
  {
    assetId: { type: mongoose.Schema.Types.ObjectId, ref: "Asset", required: true },
    publishedAt: { type: Date, required: true },
    source: { type: String, default: "" },
    title: { type: String, required: true },
    url: { type: String, required: true },
    text: { type: String, default: "" },
    sentiment: {
     
      score: { type: Number, default: 0 },
      label: { type: String, enum: ["pos", "neg", "neutral", ""], default: "" },
    },
    toxicity: { type: Number, default: 0 }, // 0..1
    relevanceScore: { type: Number, default: 0 }, // 0..1
    fetchedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("NewsItem", NewsItemSchema);
