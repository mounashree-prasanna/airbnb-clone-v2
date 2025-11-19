from dotenv import load_dotenv
load_dotenv()

import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, Any

from .models import ChatMessageIn, ChatMessageOut, TravelerPreferences
from .services.db import save_chat_message, get_traveler_conversation
from .services.ollama_client import extract_trip_json
from .services.planner import build_itinerary

print(" OLLAMA_BASE_URL =", os.getenv("OLLAMA_BASE_URL"))
print(" MONGO_URI =", os.getenv("MONGO_URI"))

# -----------------------------
# FastAPI App Setup
# -----------------------------
PORT = int(os.getenv("PORT", "7005"))
app = FastAPI(title="AI Service (Ollama + Mongo)", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



@app.post("/chatbot", response_model=ChatMessageOut)
async def chatbot(req: ChatMessageIn):
    try:
        # 1️⃣ Save user message
        await save_chat_message(req.traveler_id, "user", req.message)

        # 2️⃣ Build conversation history
        prior = await get_traveler_conversation(req.traveler_id)
        history_text = "\n".join(f"{m['role']}: {m['content']}" for m in prior[-6:])

        # 3️⃣ Build Ollama prompt
        prompt = f"""
Return ONLY JSON with keys: location, dates, party_type, budget, interests, dietary_filters.
If unknown, set null (don't guess).
Conversation:
{history_text}
User: {req.message}
"""

        # 4️⃣ Extract structured trip info from Mistral
        parsed: Dict[str, Any] = await extract_trip_json(prompt)

        location = parsed.get("location")
        dates_raw = parsed.get("dates")
        party_type = parsed.get("party_type") or "couple"

        # Normalize dates format - handle both string and list formats
        dates = None
        if dates_raw:
            if isinstance(dates_raw, list):
                # Convert list to string format: ["2024-12-20", "2024-12-25"] -> "2024-12-20 to 2024-12-25"
                if len(dates_raw) >= 2:
                    dates = f"{dates_raw[0]} to {dates_raw[1]}"
                elif len(dates_raw) == 1:
                    dates = dates_raw[0]
            elif isinstance(dates_raw, str):
                dates = dates_raw

        # 5️⃣ Generate itinerary if we have enough info
        if location and dates:
            prefs = TravelerPreferences(
                budget=parsed.get("budget") or "medium",
                interests=parsed.get("interests") or [],
                dietary_filters=parsed.get("dietary_filters") or [],
            )

            itinerary = await build_itinerary(location, dates, party_type, prefs)
            reply = f"I built a {party_type} itinerary for {location} ({dates}). Want to see the plan?"
            await save_chat_message(req.traveler_id, "assistant", reply)

            return ChatMessageOut(reply=reply, itinerary=itinerary)

        # 6️⃣ If missing info, ask user to provide it
        missing = []
        if not location:
            missing.append("destination")
        if not dates:
            missing.append("travel dates")

        reply = f"Almost there—please share your {', '.join(missing)}."
        await save_chat_message(req.traveler_id, "assistant", reply)
        return ChatMessageOut(reply=reply)

    except Exception as e:
        import traceback
        print("Error in /chatbot:", e)
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# -----------------------------
# Chat History Endpoint
# -----------------------------
@app.get("/chatbot/history/{traveler_id}")
async def history(traveler_id: str):
    msgs = await get_traveler_conversation(traveler_id)
    return {"messages": msgs}


# -----------------------------
# Health Check Endpoint
# -----------------------------
@app.get("/health")
async def health():
    return {"status": "ok"}
