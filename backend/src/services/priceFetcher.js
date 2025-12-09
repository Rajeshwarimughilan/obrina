// src/services/priceFetcher.js
const axios = require("axios");
const config = require("../config");
const Asset = require("../models/Asset");


function msFromTimestampString(ts) {
  const parsed = Date.parse(ts);
  return isNaN(parsed) ? null : parsed;
}

async function updateAssetLastPrice(assetId, price, date = new Date()) {
  try {
    if (!assetId) return;
    await Asset.findByIdAndUpdate(assetId, { lastPrice: price, lastUpdated: date }, { new: true });
  } catch (err) {
    console.error("updateAssetLastPrice error:", err.message || err);
  }
}

/* ---------- Crypto: CoinGecko ---------- */

async function getCryptoTimeseries(asset, rangeHours = 24) {
  try {
    const coingeckoBase = config.COINGECKO_API_URL || "https://api.coingecko.com/api/v3";
    const id = (asset.metadata && asset.metadata.coingeckoId) || asset.symbol.toLowerCase();
    const days = Math.max(1, Math.ceil(rangeHours / 24));
    const url = `${coingeckoBase}/coins/${encodeURIComponent(id)}/market_chart`;

    const resp = await axios.get(url, {
      params: { vs_currency: "usd", days },
      timeout: 15000,
    });

    const prices = (resp.data && resp.data.prices) || []; // [[ts_ms, price], ...]
    const cutoff = Date.now() - rangeHours * 3600 * 1000;

    const mapped = prices.map(([t, price]) => ({ t, price }));
    const filtered = mapped.filter((p) => p.t >= cutoff);
    const timeseries = filtered.length ? filtered : mapped;

    const last = timeseries.length ? timeseries[timeseries.length - 1] : null;
    const lastPrice = last ? last.price : asset.lastPrice || 0;
    updateAssetLastPrice(asset._id, lastPrice, last ? new Date(last.t) : new Date());

    return { timeseries, lastPrice };
  } catch (err) {
    console.error("getCryptoTimeseries error:", err.message || err);
    throw err;
  }
}

/* ---------- Stocks: AlphaVantage (free endpoints) + Finnhub (fallback) ---------- */

