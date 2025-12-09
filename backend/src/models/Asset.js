const mongoose = require("mongoose");
const AssetSchema = new mongoose.Schema({
    symbol: {type: String, required: true, trim: true, uppercase: true, index: true},
    type: {type: String, required: true, enum: ["stock", "crypto"], default: "stock"},
    name: {type: String, required:true, trim: true},
    metadata: {type: mongoose.Schema.Types.Mixed, default: {} },
    lastPrice: { type: Number, default: 0},
    lastUpdated: {type: Date, default: null},
}, {timestamps: true}
);

module.exports = mongoose.model("Asset", AssetSchema);