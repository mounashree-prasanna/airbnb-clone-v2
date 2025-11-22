import os
from datetime import datetime
from typing import List, Dict, Any
from motor.motor_asyncio import AsyncIOMotorClient

MONGO_URI = os.getenv("MONGO_URI")
DB_NAME = os.getenv("MONGO_DB", "airbnb_db")

client = AsyncIOMotorClient(MONGO_URI) if MONGO_URI else None
db = client[DB_NAME] if client is not None else None
conversations = db["traveler_conversations"] if db is not None else None

async def save_chat_message(traveler_id: str, role: str, content: str, itinerary: Dict[str, Any] = None):
    if conversations is None:
        print("⚠️ MongoDB collection not initialized")
        return
    now = datetime.utcnow()
    message_data = {"role": role, "content": content, "timestamp": now}
    if itinerary:
        message_data["itinerary"] = itinerary
    await conversations.update_one(
        {"traveler_id": traveler_id},
        {
            "$push": {"messages": message_data},
            "$setOnInsert": {"created_at": now},
            "$set": {"updated_at": now},
        },
        upsert=True
    )

async def clear_traveler_conversation(traveler_id: str):
    """Clear all chat history for a traveler"""
    if conversations is None:
        print("⚠️ MongoDB collection not initialized")
        return
    await conversations.delete_one({"traveler_id": traveler_id})

async def get_traveler_conversation(traveler_id: str) -> List[Dict[str, Any]]:
    if conversations is None:
        print("⚠️ MongoDB collection not initialized")
        return []
    doc = await conversations.find_one({"traveler_id": traveler_id})
    return doc.get("messages", []) if doc else []
