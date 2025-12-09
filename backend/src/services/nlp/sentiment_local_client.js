const axios = require("axios");
const LOCAL_NLP_URL = process.env.LOCAL_NLP_URL || "http://localhost:8000";

async function analyzeTextLocal(text){
    if(!text|| String(text).trim().length === 0){
        return {score: 0.5, label:"neutral", source: "local-empty"};
    }
    try{
        const resp = await axios.post(
            `${LOCAL_NLP_URL}`,
            {text},
            {timeout: 10000}
        );
        const data = resp.data;

        const labelLower = (data.label || "").toLowerCase();
        const label = labelLower.includes("pos") ? "pos" : labelLower.includes("neg") ? "neg" : "neutral";
        const score = Math.max(0, Math.min(1, Number(data.score) || 0.5));
        return {score, label, source: "local"};
    }catch(err){
        throw new Error(`LocalNLP request failed: ${err.message}`);
    }
}

module.exports = { analyzeTextLocal };