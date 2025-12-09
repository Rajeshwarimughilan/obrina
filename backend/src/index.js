const express = require("express");
const cors = require("cors");
// const dotenv = require("dotenv");
const connectDB = require("./config/db");
const config = require("./config/index");

// dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

connectDB();

const authRoutes = require("./routes/auth");
app.use("/api/auth", authRoutes);

const assetRoutes = require("./routes/assets");
app.use("/api/assets", assetRoutes);

app.get("/api/health", (req,res) => {
    res.json({status: "ok"});
});


const { startJobs } = require("./cron/fetchJobs");

setTimeout(() => {
    try{
        startJobs();
    }
    catch(err){
        console.error("Failed to start cron jobs:", err.message || err);
    }
})

const newsRoutes = require("./routes/news");
app.use("/api/news", newsRoutes);


// const PORT = process.env.PORT || 5000;
const PORT = config.PORT;
app.listen(PORT, () => {
    console.log(`server is running on port ${PORT}`);
})