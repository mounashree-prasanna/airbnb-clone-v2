from pydantic import BaseModel
from typing import List, Optional, Dict, Any

class BookingContext(BaseModel):
    dates: str
    location: str
    party_type: str

class TravelerPreferences(BaseModel):
    budget: Optional[str] = "medium"
    interests: Optional[List[str]] = []
    mobility_needs: Optional[str] = "none"
    dietary_filters: Optional[List[str]] = []
    children: Optional[int] = 0

class ConciergeRequest(BaseModel):
    booking_context: BookingContext
    preferences: TravelerPreferences
    free_text_query: Optional[str] = None

class ActivityCard(BaseModel):
    title: str
    address: Optional[str] = None
    price_tier: Optional[str] = None
    duration: Optional[str] = None
    tags: List[str] = []
    wheelchair_friendly: bool = False
    child_friendly: bool = False

class RestaurantRecommendation(BaseModel):
    name: str
    address: Optional[str]
    cuisine_type: Optional[str]
    price_tier: Optional[str]
    dietary_accommodations: List[str] = []
    rating: Optional[float] = None

class PackingItem(BaseModel):
    item: str
    category: str
    weather_dependent: bool

class DayPlan(BaseModel):
    date: str
    morning: List[ActivityCard]
    afternoon: List[ActivityCard]
    evening: List[ActivityCard]

class ConciergeResponse(BaseModel):
    day_by_day_plan: List[DayPlan]
    activity_cards: List[ActivityCard]
    restaurant_recommendations: List[RestaurantRecommendation]
    packing_checklist: List[PackingItem]
    weather_info: Optional[Dict[str, Any]] = None
    local_events: Optional[List[Dict[str, Any]]] = None

# Chat
class ChatMessageIn(BaseModel):
    traveler_id: str
    message: str
    booking_context: Optional[Dict[str, Any]] = None  # Optional booking data from frontend

class ChatMessageOut(BaseModel):
    reply: str
    itinerary: Optional[ConciergeResponse] = None
