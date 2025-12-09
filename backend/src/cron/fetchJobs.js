const cron = require("node-cron");
const Asset = require("../models/Asset");
const priceService = require("../services/priceFetcher");
const newsService = require("../services/newsFetcher");


//  Configurable intervals (cron expressions)
//  - price job: every 10 minutes by default -> "*/10 * * * *"
//  - news job: every 20 minutes by default -> "*/20 * * * *"
// *    *    *    *    *
// │    │    │    │    └─ Day of week (0–7) (Sun=0 or 7)
// │    │    │    └───── Month (1–12)
// │    │    └────────── Day of month (1–31)
// │    └─────────────── Hour (0–23)
// └──────────────────── Minute (0–59)


function startJobs({priceCron = "*/10 * * * *", newsCron = "*/20 * * * *"} = {}){
    console.log("[cron] starting scheduled job");
    
    cron.schedule(priceCron, async () =>{
        console.log(`[cron] price job started at ${new Date().toISOString()}`);
        try{
            const assets = await Asset.find({});
            console.log(`[cron] price cron: fetched ${assets.length} assets`);
            for (const asset of assets){
                try{await priceService.getPriceTimeseriesForAsset(asset, 1);
                    console.log(`[cron] price updated for ${asset.symbol} (${asset._id})`);
                    await new Promise((r) => setTimeout(r, 100));
                }
                catch(innererr){
                    console.error(`[cron] price fetch failed for ${asset.symbol}:`, innererr.message || innererr);
                }
            }
        }
        catch(err){
            console.error(`[cron] price job error:`, err.message || err);
        }
        finally{
            console.log(`[cron] price job ended at ${new Date().toISOString()}`);
        }    
        }
    );

    cron.schedule(newsCron, async () =>{
        console.log(`[cron] news job started at ${new Date().toISOString()}`);
        try{
            const assets = await Asset.find({});
            console.log(`[cron] news cron: fetched ${assets.length} assets`);
            for ( const asset of assets){
                try{
                    const res = await newsService.fetchNewsForAsset(asset, {fromHours: 48});
                    console.log(`[cron] news fetched for ${asset.symbol} (${asset._id}): saved=${res.saved} skipped=${res.skipped} errors=${(res.errors || []).length}`);
                    await new Promise((r) => setTimeout(r, 100));
                }
                catch(innererr){
                    console.error(`[cron] news fetch failed for ${asset.symbol}:` , innererr.message || innererr);
                }
            }

        }
        catch(err){
            console.log(`[cron] news job error:`, err.message || err);
        }
        finally{
            console.log(`[cron] news job ended at ${new Date().toISOString()}`);
        }
    });
    
    console.log("[cron] sheduled jobs");
    console.log("[cron] - price job:", priceCron);
    console.log("[cron] - news job:", newsCron);
}

module.exports = { startJobs };