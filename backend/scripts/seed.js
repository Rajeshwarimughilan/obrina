// scripts/seed.js
require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../src/config/db");
const Asset = require("../src/models/Asset");
const NewsItem = require("../src/models/NewsItem");

(async () => {
  try {
    await connectDB();

    await Asset.deleteMany({});
    await NewsItem.deleteMany({});

    // Sample asset
    const asset = new Asset({
      symbol: "AAPL",
      type: "stock",
      name: "Apple Inc.",
      metadata: { exchange: "NASDAQ", industry: "Technology" },
      lastPrice: 170.5,
      lastUpdated: new Date(),
    });

    await asset.save();
    console.log("Seeded asset:", asset._id);

    // Sample news
    const news1 = new NewsItem({
      assetId: asset._id,
      publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 4),
      source: "Example News",
      title: "Apple announces new product line",
      url: "https://example.com/apple-product",
      text: "Apple unveiled a new product line today...",
      sentiment: { score: 0.5, label: "pos" },
      toxicity: 0,
      relevanceScore: 0.9,
      fetchedAt: new Date(),
    });

    const news2 = new NewsItem({
      assetId: asset._id,
      publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
      source: "Another News",
      title: "Apple faces regulatory scrutiny",
      url: "https://example.com/apple-reg",
      text: "Regulators are investigating...",
      sentiment: { score: -0.6, label: "neg" },
      toxicity: 0.1,
      relevanceScore: 0.95,
      fetchedAt: new Date(),
    });

    await news1.save();
    await news2.save();

    console.log("Seeded news items");
    process.exit(0);
  } catch (err) {
    console.error("Seeding error:", err);
    process.exit(1);
  }
})();
