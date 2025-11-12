from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta, timezone
import os
import httpx
import requests
import logging
import pytz
from dotenv import load_dotenv
import logging
from dotenv import load_dotenv
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent 
load_dotenv(BASE_DIR / "backend" / ".env")

TAVILY_API_KEY = os.getenv("TAVILY_API_KEY")
OPEN_WEATHER_API_KEY = os.getenv("OPEN_WEATHER_API_KEY")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="AI Concierge Agent", version="2.3.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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


async def search_tavily(query: str, max_results: int = 5) -> List[Dict[str, Any]]:
    """Use Tavily API for real-time search data"""
    if not TAVILY_API_KEY:
        logger.warning("TAVILY_API_KEY not found in .env")
        return []

    tavily_url = "https://api.tavily.com/search"
    payload = {"api_key": TAVILY_API_KEY, "query": query, "max_results": max_results}

    try:
        async with httpx.AsyncClient(timeout=15) as client:
            response = await client.post(tavily_url, json=payload)
            response.raise_for_status()
            data = response.json()
            return [
                {"title": r.get("title"), "url": r.get("url"), "snippet": r.get("content")}
                for r in data.get("results", [])
            ]
    except Exception as e:
        logger.error(f"Tavily API error: {e}")
        return []


def get_weather_info(location: str, dates: str) -> Dict[str, Any]:
    """Fetch real forecast if trip is soon, else return placeholder"""
    api_key = OPEN_WEATHER_API_KEY
    if not api_key:
        logger.warning("OPEN_WEATHER_API_KEY missing in .env")
        return {"location": location, "forecast": []}

    try:
        start_str, end_str = dates.split(" to ")
        start_date = datetime.strptime(start_str, "%Y-%m-%d").date()
        end_date = datetime.strptime(end_str, "%Y-%m-%d").date()
        today = datetime.utcnow().date()

        if (start_date - today).days > 5:
            logger.info(f"Trip to {location} too far ahead — weather unavailable yet.")
            return {
                "location": location,
                "forecast": [
                    {
                        "date": start_date.isoformat(),
                        "temp": "N/A",
                        "condition": "Forecast available 5 days before trip",
                    }
                ],
            }

        normalized_location = location.replace(" ", "+")
        url = "https://api.openweathermap.org/data/2.5/forecast"
        params = {"q": normalized_location, "appid": api_key, "units": "metric"}
        response = requests.get(url, params=params)
        response.raise_for_status()
        data = response.json()

        if "list" not in data:
            logger.error(f"Unexpected weather data for {location}: {data}")
            return {"location": location, "forecast": []}

        city_offset = data.get("city", {}).get("timezone", 0)
        tz = timezone(timedelta(seconds=city_offset))

        forecast_map = {}
        for entry in data["list"]:
            utc_dt = datetime.utcfromtimestamp(entry["dt"]).replace(tzinfo=timezone.utc)
            local_dt = utc_dt.astimezone(tz)
            local_date = local_dt.date()

            if start_date <= local_date <= end_date:
                temp = entry["main"]["temp"]
                condition = entry["weather"][0]["description"].title()
                forecast_map.setdefault(local_date, {"temps": [], "conditions": []})
                forecast_map[local_date]["temps"].append(temp)
                forecast_map[local_date]["conditions"].append(condition)

        forecast = []
        for date, info in forecast_map.items():
            avg_temp = sum(info["temps"]) / len(info["temps"])
            condition = max(set(info["conditions"]), key=info["conditions"].count)
            forecast.append({
                "date": date.isoformat(),
                "temp": f"{avg_temp:.1f}°C",
                "condition": condition,
            })

        forecast.sort(key=lambda x: x["date"])

        if not forecast:
            forecast = [{
                "date": start_date.isoformat(),
                "temp": "N/A",
                "condition": "Forecast not available yet"
            }]

        return {"location": location, "forecast": forecast}

    except Exception as e:
        logger.error(f"Weather API error for {location}: {e}")
        return {
            "location": location,
            "forecast": [{"date": "N/A", "temp": "N/A", "condition": "Error fetching data"}],
        }


