import os, requests
from datetime import datetime
from typing import Dict, Any, List

OPEN_WEATHER_API_KEY = os.getenv("OPEN_WEATHER_API_KEY")

def get_weather_info(location: str, dates: str) -> Dict[str, Any]:
    if not OPEN_WEATHER_API_KEY:
        return {"location": location, "forecast": []}

    try:
        start_str, end_str = dates.split(" to ")
        start_date = datetime.strptime(start_str, "%Y-%m-%d").date()

        url = "https://api.openweathermap.org/data/2.5/forecast"
        params = {"q": location, "appid": OPEN_WEATHER_API_KEY, "units": "metric"}
        data = requests.get(url, params=params, timeout=15).json()

        forecast: List[Dict[str, Any]] = []
        for i in range(0, len(data.get("list", [])), 8):
            entry = data["list"][i]
            forecast.append({
                "date": entry["dt_txt"].split(" ")[0],
                "temp": f"{entry['main']['temp']:.1f}°C",
                "condition": entry["weather"][0]["description"].title()
            })
        return {"location": location, "forecast": forecast[:5]}
    except Exception:
        return {"location": location, "forecast": []}
