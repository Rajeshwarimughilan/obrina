const express = require('express'); 
const mongoose = require('mongoose');
const NewsItem = require('../models/NewsItem');
const {analyzeText } = require('../services/nlp/sentiment');
const { analyzeToxicity } = require('../services/nlp/toxicity');
const { computeRelevance } = require('../services/relevance');
const Asset = require('../models/Asset');

const router = express.Router();

router.post("/:id/analyze", async (req, res) => {
    try{
        const {id} = req.params;
        if(!mongoose.Types.ObjectId.isValid(id)){
            return res.status(400).json({ error: "Invalid news item id"});
        }

        const news = await NewsItem.findById(id);
        if(!news){
            return res.status(404).json({ error: "News item not found"});
        }

        const text = (news.text &&news.text.trim().length > 0) ? news.text : news.title;
        const result = await analyzeText(text);

        news.sentiment = {score : typeof result.score === "number" ? result.score : 0.5, label: result.label || "neutral"};
        await news.save();

        return res.json({message: "Analysed" , sentiment: news.sentiment, source: result.source});
    }catch(err){
        console.error("POST /api/news/:id/analyze Error:", err.message || err);
        return res.status(500).json({ error: "Server error during sentiment analysis", details: err.message});
    }
});


router.post("/:id/sentiment", async (req, res) => {
    try{
        const {id} = req.params;
        if(!mongoose.Types.ObjectId.isValid(id)){
            return res.status(400).json({ error: "Invalid news item id"});
        }

        const news = await NewsItem.findById(id);
        if(!news){
            return res.status(404).json({ error: "News item not found"});
        }

        const text = (news.text &&news.text.trim().length > 0) ? news.text : news.title;
        const result = await analyzeText(text);

        news.sentiment = {score : typeof result.score === "number" ? result.score : 0.5, label: result.label || "neutral"};
        await news.save();

        return res.json({message: "Sentiment analyzed" , sentiment: news.sentiment, source: result.source});
    }catch(err){
        console.error("POST /api/news/:id/sentiment Error:", err.message || err);
        return res.status(500).json({ error: "Server error during sentiment analysis", details: err.message});
    }
});

router.post("/:id/toxicity", async (req, res) => {
    try{

        const { id } = req.params;
        if(!mongoose.Types.ObjectId.isValid(id)){
            return res.status(400).json({ error: "Invalid news item id"});
        }

        const news = await NewsItem.findById(id);
        if(!news){
            return res.status(404).json({error: "News item not found"});
        }

        const text =
            (news.text && news.text.trim().length > 0 ? news.text : news.title) || "";

        const result = await analyzeToxicity(text);
        news.toxicity = typeof result.toxicity === "number" ? result.toxicity : 0;
        await news.save();

        return res.json({
            message: "Toxicity analysed",
            toxicity: news.toxicity,
            source: result.source,
        });
    }
    catch(err){
        console.error("POST /api/news/:id/toxicity Error:", err.message || err);
        return res.status(500).json({
            error: "Server error during toxicity analysis",
            details: err.message,
        });

    }
});

router.post("/:id/relevance/:assetId", async (req, res) => {
    try{
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)){
            return res.status(400).json({error: "Invalid news item id"});
        }
         const news = await NewsItem.findById(id);
         if(!news){
            return res.status(404).json({error: "News item not found"});
         }

         const asset = await Asset.findBiId(news, assetId);
         if (!asset){
            return res.status(404).json({error: "Asset not found"});
         }

         const relevanceScore = computeRelevance(asset, news);
            news.relevance = relevanceScore;
            await news.save();

            return res.json({
                message: "Relevance computed",
                relevanceScore,
                relevant: relevanceScore > 0.4,
            });

    }
    catch(err){
        console.error("POST /api/news/:id/relevance/:assetId Error:", err.message || err);
        return res.status(500).json({
            error: "Server error during relevance computation",
            details: err.message,
        });

    }

});

module.exports = router;
