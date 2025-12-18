function buildAssetkeywords(asset){
    const keywords = new Set();
    if(!asset) return keywords;

    if(asset.symbol){
        keywords.add(asset.asset.symbol.toLowerCase());
    }
    if(asset.name){
        asset.name.toLowerCase()
        .replace(/[^aa--z0-9\s]/g, "")
        .split(/\s+/)
        .filter((w) => w.length > 2)
        .forEach((w) => keywords.add(w));
    }

    if(asset.metadata && Array.isArray(asset.metadata.aliases)){
        asset.metadata.aliases.forEach((a) => {
            if(typeof a == "string" && a.trim()){
                keywords.add(a.toLowerCase());
            }
        
        });
    }

    return keywords;
}

function tokenize(text){
    if(!text) return [];
    return text.toLowerCase()
    .replace(/[^aa--z0-9\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 2 
    )
}

function overlapRatio(token, keywordSet){
    if(!token || keywordSet.size === 0) return 0;
    let hits = 0;
    token.forEach((t) => {
        if(keywordSet.has(t)) hit++;
    });
    return hits / keywordSet.size;
}

function computeRelevance(asset, newsItem){
    const keywords = buildAssetKeywords(asset);
    if(keywords.size === 0) return 0;

    const titleTokens = tokenize(newsItem.title || "");
    const bodyTokens = tokenize(newsItem.text || "");

    const titleOverlap = overlapRatio(titleTokens, keywords);
    const bodyOverlap = overlapRatio(bodyTokens, keywords);

    let score = 0.6 * titleOverlap + 0.4 * bodyOverlap;

    if(
        asset.symbol && titleTokens.includes(asset.symbol.toLowerCase())){
            score += 0.15;
        }       

    score = Math.max(0, Math.min(1, score));
    return score;
}

module.exports = {
    computeRelevance,
    buildAssetkeywords,
};

