const express = require("express");
const mongoose = require("mongoose");
const Asset = require("../models/Asset");
const NewsItem = require("../models/NewsItem");
const priceService = require("../services/priceFetcher");

const router = express.Router();

router.get("/", async (req, res) => {
    try{
        const assets = await Asset.find().sort({createdAt: -1});
        res.json({ assets});
    }
    catch(err){
        console.error("GET /api/asset Error:", err);
        res.status(500).json({ error: "Server error fetching asset"});
    }
});

router.post("/", async (req, res) => {
    try{
        const {symbol, type, name, metadata, lastPrice} = req.body || {};
        if(!symbol || !type || !name){
            return res.status(400).json({ error: "Symbol, type, and name are required"});
        }
        const normalisedSymbol = symbol.toString().trim().toUpperCase();

        const existing = await Asset.findOne({symbol: normalisedSymbol, type});
        if(existing){
            return res.status(400).json({ error: "Asset with this symbol and type already exists", asset: existing});
        }

        const asset = new Asset({
            symbol: normalisedSymbol,
            type,
            name: name.toString().trim(),
            metadata: metadata || {},
            lastPrice: lastPrice || 0,
        });
        await asset.save();
        return res.status(201).json({message: "Asset created", asset});
    }
    catch(err){
        console.error("POST /api/asset Error:", err);
        res.status(500).json({ error: "Server error creating asset"});
    }
});

router.get("/:id", async (req, res) =>{
    try{
        const { id } = req.params;
        if(!mongoose.Types.ObjectId.isValid(id)){
            return res.status(400).json({ error: "Invalid asset id"});
        }

        const asset = await Asset.findById(id);
        if(!asset){
            return res.status(404).json({ error: "Asset not found"});
        }

        const recentNews = await NewsItem.find({assetId: asset._id}).sort({publishedAt: -1}).limit(10);
        
        res.json({asset, recentNews});
    }
    catch(err){
        console.error("GET /api/asset/:id Error:", err);
        res.status(500).json({ error: "Server error fetching asset"});

    }
});

router.get("/:id/news", async (req, res) => {
    try{
        const { id } = req.params;
        if(!mongoose.Types.ObjectId.isValid(id)){
            return res.status(400).json({ error: "Invalid asset id"});
        }

        const news = await NewsItem.find({assetId: id}).sort({publishedAt: -1}).limit(50);
        res.json({news});

    }catch(err){
        console.error("GET /api/asset/:id/items Error:", err);
        res.status(500).json({ error: "Server error fetching asset news items"});
    }
});


router.get("/:id/price", async (req,res) =>{
    try{
        const {id} = req.params;
        const range = parseInt(req.query.range) || 24;
        if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({error: "Invalid asset id"});

        const asset = await Asset.findById(id);
        if(!asset) return res.status(404).json({error: "Asset not found"});

        const {timeseries, lastPrice} = await priceService.getPriceTimeseriesForAsset(asset, range);
        res.json({assetId : asset._id, symbol: asset.symbol, type: asset.type, timeseries, lastPrice});
    }
    catch(err){
        console.error("GET /api/assets/:id/price Error:", err.message || err);
        res.status(500).json({error:err.message || "Server error fetching asset price"});
    }
})

router.post("/:id/fetch-news", async (req, res) => {
  try {
    const { id } = req.params;
    const fromHours = parseInt(req.body.fromHours) || 48;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid asset id" });
    }
    const asset = await Asset.findById(id);
    if (!asset) return res.status(404).json({ error: "Asset not found" });

    const newsFetcher = require("../services/newsFetcher");
    const result = await newsFetcher.fetchNewsForAsset(asset, { fromHours });

    res.json({ message: "fetch complete", result });
  } catch (err) {
    console.error("POST /api/assets/:id/fetch-news error:", err.message || err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
});


module.exports = router;