async def get_activities(location: str, party_type: str, preferences: TravelerPreferences) -> List[ActivityCard]:
    query = f"Top tourist attractions and activities in {location} suitable for {party_type}"
    results = await search_tavily(query, max_results=12)
    return [
        ActivityCard(
            title=r.get("title", "Unknown Activity"),
            address=r.get("url", ""),
            duration="2-3 hours",
            tags=preferences.interests or ["outdoor", "family"],
            wheelchair_friendly="wheelchair" in query.lower(),
            child_friendly="child" in query.lower(),
        )
        for r in results
    ]


async def get_local_events(location: str, dates: str) -> List[Dict[str, Any]]:
    query = f"events happening in {location} during {dates}"
    results = await search_tavily(query, max_results=5)
    return [
        {"name": r.get("title"), "url": r.get("url"), "description": r.get("snippet", ""), "location": location}
        for r in results
    ]


async def get_restaurants(location: str, party_type: str, preferences: TravelerPreferences) -> List[RestaurantRecommendation]:
    dietary = " ".join(preferences.dietary_filters) if preferences.dietary_filters else "restaurants"
    query = f"best {dietary} restaurants in {location} for {party_type} travelers with price range and ratings"
    results = await search_tavily(query, max_results=6)
    return [
        RestaurantRecommendation(
            name=r.get("title", "Unknown Restaurant"),
            address=r.get("url", ""),
            cuisine_type="Various",
            price_tier="$$",
            dietary_accommodations=preferences.dietary_filters,
            rating=4.0,
        )
        for r in results
    ]


def generate_packing_checklist(weather_info: Dict[str, Any], preferences: TravelerPreferences) -> List[PackingItem]:
    checklist = [
        PackingItem(item="Clothes", category="clothing", weather_dependent=True),
        PackingItem(item="Toiletries", category="personal", weather_dependent=False),
        PackingItem(item="Phone charger", category="electronics", weather_dependent=False),
        PackingItem(item="Travel documents", category="documents", weather_dependent=False),
    ]

    for forecast in weather_info.get("forecast", []):
        if "rain" in forecast["condition"].lower():
            checklist.append(PackingItem(item="Umbrella", category="weather", weather_dependent=True))
            break

    if preferences.children and preferences.children > 0:
        checklist.append(PackingItem(item="Snacks for kids", category="food", weather_dependent=False))

    return checklist


@app.post("/ai-concierge", response_model=ConciergeResponse)
async def ai_concierge_agent(request: ConciergeRequest):
    """Main endpoint for travel recommendations"""
    try:
        location = request.booking_context.location
        preferences = request.preferences
        dates = request.booking_context.dates
        party_type = request.booking_context.party_type

        logger.info(f"Generating itinerary for {location}")

        weather_info = get_weather_info(location, dates)
        activities = await get_activities(location, party_type, preferences)
        restaurants = await get_restaurants(location, party_type, preferences)
        local_events = await get_local_events(location, dates)
        packing_checklist = generate_packing_checklist(weather_info, preferences)

        start_date, end_date = dates.split(" to ")
        current_date = datetime.strptime(start_date, "%Y-%m-%d")
        end_date_obj = datetime.strptime(end_date, "%Y-%m-%d")

        day_plans = []
        i = 0
        while current_date <= end_date_obj:
            subset = activities[i:i+3]
            if len(subset) < 3:
                subset += activities[:3 - len(subset)]
            i += 3

            day_plans.append(
                DayPlan(
                    date=current_date.strftime("%Y-%m-%d"),
                    morning=[subset[0]],
                    afternoon=[subset[1]],
                    evening=[subset[2]],
                )
            )
            current_date += timedelta(days=1)

        return ConciergeResponse(
            day_by_day_plan=day_plans,
            activity_cards=activities,
            restaurant_recommendations=restaurants,
            packing_checklist=packing_checklist,
            weather_info=weather_info,
            local_events=local_events,
        )

    except Exception as e:
        logger.error(f"Error generating itinerary: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "AI Concierge Agent (Tavily + OpenWeather)"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