async function getStockTimeseries(asset, rangeHours = 24) {
  try {
    const alphaKey = config.ALPHA_VANTAGE_API_KEY;
    const finnhubKey = config.FINNHUB_API_KEY;
    const symbol = asset.symbol.toUpperCase();

    if (!alphaKey) {
      if (finnhubKey) {
        console.warn("ALPHA_VANTAGE_API_KEY missing; using Finnhub quote fallback for current price.");
        return await getStockQuoteFallback(symbol, asset);
      } else {
        throw new Error("No ALPHA_VANTAGE_API_KEY or FINNHUB_API_KEY configured for stock data");
      }
    }

    // 1) Try GLOBAL_QUOTE (free) for a quick current price
    let globalQuotePrice = null;
    try {
      const quoteResp = await axios.get("https://www.alphavantage.co/query", {
        params: { function: "GLOBAL_QUOTE", symbol, apikey: alphaKey },
        timeout: 10000,
      });

      if (quoteResp.data && quoteResp.data["Global Quote"]) {
        const gq = quoteResp.data["Global Quote"];
        const p = parseFloat(gq["05. price"] || gq["05. Price"] || gq["05.Price"] || NaN);
        if (!Number.isNaN(p)) {
          globalQuotePrice = p;
        }
      } else if (quoteResp.data && quoteResp.data["Note"]) {
        console.warn("AlphaVantage note (GLOBAL_QUOTE):", quoteResp.data["Note"]);
      } else if (quoteResp.data && quoteResp.data["Error Message"]) {
        console.warn("AlphaVantage error (GLOBAL_QUOTE):", quoteResp.data["Error Message"]);
      }
    } catch (gqErr) {
      console.warn("AlphaVantage GLOBAL_QUOTE request failed:", gqErr.message || gqErr);
      // continue to daily attempt / fallback
    }

    // 2) Try TIME_SERIES_DAILY or TIME_SERIES_DAILY_ADJUSTED for timeseries (both free)
    try {
      const url = `https://www.alphavantage.co/query`;
      const resp = await axios.get(url, {
        params: {
          function: "TIME_SERIES_DAILY", // daily is free; daily_adjusted is also acceptable
          symbol,
          outputsize: "compact",
          apikey: alphaKey,
        },
        timeout: 15000,
      });

      // pick the series key that includes "Time Series"
      const seriesKey = Object.keys(resp.data || {}).find((k) => k.includes("Time Series"));
      if (seriesKey && resp.data[seriesKey]) {
        const series = resp.data[seriesKey];
        const arr = Object.entries(series).map(([ts, vals]) => {
          const ms = msFromTimestampString(ts); // ts like "2025-02-05"
          const price = parseFloat(vals["4. close"] || vals["close"] || 0);
          return { t: ms, price };
        });

        const sorted = arr.sort((a, b) => a.t - b.t);
        const cutoff = Date.now() - rangeHours * 3600 * 1000;
        const filtered = sorted.filter((p) => p.t >= cutoff);
        const timeseries = filtered.length ? filtered : sorted;

        const last = timeseries.length ? timeseries[timeseries.length - 1] : null;
        const lastPrice = last ? last.price : (globalQuotePrice || asset.lastPrice || 0);
        updateAssetLastPrice(asset._id, lastPrice, last ? new Date(last.t) : new Date());

        return { timeseries, lastPrice };
      } else {
        
        if (resp.data && resp.data["Note"]) {
          console.warn("AlphaVantage note (daily):", resp.data["Note"]);
        }
        if (resp.data && resp.data["Error Message"]) {
          console.warn("AlphaVantage error (daily):", resp.data["Error Message"]);
        }
      }
    } catch (dailyErr) {
      console.warn("AlphaVantage daily request failed:", dailyErr.message || dailyErr);
    }

    // If daily didn't work but GLOBAL_QUOTE worked, return single-point timeseries
    if (globalQuotePrice !== null) {
      const now = Date.now();
      const lastPrice = globalQuotePrice;
      const timeseries = [{ t: now, price: lastPrice }];
      updateAssetLastPrice(asset._id, lastPrice, new Date(now));
      return { timeseries, lastPrice };
    }

    // 3) Fallback to Finnhub quote (current price only)
    if (finnhubKey) {
      console.warn("Falling back to Finnhub quote for current price.");
      return getStockQuoteFallback(symbol, asset);
    }

    throw new Error("No stock data available (AlphaVantage attempted; Finnhub not configured)");
  } catch (err) {
    console.error("getStockTimeseries error:", err.message || err);
    throw err;
  }
}

async function getStockQuoteFallback(symbol, asset) {
  const finnhubKey = config.FINNHUB_API_KEY;
  try {
    if (!finnhubKey) throw new Error("Finnhub key not configured for quote fallback");

    const resp = await axios.get("https://finnhub.io/api/v1/quote", {
      params: { symbol, token: finnhubKey },
      timeout: 10000,
    });

    if (resp.data && typeof resp.data.c === "number") {
      const now = Date.now();
      const lastPrice = resp.data.c;
      const timeseries = [{ t: now, price: lastPrice }];
      updateAssetLastPrice(asset._id, lastPrice, new Date(now));
      return { timeseries, lastPrice };
    }

    throw new Error("Finnhub quote returned no data");
  } catch (err) {
    console.error("getStockQuoteFallback error:", err.message || err);
    // if even this fails, return asset's stored lastPrice as safe fallback
    const lastPrice = asset.lastPrice || 0;
    return { timeseries: [{ t: Date.now(), price: lastPrice }], lastPrice };
  }
}

/* ---------- Public API ---------- */

async function getPriceTimeseriesForAsset(asset, rangeHours = 24) {
  if (!asset) throw new Error("Asset is required");
  if (asset.type === "crypto") return getCryptoTimeseries(asset, rangeHours);
  if (asset.type === "stock") return getStockTimeseries(asset, rangeHours);
  throw new Error("Unsupported asset type");
}

module.exports = {
  getPriceTimeseriesForAsset,
  updateAssetLastPrice,
};
