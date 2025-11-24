from dotenv import load_dotenv
load_dotenv()

import os
import httpx
import re
from datetime import datetime, timedelta
from fastapi import FastAPI, HTTPException, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, Any, Optional

from .models import ChatMessageIn, ChatMessageOut, TravelerPreferences
from .services.db import save_chat_message, get_traveler_conversation, clear_traveler_conversation
from .services.ollama_client import extract_trip_json
from .services.planner import build_itinerary

# Booking service URL
BOOKING_SERVICE_URL = os.getenv("BOOKING_SERVICE_URL", "http://booking-service:7004")

print(" OLLAMA_BASE_URL =", os.getenv("OLLAMA_BASE_URL"))
print(" MONGO_URI =", os.getenv("MONGO_URI"))

# -----------------------------
# FastAPI App Setup
# -----------------------------
PORT = int(os.getenv("PORT", "7005"))
app = FastAPI(title="AI Service (Ollama + Mongo)", version="1.0.0")

# Create router with /ai prefix to match ingress routing
router = APIRouter(prefix="/ai")

# CORS configuration - allow all origins in development
# In production, you should restrict this to specific domains
cors_origins_env = os.getenv("CORS_ORIGINS", "")
if cors_origins_env:
    allowed_origins = [origin.strip() for origin in cors_origins_env.split(",") if origin.strip()]
else:
    # Default origins for development
    allowed_origins = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://airbnb.local",
        "https://airbnb.local",
    ]

