const axios = require('axios');
const config = require('../../config');

let offlineSentiment = null;
try{
    offlineSentiment = require("sentiment");
}
catch(e){
    offlineSentiment = null;
}

async function analyzeTextHF(text){
    const hfkey = config.HUGGINGFACE_API_KEY;
    if(!hfkey){
        throw new Error("HUGGINGFACE_API_KEY not configured");
    }

    const url = "https://api-inference.huggingface.co/models/distilbert-base-uncased-finetuned-sst-2-english";
    try{
        const resp = await axios.post(url, 
            {inputs: text},
            {headers: {Authorization: `Bearer ${hfkey}`, "Content-Type": "application/json"}, timeout: 20000}
        );

        const data = resp.data;
        if(!data) throw new Error("No response data from HuggingFace");

        const item = Array.isArray(data) ? data[0] : data;

        let labelRaw = (item && item.label) || "";
        let scoreRaw = typeof item.score === "number" ? item.score: null;

        if (!labelRaw || !scoreRaw) {
            return { score : 0.5, label: "neutral", source: "hf"};
        }

        const label = labelRaw.toLowerCase().includes("pos") ? "pos" : labelRaw.toLowerCase().includes("neg") ? "neg" : "neutral";
        const score = Math.max(0, Math.min(1, scoreRaw));

        return {score, label, source: "hf"};
    }catch(err){
        throw err;
    }
}

function analyzeTextOffline(text){
    if(!offlineSentiment){
        throw new Error("Offline sentiment analysis not available");
    }

    try{
        const s = offlineSentiment();
        const result = s.analyze(text || "");
        const comaprative = typeof result.comparative === "number" ? result.comparative: 0;

        const clamped = Math.max(-1, Math.min(1, comaprative));
        const score = (clamped + 1) / 2; // map -1..1 to 0..1
        let label = "neutral";
        if(score >= 0.6) label = "pos";
        else if(score < 0.4) label = "neg";

        return { score, label, source: "offline"};
    }
    catch(err){
        return {score: 0.5, label: "neutral", source: "offline", error: err.message};
    }
}


async function analyzeText(text){
    if(!text || text.trim().length === 0){
        return { score: 0.5, label: "neutral", source: "empty"};
    }

    if(config.HUGGINGFACE_API_KEY){
        try{
            const res = await analyzeTextHF(text);
            return res;
        }catch(errr){
            console.warn("HuggingFace sentiment analysis failed, falling back to offline:", errr.message || errr);
        }
    }
    return analyzeTextOffline(text);
}

module.exports = { analyzeText };