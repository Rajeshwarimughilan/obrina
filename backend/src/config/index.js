require("dotenv").config();

function requireEnv(name) {
  const value = process.env[name];
  if (value === undefined || value === null || value === "") {
    console.warn(`⚠️ WARNING: Environment variable ${name} is missing.`);
  }
  return value;
}

module.exports = {
  MONGO_URI: requireEnv("MONGO_URI"),
  JWT_SECRET: requireEnv("JWT_SECRET"),
  PORT: requireEnv("PORT") || 5000,

  FINNHUB_API_KEY: requireEnv("FINNHUB_API_KEY"),
  ALPHA_VANTAGE_API_KEY: requireEnv("ALPHA_VANTAGE_API_KEY"),
  COINGECKO_API_URL: requireEnv("COINGECKO_API_URL"),

  NEWSAPI_KEY: requireEnv("NEWSAPI_KEY"),

  HUGGINGFACE_API_KEY: requireEnv("HUGGINGFACE_API_KEY"),
  PERSPECTIVE_API_KEY: requireEnv("PERSPECTIVE_API_KEY"),
};
