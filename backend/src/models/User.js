const mongoose = require("mongoose");

const WatchlistItemSchema = new mongoose.Schema({
    symbol: {type: String , required: true},
    type: {type: String, enum:["stock", "crypto"], default: "stock"},
});

const SettingsSchema = new mongoose.Schema({
    alertThreshold: {
        risk: {type: Number, default: 70},
    },
});

const UserSchema = new mongoose.Schema(
    {
    email: {type: String, requires: true, unique: true, lowercase: true, trim: true },
    passwordHash: {type: String, requires: true},
    watchlist: {type: [WatchlistItemSchema], default: []},
    settings: {type: [SettingsSchema], default: () => ({}) },
    },
    {timestamps: true}
);

module.exports = mongoose.model("User", UserSchema);