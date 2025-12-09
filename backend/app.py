from fastapi import FastAPI , HTTPException
from pydantic import BaseModel 
from transformers import pipeline
import logging

logging.basicConfig(level = logging.INFO)
logger = logging.getLogger("nlp-service")

class SentimentRequest(BaseModel):
    text: str

class SentimentResponse(BaseModel):
    label: str
    score: float
    model: str

app = FastAPI(title = "Local NLP Service")

MODEL_NAME = "distilbert-base-uncased-finetuned-sst-2-english"

logger.info(f"Loading model {MODEL_NAME} (this may take a while)...")
sentiment_pipe = pipeline("sentiment-analysis", model = MODEL_NAME, device = -1)  # device=-1 => CPU. Set device=0 for GPU

@app.post("/sentiment", response_model=SentimentResponse)
def sentiment(req: SentimentRequest):
    text = (req.text or "").strip()
    if not text:
        raise HTTPException(status_code = 400, detail = "text is required")
    try:
        outputs = sentiment_pipe(text[:1000])
        out = outputs[0]
        return SentimentResponse(label = out["label"], score = float(out["score"]), model = MODEL_NAME)
    except Exception as e:
        logger.exception("Model inference failed")
        raise HTTPException(status_code=500, detail=str(e))     
    