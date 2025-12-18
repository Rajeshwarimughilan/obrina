const axios = require("axios");
const config = require("../../config");

async function analyzeToxicity(text){
    const apikey = config.PERSPECTIVE_API_KEY;
    if(!apikey){
        throw new Error("Toxicity API key is not configured.");
    } 

    const cleaned = (text || "").trim();
    if(!cleaned){
        return {toxicity: 0, raw: null,  source: "perspective-empty"};
    }

    const url = `https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze?key=${apikey}`;

    const body = {
        comment: { text: cleaned.slice(0, 1500)},
        languages: ["en"],
        requestedAttributes: {
            TOXICITY: {},
        },
        doNotStore: true,
    };

    try{
        const resp = await axios.post(url, body, {
            headers: { "Content-Type": "application/json"},
            timeout: 15000,
        })

        const data = resp.data;
        const attr = data.attributeScores && data.attributeScores.TOXICITY;
        const value = 
            attr &&
            attr.summaryScore &&
            typeof attr.summaryScore.value === "number"
            ? attr.summaryScore.value: 0;

            const toxicity = Math.max(0, Math.min(1, value));

            return { toxicity, raw: data, source: "perspective"};
    }
    catch(err){
        console.error("analyzeToxicity error:" , err.message || err);
        throw new Error(
            `Perspective API error: ${
                err.response?.data?.error?.message || err.message || "unknown"
            }`
        );
    }
}

module.exports = { analyzeToxicity };