print(f"🔧 CORS allowed origins: {allowed_origins}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Explicit OPTIONS handler for CORS preflight (handles all paths)
@app.options("/{full_path:path}")
async def options_handler(full_path: str):
    from fastapi.responses import Response
    return Response(
        status_code=200,
        headers={
            "Access-Control-Allow-Origin": "*",  # Will be overridden by middleware for specific origins
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Allow-Credentials": "true",
        }
    )



async def fetch_traveler_bookings(traveler_id: str) -> list:
    """Fetch traveler's booking history from booking service"""
    try:
        # Increased timeout for booking service
        async with httpx.AsyncClient(timeout=30.0) as client:
            # Note: This endpoint requires JWT authentication, which we don't have in the AI service
            # So this will likely fail, but we'll handle it gracefully
            # The endpoint is /booking/traveler and expects Authorization header with JWT
            response = await client.get(
                f"{BOOKING_SERVICE_URL}/booking/traveler",
                headers={"X-Traveler-Id": traveler_id}  # Internal service call (may not work without auth)
            )
            if response.status_code == 200:
                data = response.json()
                print(f"📦 Fetched bookings response: {data}")
                # The booking service returns an array directly, or empty array if no bookings
                if isinstance(data, list):
                    return data
                # Handle case where it might be wrapped
                return data.get("bookings", data.get("items", []))
            elif response.status_code == 401:
                print(f"⚠️ Booking service requires authentication (401). Cannot fetch bookings without JWT token.")
                return []
            else:
                print(f"⚠️ Booking service returned status {response.status_code}: {response.text}")
                return []
    except httpx.ConnectError as e:
        print(f"⚠️ Could not connect to booking service: {e}")
        return []
    except Exception as e:
        print(f"⚠️ Could not fetch bookings: {e}")
    return []

def normalize_booking_date(date_value) -> Optional[str]:
    """Normalize booking date from ISO string, Date object, or string to YYYY-MM-DD format"""
    if not date_value:
        return None
    
    # If it's already a string in YYYY-MM-DD format, return as-is
    if isinstance(date_value, str):
        # Check if it's an ISO string (contains 'T' or 'Z')
        if 'T' in date_value or 'Z' in date_value:
            # Extract date part directly from ISO string WITHOUT timezone conversion
            # This prevents date shifting due to timezone differences
            try:
                # Extract just the date part before 'T' or space
                date_part = date_value.split('T')[0].split(' ')[0]
                # Validate it's in YYYY-MM-DD format
                if re.match(r'^\d{4}-\d{2}-\d{2}$', date_part):
                    return date_part
                else:
                    # Try to extract YYYY-MM-DD pattern from the string
                    match = re.search(r'(\d{4}-\d{2}-\d{2})', date_value)
                    if match:
                        return match.group(1)
                    print(f"⚠️ Could not extract date from ISO string: {date_value}")
                    return None
            except Exception as e:
                # If extraction fails, try to extract YYYY-MM-DD pattern
                match = re.search(r'(\d{4}-\d{2}-\d{2})', date_value)
                if match:
                    return match.group(1)
                print(f"⚠️ Could not parse date: {date_value}, error: {e}")
                return None
        # If it's already YYYY-MM-DD format, return as-is
        elif re.match(r'^\d{4}-\d{2}-\d{2}$', date_value):
            return date_value
        # Otherwise try to normalize it using the other function
        else:
            return normalize_date(date_value)
    
    # If it's a datetime object, format it (use date() to avoid timezone issues)
    elif isinstance(date_value, datetime):
        return date_value.date().strftime("%Y-%m-%d")
    
    return None

def normalize_date(date_str: str) -> Optional[str]:
    """Normalize various date formats to YYYY-MM-DD format"""
    if not date_str:
        return None
    
    # Remove common words
    date_str = re.sub(r'\b(to|until|through|till|-)\b', ' to ', date_str, flags=re.IGNORECASE)
    date_str = date_str.strip()
    
    # Get current year for dates without year
    current_year = datetime.now().year
    current_month = datetime.now().month
    
    # Try to parse common formats
    formats_with_year = [
        "%Y-%m-%d",           # 2025-11-17
        "%m/%d/%Y",           # 11/17/2025
        "%d/%m/%Y",           # 17/11/2025
        "%B %d, %Y",          # November 17, 2025
        "%b %d, %Y",          # Nov 17, 2025
        "%d %b %Y",           # 17 Nov 2025
        "%d %B %Y",           # 17 November 2025
        "%B %d %Y",           # November 17 2025 (no comma)
        "%b %d %Y",           # Nov 17 2025 (no comma)
    ]
    
    # Formats without year (will infer year)
    formats_without_year = [
        "%B %d",              # November 17
        "%b %d",              # Nov 17
        "%m/%d",              # 11/17
        "%d/%m",              # 17/11
    ]
    
    # Handle date ranges
    if " to " in date_str:
        parts = date_str.split(" to ", 1)
        start = None
        end = None
        
        # Try parsing start date
        for fmt in formats_with_year:
            try:
                parsed = datetime.strptime(parts[0].strip(), fmt)
                start = parsed.strftime("%Y-%m-%d")
                break
            except:
                continue
        
        # If not found, try without year
        if not start:
            for fmt in formats_without_year:
                try:
                    parsed = datetime.strptime(parts[0].strip(), fmt)
                    # If month has passed, use next year
                    if parsed.month < current_month or (parsed.month == current_month and parsed.day < datetime.now().day):
                        parsed = parsed.replace(year=current_year + 1)
                    else:
                        parsed = parsed.replace(year=current_year)
                    start = parsed.strftime("%Y-%m-%d")
                    break
                except:
                    continue
        
        # Try parsing end date
        for fmt in formats_with_year:
            try:
                parsed = datetime.strptime(parts[1].strip(), fmt)
                end = parsed.strftime("%Y-%m-%d")
                break
            except:
                continue
        
        # If not found, try without year
        if not end:
            for fmt in formats_without_year:
                try:
                    parsed = datetime.strptime(parts[1].strip(), fmt)
                    # If month has passed, use next year
                    if parsed.month < current_month or (parsed.month == current_month and parsed.day < datetime.now().day):
                        parsed = parsed.replace(year=current_year + 1)
                    else:
                        parsed = parsed.replace(year=current_year)
                    end = parsed.strftime("%Y-%m-%d")
                    break
                except:
                    continue
        
        # If we have start but not end, infer end from start
        if start and not end:
            try:
                start_date = datetime.strptime(start, "%Y-%m-%d")
                # Default to 2 days later if no end date
                end_date = start_date + timedelta(days=2)
                end = end_date.strftime("%Y-%m-%d")
            except:
                pass
        
        if start and end:
            return f"{start} to {end}"
        elif start:
            return start
        elif end:
            return end
    
    # Single date
    for fmt in formats_with_year:
        try:
            return datetime.strptime(date_str.strip(), fmt).strftime("%Y-%m-%d")
        except:
            continue
    
    # Try without year
    for fmt in formats_without_year:
        try:
            parsed = datetime.strptime(date_str.strip(), fmt)
            # If month has passed, use next year
            if parsed.month < current_month or (parsed.month == current_month and parsed.day < datetime.now().day):
                parsed = parsed.replace(year=current_year + 1)
            else:
                parsed = parsed.replace(year=current_year)
            return parsed.strftime("%Y-%m-%d")
        except:
            continue
    
    return date_str  # Return as-is if can't parse

@router.post("/chatbot", response_model=ChatMessageOut)
async def chatbot(req: ChatMessageIn):
    try:
        print(f"📥 Received chat request from traveler {req.traveler_id}: {req.message}")
        print(f"📦 Booking context: {req.booking_context}")
        
        # 1️⃣ Save user message
        await save_chat_message(req.traveler_id, "user", req.message, None)

        # 2️⃣ Check if user wants to fetch booking history
        message_lower = req.message.lower()
        fetch_bookings = any(keyword in message_lower for keyword in [
            "booking", "travel history", "recent booking", "my booking", 
            "pull booking", "check booking", "past booking"
        ])
        
        # 3️⃣ Get booking context (from frontend or fetch if needed)
        booking_context = ""
        if req.booking_context:
            # Use booking data passed from frontend
            location = req.booking_context.get("location", "Unknown")
            start_date = req.booking_context.get("startDate") or req.booking_context.get("start_date")
            end_date = req.booking_context.get("endDate") or req.booking_context.get("end_date")
            
            # Normalize dates - extract YYYY-MM-DD from ISO strings or date objects
            start_date_normalized = normalize_booking_date(start_date)
            end_date_normalized = normalize_booking_date(end_date)
            
            booking_context = f"\nRecent Booking: Location: {location}"
            if start_date_normalized and end_date_normalized:
                booking_context += f", Dates: {start_date_normalized} to {end_date_normalized}"
            booking_context += "\n"
        elif fetch_bookings:
            # Try to fetch from booking service (may fail without auth)
            bookings = await fetch_traveler_bookings(req.traveler_id)
            # Handle different response formats: list, dict with 'bookings' key, or dict with 'items' key
            booking_list = []
            if isinstance(bookings, list):
                booking_list = bookings
            elif isinstance(bookings, dict):
                booking_list = bookings.get("bookings", bookings.get("items", []))
            
            # Filter for pending bookings if user specifically asked for pending ones
            if "pending" in message_lower or "status" in message_lower:
                booking_list = [b for b in booking_list if b.get("status", "").lower() == "pending"]
            
            if booking_list and len(booking_list) > 0:
                recent = booking_list[0]
                location = recent.get("location") or recent.get("title", "Unknown")
                start_date = recent.get("startDate") or recent.get("start_date")
                end_date = recent.get("endDate") or recent.get("end_date")
                
                # Normalize dates - extract YYYY-MM-DD from ISO strings or date objects
                start_date_normalized = normalize_booking_date(start_date)
                end_date_normalized = normalize_booking_date(end_date)
                
                # Only add booking context if we have valid location and dates
                if location and location != "Unknown" and start_date_normalized and end_date_normalized:
                    booking_context = f"\nRecent Booking: Location: {location}"
                    booking_context += f", Dates: {start_date_normalized} to {end_date_normalized}"
                    booking_context += "\n"
                else:
                    booking_context = "\nNo recent bookings with complete information found.\n"
            else:
                booking_context = "\nNo recent bookings found.\n"

        # 4️⃣ Build conversation history
        prior = await get_traveler_conversation(req.traveler_id)
        history_text = "\n".join(f"{m['role']}: {m['content']}" for m in prior[-6:])

        # 5️⃣ Build improved Ollama prompt with date format examples
        # If we have booking context with dates, prioritize using those
        booking_dates_instruction = ""
        if booking_context and "Recent Booking" in booking_context and "Dates:" in booking_context:
            # Extract the dates from booking context to show in prompt
            dates_match = re.search(r'Dates:\s*([^\n]+)', booking_context)
            if dates_match:
                booking_dates = dates_match.group(1).strip()
                booking_dates_instruction = f"\nCRITICAL: The user has a booking with these EXACT dates: {booking_dates}. You MUST use these dates in the 'dates' field. Do NOT modify or parse them - use them exactly as shown: {booking_dates}"
        
        prompt = f"""Extract travel information from the conversation. Return ONLY valid JSON with these keys: location, dates, party_type, budget, interests, dietary_filters.

IMPORTANT RULES:
1. The 'dates' field MUST be in format "YYYY-MM-DD to YYYY-MM-DD" (e.g., "2025-11-20 to 2025-11-21")
2. Dates must include year, month, and day - all three parts are required
3. Use hyphens (-) to separate year, month, and day
4. Use " to " (space-to-space) to separate start and end dates
5. If booking context provides dates, use those EXACT dates

{booking_dates_instruction}

Date format examples (all valid):
- "2025-11-17 to 2025-11-19" ✓ CORRECT
- "2025-11-20 to 2025-11-21" ✓ CORRECT
- "2025-11-17 to 2025-11-19" ✓ CORRECT

WRONG formats (DO NOT USE):
- "2025 to 11" ✗ WRONG - missing day
- "2025-11" ✗ WRONG - missing day and end date
- "11 to 20" ✗ WRONG - missing year and month format

{booking_context}Conversation:
{history_text}
User: {req.message}

Return JSON only, no other text. The dates field MUST be in "YYYY-MM-DD to YYYY-MM-DD" format with all parts (year, month, day) for both start and end dates."""

        # 4️⃣ Extract structured trip info from Mistral
        # Wrap in try-except to handle Ollama connection errors gracefully
        try:
            parsed: Dict[str, Any] = await extract_trip_json(prompt)
        except Exception as ollama_error:
            print(f"⚠️ Ollama error: {ollama_error}")
            # If Ollama is unavailable, provide a simple response
            reply = "I'm having trouble connecting to the AI service right now. Please try again in a moment, or provide your travel details directly (destination and dates)."
            await save_chat_message(req.traveler_id, "assistant", reply, None)
            return ChatMessageOut(reply=reply)

        location = parsed.get("location")
        dates_raw = parsed.get("dates")
        party_type = parsed.get("party_type") or "couple"

        # Debug logging
        print(f"🔍 Parsed from Ollama: location={location}, dates_raw={dates_raw}, party_type={party_type}")

        # If location or dates are missing, try to use booking context
        if not location and booking_context and "Recent Booking" in booking_context:
            try:
                # Extract location from booking context
                loc_match = re.search(r'Location:\s*([^,]+)', booking_context)
                if loc_match:
                    location = loc_match.group(1).strip()
                    print(f"📍 Extracted location from booking context: {location}")
            except Exception as e:
                print(f"⚠️ Error extracting location from booking context: {e}")
        
        if not dates_raw and booking_context and "Recent Booking" in booking_context:
            try:
                # Extract dates from booking context (format: "Dates: 2025-11-20 to 2025-11-21" or ISO strings)
                dates_match = re.search(r'Dates:\s*([^\n]+)', booking_context)
                if dates_match:
                    dates_raw = dates_match.group(1).strip()
                    # If it's an ISO string, normalize it
                    if 'T' in dates_raw or 'Z' in dates_raw:
                        # Extract dates from ISO strings like "2025-11-20T00:00:00.000Z to 2025-11-21T00:00:00.000Z"
                        iso_dates = re.findall(r'(\d{4}-\d{2}-\d{2})', dates_raw)
                        if len(iso_dates) >= 2:
                            dates_raw = f"{iso_dates[0]} to {iso_dates[1]}"
                        elif len(iso_dates) == 1:
                            dates_raw = iso_dates[0]
                    print(f"📅 Extracted dates from booking context: {dates_raw}")
            except Exception as e:
                print(f"⚠️ Error extracting dates from booking context: {e}")

        # Normalize dates format - handle both string and list formats
        dates = None
        
        # First, prioritize dates from booking context if available
        if not dates_raw and booking_context and "Recent Booking" in booking_context and "Dates:" in booking_context:
            dates_match = re.search(r'Dates:\s*([^\n]+)', booking_context)
            if dates_match:
                dates_raw = dates_match.group(1).strip()
                # If it's an ISO string, normalize it
                if 'T' in dates_raw or 'Z' in dates_raw:
                    # Extract dates from ISO strings like "2025-11-20T00:00:00.000Z to 2025-11-21T00:00:00.000Z"
                    iso_dates = re.findall(r'(\d{4}-\d{2}-\d{2})', dates_raw)
                    if len(iso_dates) >= 2:
                        dates_raw = f"{iso_dates[0]} to {iso_dates[1]}"
                    elif len(iso_dates) == 1:
                        dates_raw = iso_dates[0]
                print(f"📅 Using dates from booking context: {dates_raw}")
        
        if dates_raw:
            if isinstance(dates_raw, list):
                # Convert list to string format: ["2024-12-20", "2024-12-25"] -> "2024-12-20 to 2024-12-25"
                if len(dates_raw) >= 2:
                    dates = f"{dates_raw[0]} to {dates_raw[1]}"
                elif len(dates_raw) == 1:
                    dates = dates_raw[0]
            elif isinstance(dates_raw, str):
                # Validate the format first - must be "YYYY-MM-DD to YYYY-MM-DD"
                if re.match(r'^\d{4}-\d{2}-\d{2}\s+to\s+\d{4}-\d{2}-\d{2}$', dates_raw):
                    # Already in correct format
                    dates = dates_raw
                    print(f"✅ Dates already in correct format: {dates}")
                elif " to " in dates_raw and dates_raw.count(" to ") > 1:
                    # Handle format like "2025 to 11 to 21 to 2025 to 11 to 22"
                    parts = dates_raw.split(" to ")
                    if len(parts) >= 6:
                        # Reconstruct as "2025-11-21 to 2025-11-22"
                        start_date = f"{parts[0]}-{parts[1].zfill(2)}-{parts[2].zfill(2)}"
                        end_date = f"{parts[3]}-{parts[4].zfill(2)}-{parts[5].zfill(2)}"
                        dates = f"{start_date} to {end_date}"
                        print(f"📅 Fixed weird date format: {dates_raw} -> {dates}")
                    else:
                        # Try to normalize the date string normally
                        normalized = normalize_date(dates_raw)
                        dates = normalized if normalized else None
                else:
                    # Try to normalize the date string
                    normalized = normalize_date(dates_raw)
                    dates = normalized if normalized else None
                
                # Final validation - dates must be in correct format
                if dates and not re.match(r'^\d{4}-\d{2}-\d{2}\s+to\s+\d{4}-\d{2}-\d{2}$', dates):
                    print(f"⚠️ Dates not in correct format after normalization: {dates}, falling back to booking context")
                    dates = None
                
                if dates:
                    print(f"📅 Final normalized dates: {dates}")
        
        # If dates are still None or empty, try to extract from booking context one more time
        if not dates and booking_context and "Recent Booking" in booking_context and "Dates:" in booking_context:
            try:
                dates_match = re.search(r'Dates:\s*([^\n]+)', booking_context)
                if dates_match:
                    dates_raw_from_context = dates_match.group(1).strip()
                    # Extract YYYY-MM-DD pattern
                    iso_dates = re.findall(r'(\d{4}-\d{2}-\d{2})', dates_raw_from_context)
                    if len(iso_dates) >= 2:
                        dates = f"{iso_dates[0]} to {iso_dates[1]}"
                        print(f"📅 Extracted dates from booking context (fallback): {dates}")
                    elif len(iso_dates) == 1:
                        # Single date, add one day as end date
                        start_dt = datetime.strptime(iso_dates[0], "%Y-%m-%d")
                        end_dt = start_dt + timedelta(days=1)
                        dates = f"{iso_dates[0]} to {end_dt.strftime('%Y-%m-%d')}"
                        print(f"📅 Extracted single date, added end date: {dates}")
            except Exception as e:
                print(f"⚠️ Error extracting dates from booking context (fallback): {e}")
        
        # If dates are still None, try to extract from the original message
        if not dates and req.message:
            # Try direct extraction from message (fallback)
            message_lower = req.message.lower()
            # Look for patterns like "november 17 to november 19" or "nov 17 to nov 19"
            date_pattern = r'(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+(\d{1,2})\s+to\s+(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+(\d{1,2})'
            match = re.search(date_pattern, message_lower, re.IGNORECASE)
            if match:
                try:
                    # Extract and normalize
                    extracted = f"{match.group(1)} {match.group(2)} to {match.group(3)} {match.group(4)}"
                    dates = normalize_date(extracted)
                    print(f"📅 Extracted dates from message: {extracted} -> {dates}")
                except Exception as e:
                    print(f"⚠️ Error extracting dates from message: {e}")

        # 5️⃣ Generate itinerary if we have enough info
        if location and dates:
            try:
                print(f"🔍 Before final validation - location: {location}, dates: {dates}")
                
                # Validate dates format - must be "YYYY-MM-DD to YYYY-MM-DD"
                if not re.match(r'^\d{4}-\d{2}-\d{2}\s+to\s+\d{4}-\d{2}-\d{2}$', dates):
                    print(f"⚠️ Dates not in correct format, attempting to fix: {dates}")
                    
                    # Try to normalize if not in correct format
                    if " to " in dates:
                        parts = dates.split(" to ")
                        if len(parts) == 2:
                            start_part = normalize_date(parts[0].strip()) if parts[0].strip() else None
                            end_part = normalize_date(parts[1].strip()) if parts[1].strip() else None
                            if start_part and end_part:
                                dates = f"{start_part} to {end_part}"
                                print(f"📅 Normalized dates: {dates}")
                            elif start_part:
                                # Only start date, add end date (1 day later)
                                try:
                                    start_dt = datetime.strptime(start_part, "%Y-%m-%d")
                                    end_dt = start_dt + timedelta(days=1)
                                    dates = f"{start_part} to {end_dt.strftime('%Y-%m-%d')}"
                                    print(f"📅 Added end date: {dates}")
                                except:
                                    raise ValueError(f"Could not parse start date: {start_part}")
                            else:
                                raise ValueError(f"Could not normalize date parts: {parts}")
                        else:
                            raise ValueError(f"Invalid dates format - expected 'start to end', got: {dates}")
                    else:
                        # Single date, normalize it and add end date
                        normalized = normalize_date(dates.strip())
                        if normalized:
                            try:
                                start_dt = datetime.strptime(normalized, "%Y-%m-%d")
                                end_dt = start_dt + timedelta(days=1)
                                dates = f"{normalized} to {end_dt.strftime('%Y-%m-%d')}"
                                print(f"📅 Added end date to single date: {dates}")
                            except:
                                raise ValueError(f"Could not parse normalized date: {normalized}")
                        else:
                            raise ValueError(f"Could not normalize date: {dates}")
                
                # Final validation
                if not re.match(r'^\d{4}-\d{2}-\d{2}\s+to\s+\d{4}-\d{2}-\d{2}$', dates):
                    raise ValueError(f"Dates still not in correct format after normalization: {dates}. Expected 'YYYY-MM-DD to YYYY-MM-DD'")
                
                # Validate that dates can be parsed
                try:
                    parts = dates.split(" to ")
                    start_dt = datetime.strptime(parts[0].strip(), "%Y-%m-%d")
                    end_dt = datetime.strptime(parts[1].strip(), "%Y-%m-%d")
                    if end_dt <= start_dt:
                        raise ValueError(f"End date must be after start date: {dates}")
                except ValueError as e:
                    if "does not match format" in str(e) or "time data" in str(e):
                        raise ValueError(f"Invalid date format in: {dates}. Error: {e}")
                    raise
                
                print(f"✅ Final validated dates format for itinerary: {dates}")
                
                prefs = TravelerPreferences(
                    budget=parsed.get("budget") or "medium",
                    interests=parsed.get("interests") or [],
                    dietary_filters=parsed.get("dietary_filters") or [],
                )

                print(f"🚀 Starting itinerary generation for {location} on {dates}")
                itinerary = await build_itinerary(location, dates, party_type, prefs)
                print(f"✅ Itinerary generated successfully")
                
                # Format dates nicely for display - use the actual dates from itinerary if available
                # This ensures we show the correct dates that were actually used
                if itinerary and itinerary.day_by_day_plan and len(itinerary.day_by_day_plan) > 0:
                    first_date = itinerary.day_by_day_plan[0].date
                    last_date = itinerary.day_by_day_plan[-1].date
                    display_dates = f"{first_date} to {last_date}"
                else:
                    # Fallback to the dates we used
                    display_dates = dates.replace(" to ", " to ")
                
                reply = f"I built a {party_type} itinerary for {location} ({display_dates}). Here's your personalized travel plan!"
                # Convert Pydantic model to dict for storage
                itinerary_dict = itinerary.dict() if hasattr(itinerary, 'dict') else (itinerary.model_dump() if hasattr(itinerary, 'model_dump') else itinerary)
                await save_chat_message(req.traveler_id, "assistant", reply, itinerary_dict)

                return ChatMessageOut(reply=reply, itinerary=itinerary)
            except Exception as itinerary_error:
                import traceback
                error_trace = traceback.format_exc()
                print(f"⚠️ Itinerary generation error: {itinerary_error}")
                print(f"📋 Full traceback:\n{error_trace}")
                # Fallback response if itinerary generation fails
                # Format dates nicely for display
                try:
                    display_dates = dates.replace(" to ", " to ") if dates else "the specified dates"
                    reply = f"Great! I see you want to travel to {location} on {display_dates}. I encountered an issue generating your itinerary: {str(itinerary_error)[:100]}. Please try again."
                except:
                    reply = f"Great! I see you want to travel to {location}. I encountered an issue generating your itinerary. Please try again or provide your travel details in a different format."
                await save_chat_message(req.traveler_id, "assistant", reply, None)
                return ChatMessageOut(reply=reply)

        # 6️⃣ If missing info, provide helpful guidance
        missing = []
        if not location:
            missing.append("destination")
        if not dates:
            missing.append("travel dates")

        if fetch_bookings and booking_context and "Recent Booking" in booking_context:
            # If user asked for booking and we found one, suggest using it
            reply = f"I found your recent booking! {booking_context.strip()}. Would you like me to plan an itinerary for this trip, or are you planning a different one?"
        elif missing:
            reply = f"Almost there—please share your {', '.join(missing)}. You can say something like 'Miami, November 17 to November 19' or '2025-11-17 to 2025-11-19'."
        else:
            reply = "I need a bit more information. Please provide your destination and travel dates."
        
        await save_chat_message(req.traveler_id, "assistant", reply, None)
        return ChatMessageOut(reply=reply)

    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        import traceback
        error_msg = str(e)
        error_trace = traceback.format_exc()
        print(f"❌ Error in /chatbot: {error_msg}")
        print(f"📋 Full traceback:\n{error_trace}")
        # Return a user-friendly error message instead of crashing with 500
        try:
            await save_chat_message(req.traveler_id, "assistant", "I encountered an error. Please try again or rephrase your request.", None)
        except:
            pass  # If even saving fails, just continue
        # Return error response instead of raising HTTPException to avoid 500
        return ChatMessageOut(reply="I encountered an error processing your request. Please try again or rephrase your message.")


# -----------------------------
# Chat History Endpoint
# -----------------------------
@router.get("/chatbot/history/{traveler_id}")
async def history(traveler_id: str):
    msgs = await get_traveler_conversation(traveler_id)
    return {"messages": msgs}

# -----------------------------
# Clear Chat History Endpoint
# -----------------------------
@router.delete("/chatbot/history/{traveler_id}")
async def clear_history(traveler_id: str):
    await clear_traveler_conversation(traveler_id)
    return {"message": "Chat history cleared"}


# -----------------------------
# Health Check Endpoint
# -----------------------------
@router.get("/health")
async def health():
    return {"status": "ok"}

# Include the router in the app
app.include_router(router)
