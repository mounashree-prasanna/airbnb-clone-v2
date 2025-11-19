from typing import List, Dict, Any
from datetime import datetime, timedelta
from ..models import (
    TravelerPreferences, ActivityCard, RestaurantRecommendation,
    PackingItem, ConciergeResponse, DayPlan
)
from .tavily import search_tavily
from .weather import get_weather_info

async def get_activities(location: str, party_type: str, preferences: TravelerPreferences) -> List[ActivityCard]:
    q = f"Top activities in {location} for {party_type}"
    results = await search_tavily(q, max_results=10)
    return [ActivityCard(title=r["title"], address=r["url"], duration="2-3 hours", tags=preferences.interests or []) for r in results]

async def get_restaurants(location: str, preferences: TravelerPreferences) -> List[RestaurantRecommendation]:
    filt = ", ".join(preferences.dietary_filters) or "best"
    q = f"{filt} restaurants in {location}"
    results = await search_tavily(q, max_results=6)
    return [RestaurantRecommendation(name=r["title"], address=r["url"], cuisine_type="Various", price_tier="$$", rating=4.2) for r in results]

async def get_local_events(location: str, dates: str) -> List[Dict[str, Any]]:
    q = f"Events happening in {location} during {dates}"
    results = await search_tavily(q, max_results=5)
    return [{"name": r["title"], "url": r["url"], "description": r["snippet"], "location": location} for r in results]

def packing_list(weather_info, preferences: TravelerPreferences) -> List[PackingItem]:
    items = [
        PackingItem(item="Clothes", category="clothing", weather_dependent=True),
        PackingItem(item="Toiletries", category="personal", weather_dependent=False),
        PackingItem(item="Phone charger", category="electronics", weather_dependent=False),
        PackingItem(item="Travel documents", category="documents", weather_dependent=False),
    ]
    if any("rain" in f["condition"].lower() for f in weather_info.get("forecast", [])):
        items.append(PackingItem(item="Umbrella", category="weather", weather_dependent=True))
    return items

async def build_itinerary(location: str, dates: str, party_type: str, preferences: TravelerPreferences) -> ConciergeResponse:
    weather = get_weather_info(location, dates)
    activities = await get_activities(location, party_type, preferences)
    restaurants = await get_restaurants(location, preferences)
    events = await get_local_events(location, dates)
    pack = packing_list(weather, preferences)

    # Parse dates - handle "YYYY-MM-DD to YYYY-MM-DD" format
    if isinstance(dates, list):
        # If dates is a list, convert to string format
        if len(dates) >= 2:
            dates = f"{dates[0]} to {dates[1]}"
        elif len(dates) == 1:
            dates = dates[0]
    
    if " to " in dates:
        start_date, end_date = dates.split(" to ")
    else:
        # If no " to " separator, assume single date or use same date for start/end
        start_date = dates.strip()
        end_date = dates.strip()
    
    current, end = datetime.strptime(start_date.strip(), "%Y-%m-%d"), datetime.strptime(end_date.strip(), "%Y-%m-%d")

    day_plans: List[DayPlan] = []
    i = 0
    while current <= end:
        subset = activities[i:i+3]
        if len(subset) < 3:
            subset += activities[:3-len(subset)]
        i += 3
        day_plans.append(DayPlan(date=current.strftime("%Y-%m-%d"), morning=[subset[0]], afternoon=[subset[1]], evening=[subset[2]]))
        current += timedelta(days=1)

    return ConciergeResponse(
        day_by_day_plan=day_plans,
        activity_cards=activities,
        restaurant_recommendations=restaurants,
        packing_checklist=pack,
        weather_info=weather,
        local_events=events,
    )
