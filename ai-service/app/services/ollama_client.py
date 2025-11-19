import os, json, httpx

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
MODEL_NAME = os.getenv("OLLAMA_MODEL", "phi3:mini")

async def extract_trip_json(prompt: str) -> dict:
    """
    Calls Ollama (phi3:mini) to return STRICT JSON containing:
    location, dates, party_type, budget, interests, dietary_filters
    """
    body = {
        "model": MODEL_NAME,
        "prompt": prompt,
        "stream": False
    }
    # Increased timeout to 300 seconds (5 minutes) for LLM generation
    timeout = httpx.Timeout(300.0, connect=10.0)
    async with httpx.AsyncClient(timeout=timeout) as client:
        try:
            r = await client.post(f"{OLLAMA_BASE_URL}/api/generate", json=body)
            r.raise_for_status()
            text = r.json().get("response", "").strip()
            # Some LLMs may wrap JSON in code fences; strip gently
            if text.startswith("```"):
                text = text.strip("` \n")
                if text.startswith("json"):
                    text = text[4:].strip()
            try:
                return json.loads(text)
            except Exception:
                return {}
        except httpx.ConnectError as e:
            raise Exception(f"Cannot connect to Ollama at {OLLAMA_BASE_URL}. Is Ollama running? Error: {str(e)}")
        except httpx.ReadTimeout as e:
            raise Exception(f"Ollama request timed out after 300 seconds. The model might be too slow or the request too complex. Error: {str(e)}")
        except httpx.HTTPStatusError as e:
            raise Exception(f"Ollama returned an error status: {e.response.status_code}. Response: {e.response.text}")
        except Exception as e:
            raise Exception(f"Error calling Ollama: {str(e)}")
