import os, httpx
from typing import List, Dict, Any

TAVILY_API_KEY = os.getenv("TAVILY_API_KEY")

async def search_tavily(query: str, max_results: int = 5) -> List[Dict[str, Any]]:
    if not TAVILY_API_KEY:
        return []
    payload = {"api_key": TAVILY_API_KEY, "query": query, "max_results": max_results}
    async with httpx.AsyncClient(timeout=15) as client:
        r = await client.post("https://api.tavily.com/search", json=payload)
        r.raise_for_status()
        data = r.json()
    return [
        {"title": r.get("title"), "url": r.get("url"), "snippet": r.get("content")}
        for r in data.get("results", [])
    ]
