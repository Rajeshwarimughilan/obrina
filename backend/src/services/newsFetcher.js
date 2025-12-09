const axios = require("axios");
const NewsItem = require("../models/NewsItem");
const Asset = require("../models/Asset");
const config = require("../config");

const NEWSAPI_ENDPOINT = "https://newsapi.org/v2/everything";

function buildQueriesForAsset(asset){
    const queries = [];
    const symbol = asset.symbol || "";
    const name = asset.name || "";

    if(symbol){
        queries.push(`${symbol} OR "$${symbol}"`);

    }

    if(name){
    queries.push(`"${name}"`);
    }

    if(name && symbol){
        queries.push(`("${name}" OR ${symbol})`);
    }

    if(name && name.split(" ").length > 1){
        queries.push(name.split(" ").slice(0, 2).join(" "));
    }

    return Array.from(new Set(queries)).slice(0, 3);
}

async function fetchFromNewsAPI(q, fromIso, pageSize = 50){
    const apikey = config.NEWSAPI_KEY;

    if(!apikey){
        throw new Error("NEWSAPI_KEY not configured");
    }

    const params = {
        q,
        language: "en",
        sortBy: "publishedAt",
        pageSize,
        apiKey: apikey,
    };

    if(fromIso){
        params.from = fromIso;
    }

    const resp = await axios.get(NEWSAPI_ENDPOINT, {params, timeout: 15_000});
    return resp.data;
}

function normalizeArticleToNewsItem(assetId, article) {
  return {
    assetId,
    publishedAt: article.publishedAt ? new Date(article.publishedAt) : new Date(),
    source: (article.source && article.source.name) || "",
    title: article.title || "",
    url: article.url || "",
    text: article.content || article.description || "",
    sentiment: { score: 0, label: "" },
    toxicity: 0,
    relevanceScore: 0,
    fetchedAt: new Date(),
  };
}

async function fetchNewsForAsset(asset, options = {}){
    const fromHours = options.fromHours || 48;
    const maxPerQuery = options.maxPerQuery || 50;
    const dedupeWindowHours = options.dedupeWindowHours || 7* 24;

    if(!asset || !asset._id){
        throw new Error("Invalid asset for news fetch");
    }

    const queries = buildQueriesForAsset(asset);
    const since = new Date(Date.now() - fromHours * 3600 * 1000).toISOString();
    const dedupeCutoff = new Date(Date.now() - dedupeWindowHours * 3600 * 1000);

    const results = { saved: 0, skipped: 0, errors: [], items: []};

    for (const q of queries) {
    try {
      const data = await fetchFromNewsAPI(q, since, maxPerQuery);

      if (!data || data.status !== "ok" || !Array.isArray(data.articles)) {
  
        if (data && data.message) {
          console.warn("NewsAPI warning:", data.message);
          results.errors.push(data.message);
        }
        continue;
      }

      for (const article of data.articles) {
        try {
          if (!article.url || !article.title) {
            results.skipped++;
            continue;
          }

          // Simple dedupe by URL OR same title within dedupe window
          const exists = await NewsItem.findOne({
            $or: [{ url: article.url }, { title: article.title }],
            fetchedAt: { $gte: dedupeCutoff },
          }).lean();

          if (exists) {
            results.skipped++;
            continue;
          }

          const doc = normalizeArticleToNewsItem(asset._id, article);
          const created = await NewsItem.create(doc);
          results.saved++;
          results.items.push(created);
        } catch (itemErr) {
          console.error("Error saving article:", itemErr.message || itemErr);
          results.errors.push(itemErr.message || String(itemErr));
        }
      }
    } catch (err) {
      console.error("fetchFromNewsAPI error for query:", q, err.message || err);
      results.errors.push(err.message || String(err));

      if (err.response && err.response.status === 429) {
        break;
      }
     
    }
  }

  return results;
}

module.exports = {
  fetchNewsForAsset,
};
