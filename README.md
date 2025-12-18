🟣 OBRINA — AI-Driven Market Insight & Risk Intelligence Platform

OBRINA is an AI-powered MERN application that explains why stocks and cryptocurrencies move, scores their real-time risk, and analyzes crypto whitepapers for scam indicators.
Unlike typical market apps that only show charts, OBRINA focuses on explainability, sentiment intelligence, and risk scoring to help users understand the why behind market movements.

🚀 Core Features
✅ 1. Market Movement Explainer (Stocks + Crypto)

Fetches price data and news in real time

Identifies high-impact headlines

Uses NLP to explain what caused the price move

✅ 2. AI Risk Score (0–100)

Risk score computed using:

News sentiment (via NLP)

Headline toxicity (via Perspective API)

Price volatility

News volume spikes

✅ 3. Crypto Whitepaper Analyzer

Fetch or upload whitepapers

Summarizes key points using AI

Detects red flags: vague claims, missing team info, suspicious tokenomics

Generates a scam-likelihood score

✅ 4. Watchlist & Alerts

Users can follow assets

Alerts when risk crosses thresholds

🧠 Tech Stack
Frontend

React (Vite or CRA)

TailwindCSS / CSS Modules

Recharts or Chart.js

Axios

Backend

Node.js

Express

Mongoose (MongoDB)

Cron jobs for data collection

Database

MongoDB / MongoDB Atlas

AI / External APIs

HuggingFace Inference API — sentiment & summarization

Perspective API — toxicity scores

Finnhub / Alpha Vantage — stock data

CoinGecko API — crypto prices

NewsAPI / GNews — financial headlines
_______________________________________________________________
uvicorn app:app --host 127.0.0.1 --port 8000 --workers 1
-------------------------------------------