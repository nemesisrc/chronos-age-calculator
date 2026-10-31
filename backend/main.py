"""
Chronos Age Calculation Engine & FastAPI Backend
Supports both:
1. Full FastAPI ASGI execution (`uvicorn backend.main:app --reload --port 8000`)
2. Direct CLI / subprocess execution via Python 3 standard library (`python3 backend/main.py --payload '...'`)
   so Next.js API routes can execute the exact Python backend calculation in environments without pip packages.
"""

from __future__ import annotations
import calendar
import datetime
import json
import math
import sys
from typing import Any, Dict, List, Optional

WESTERN_ZODIAC = [
    ("Capricorn", (1, 19), "Earth", "Saturn"),
    ("Aquarius", (2, 18), "Air", "Uranus"),
    ("Pisces", (3, 20), "Water", "Neptune"),
    ("Aries", (4, 19), "Fire", "Mars"),
    ("Taurus", (5, 20), "Earth", "Venus"),
    ("Gemini", (6, 20), "Air", "Mercury"),
    ("Cancer", (7, 22), "Water", "Moon"),
    ("Leo", (8, 22), "Fire", "Sun"),
    ("Virgo", (9, 22), "Earth", "Mercury"),
    ("Libra", (10, 22), "Air", "Venus"),
    ("Scorpio", (11, 21), "Water", "Pluto"),
    ("Sagittarius", (12, 21), "Fire", "Jupiter"),
    ("Capricorn", (12, 31), "Earth", "Saturn"),
]

CHINESE_ZODIAC = [
    "Monkey",
    "Rooster",
    "Dog",
    "Pig",
    "Rat",
    "Ox",
    "Tiger",
    "Rabbit",
    "Dragon",
    "Snake",
    "Horse",
    "Goat",
]

PLANET_ORBITAL_RATIOS = [
    {"planet": "Mercury", "orbital_days": 87.97, "period_label": "88 Earth days"},
    {"planet": "Venus", "orbital_days": 224.70, "period_label": "225 Earth days"},
    {"planet": "Earth", "orbital_days": 365.256, "period_label": "365.25 Earth days"},
    {"planet": "Mars", "orbital_days": 686.98, "period_label": "687 Earth days"},
    {"planet": "Jupiter", "orbital_days": 4332.59, "period_label": "11.86 Earth years"},
    {"planet": "Saturn", "orbital_days": 10759.22, "period_label": "29.45 Earth years"},
]


def get_western_zodiac(month: int, day: int) -> Dict[str, str]:
    for sign, (end_month, end_day), element, ruler in WESTERN_ZODIAC:
        if (month == end_month and day <= end_day) or (month < end_month):
            return {"sign": sign, "element": element, "ruling_planet": ruler}
    return {"sign": "Capricorn", "element": "Earth", "ruling_planet": "Saturn"}


def get_chinese_zodiac(year: int) -> str:
    return CHINESE_ZODIAC[year % 12]


def get_generation(year: int) -> str:
    if year >= 2025:
        return "Generation Beta"
    if year >= 2013:
        return "Generation Alpha"
    if year >= 1997:
        return "Generation Z"
    if year >= 1981:
        return "Millennial (Gen Y)"
    if year >= 1965:
        return "Generation X"
    if year >= 1946:
        return "Baby Boomer"
    return "Silent / Traditionalist"


def safe_birthday_in_year(birth_date: datetime.date, target_year: int) -> datetime.date:
    try:
        return datetime.date(target_year, birth_date.month, birth_date.day)
    except ValueError:
        # Handle Feb 29 on non-leap years -> Feb 28
        return datetime.date(target_year, 2, 28)


def calculate_age_payload(
    birth_date_str: str,
    target_date_str: Optional[str] = None,
    birth_time_str: Optional[str] = "00:00",
) -> Dict[str, Any]:
    try:
        birth_date = datetime.date.fromisoformat(birth_date_str)
    except ValueError as exc:
        raise ValueError(f"Invalid birth_date format '{birth_date_str}'. Expected YYYY-MM-DD.") from exc

    if target_date_str:
        try:
            target_date = datetime.date.fromisoformat(target_date_str)
        except ValueError as exc:
            raise ValueError(f"Invalid target_date format '{target_date_str}'. Expected YYYY-MM-DD.") from exc
    else:
        target_date = datetime.date.today()

    if birth_date > target_date:
        raise ValueError("Date of birth cannot be after the target calculation date.")

    if birth_date.year < 1850:
        raise ValueError("Date of birth must be in or after the year 1850.")

    # Parse birth time
    hour, minute = 0, 0
    if birth_time_str and ":" in birth_time_str:
        parts = birth_time_str.strip().split(":")
        try:
            hour = max(0, min(23, int(parts[0])))
            minute = max(0, min(59, int(parts[1])))
        except ValueError:
            hour, minute = 0, 0

    # Exact calendar years, months, days calculation
    years = target_date.year - birth_date.year
    months = target_date.month - birth_date.month
    days = target_date.day - birth_date.day

    if days < 0:
        months -= 1
        prev_month = target_date.month - 1 if target_date.month > 1 else 12
        prev_year = target_date.year if target_date.month > 1 else target_date.year - 1
        days_in_prev_month = calendar.monthrange(prev_year, prev_month)[1]
        days = days_in_prev_month - min(birth_date.day, days_in_prev_month) + target_date.day

    if months < 0:
        years -= 1
        months += 12

    # Total time metrics including birth time
    birth_dt = datetime.datetime(birth_date.year, birth_date.month, birth_date.day, hour, minute, 0)
    target_dt = datetime.datetime(target_date.year, target_date.month, target_date.day, hour, minute, 0)
    delta_days = (target_date - birth_date).days
    total_weeks = delta_days // 7
    remaining_days_after_weeks = delta_days % 7
    total_months = years * 12 + months
    total_hours = delta_days * 24
    total_minutes = total_hours * 60
    total_seconds = total_minutes * 60

    # Next birthday calculation
    this_year_bday = safe_birthday_in_year(birth_date, target_date.year)
    if this_year_bday > target_date:
        next_bday = this_year_bday
        turning_age = target_date.year - birth_date.year
    elif this_year_bday == target_date:
        next_bday = this_year_bday
        turning_age = target_date.year - birth_date.year
    else:
        next_bday = safe_birthday_in_year(birth_date, target_date.year + 1)
        turning_age = (target_date.year + 1) - birth_date.year

    days_until_next_birthday = (next_bday - target_date).days
    next_bday_months = (next_bday.year - target_date.year) * 12 + (next_bday.month - target_date.month)
    next_bday_rem_days = next_bday.day - target_date.day
    if next_bday_rem_days < 0:
        next_bday_months -= 1
        prev_m = next_bday.month - 1 if next_bday.month > 1 else 12
        prev_y = next_bday.year if next_bday.month > 1 else next_bday.year - 1
        next_bday_rem_days += calendar.monthrange(prev_y, prev_m)[1]

    # Milestones
    milestone_defs = [
        {"title": "1,000 Days Old", "category": "Days", "days_offset": 1000},
        {"title": "5,000 Days Old", "category": "Days", "days_offset": 5000},
        {"title": "10,000 Days Old", "category": "Days", "days_offset": 10000},
        {"title": "15,000 Days Old", "category": "Days", "days_offset": 15000},
        {"title": "20,000 Days Old", "category": "Days", "days_offset": 20000},
        {"title": "500 Million Seconds", "category": "Seconds", "days_offset": round(500_000_000 / 86400)},
        {"title": "1 Billion Seconds", "category": "Seconds", "days_offset": round(1_000_000_000 / 86400)},
        {"title": "2 Billion Seconds", "category": "Seconds", "days_offset": round(2_000_000_000 / 86400)},
    ]

    milestones = []
    for m in milestone_defs:
        m_date = birth_date + datetime.timedelta(days=m["days_offset"])
        diff_from_target = (m_date - target_date).days
        milestones.append(
            {
                "title": m["title"],
                "category": m["category"],
                "date": m_date.isoformat(),
                "formatted_date": m_date.strftime("%b %d, %Y"),
                "achieved": diff_from_target <= 0,
                "days_delta": diff_from_target,
            }
        )

    # Planetary ages
    planetary_ages = []
    for p in PLANET_ORBITAL_RATIOS:
        p_age = round(delta_days / p["orbital_days"], 2)
        next_whole = math.floor(delta_days / p["orbital_days"]) + 1
        days_to_next = max(1, round(next_whole * p["orbital_days"] - delta_days))
        planetary_ages.append(
            {
                "planet": p["planet"],
                "age": p_age,
                "period_label": p["period_label"],
                "next_birthday_in_days": days_to_next,
            }
        )

    zodiac = get_western_zodiac(birth_date.month, birth_date.day)
    leap_years_lived = sum(
        1 for y in range(birth_date.year, target_date.year + 1)
        if calendar.isleap(y) and datetime.date(y, 2, 29) >= birth_date and datetime.date(y, 2, 29) <= target_date
    )

    return {
        "engine": "FastAPI Python 3.10 Chronos Engine",
        "input": {
            "birth_date": birth_date.isoformat(),
            "target_date": target_date.isoformat(),
            "birth_time": f"{hour:02d}:{minute:02d}",
        },
        "chronological": {
            "years": years,
            "months": months,
            "days": days,
            "is_birthday_today": days_until_next_birthday == 0,
        },
        "totals": {
            "total_months": total_months,
            "total_weeks": total_weeks,
            "remaining_days_after_weeks": remaining_days_after_weeks,
            "total_days": delta_days,
            "total_hours": total_hours,
            "total_minutes": total_minutes,
            "total_seconds": total_seconds,
            "leap_days_experienced": leap_years_lived,
        },
        "next_birthday": {
            "date": next_bday.isoformat(),
            "formatted_date": next_bday.strftime("%B %d, %Y"),
            "weekday": next_bday.strftime("%A"),
            "days_remaining": days_until_next_birthday,
            "months_remaining": next_bday_months,
            "extra_days_remaining": next_bday_rem_days,
            "turning_age": turning_age,
        },
        "birth_facts": {
            "born_weekday": birth_date.strftime("%A"),
            "formatted_birth_date": birth_date.strftime("%B %d, %Y"),
            "day_of_year": birth_date.timetuple().tm_yday,
            "is_leap_year": calendar.isleap(birth_date.year),
            "western_zodiac": zodiac["sign"],
            "zodiac_element": zodiac["element"],
            "ruling_planet": zodiac["ruling_planet"],
            "chinese_zodiac": get_chinese_zodiac(birth_date.year),
            "generation": get_generation(birth_date.year),
        },
        "milestones": milestones,
        "planetary_ages": planetary_ages,
    }


def compare_dates_payload(
    first_birth_date: str,
    second_birth_date: str,
    first_name: str = "Person A",
    second_name: str = "Person B",
) -> Dict[str, Any]:
    d1 = datetime.date.fromisoformat(first_birth_date)
    d2 = datetime.date.fromisoformat(second_birth_date)

    if d1 <= d2:
        older_date, younger_date = d1, d2
        older_name, younger_name = first_name, second_name
    else:
        older_date, younger_date = d2, d1
        older_name, younger_name = second_name, first_name

    diff_calc = calculate_age_payload(older_date.isoformat(), younger_date.isoformat())
    return {
        "engine": "FastAPI Python 3.10 Chronos Engine",
        "older_person": older_name if d1 != d2 else "Exact Same Date",
        "younger_person": younger_name if d1 != d2 else "Exact Same Date",
        "is_same_date": d1 == d2,
        "difference": diff_calc["chronological"],
        "total_days_apart": diff_calc["totals"]["total_days"],
        "total_weeks_apart": diff_calc["totals"]["total_weeks"],
        "total_hours_apart": diff_calc["totals"]["total_hours"],
    }


# Optional FastAPI app binding when FastAPI is installed in the environment
try:
    from fastapi import FastAPI, HTTPException
    from fastapi.middleware.cors import CORSMiddleware
    from pydantic import BaseModel, Field

    app = FastAPI(
        title="Chronos Precision Age Calculator API",
        description="FastAPI backend service for chronological age calculation, milestone projections, and date comparisons.",
        version="1.0.0",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    class AgeCalculationRequest(BaseModel):
        birth_date: str = Field(..., example="1996-05-14", description="ISO 8601 date of birth (YYYY-MM-DD)")
        target_date: Optional[str] = Field(None, example="2026-10-31", description="Target date (YYYY-MM-DD)")
        birth_time: Optional[str] = Field("00:00", example="08:30", description="24-hour birth time (HH:MM)")

    class AgeComparisonRequest(BaseModel):
        first_birth_date: str = Field(..., example="1992-03-10")
        second_birth_date: str = Field(..., example="1996-05-14")
        first_name: Optional[str] = Field("Person A")
        second_name: Optional[str] = Field("Person B")

    @app.get("/api/health")
    def health_check() -> Dict[str, str]:
        return {"status": "healthy", "service": "Chronos FastAPI Backend", "python_version": sys.version.split()[0]}

    @app.post("/api/calculate")
    def calculate_age_endpoint(payload: AgeCalculationRequest) -> Dict[str, Any]:
        try:
            return calculate_age_payload(
                birth_date_str=payload.birth_date,
                target_date_str=payload.target_date,
                birth_time_str=payload.birth_time or "00:00",
            )
        except ValueError as err:
            raise HTTPException(status_code=422, detail=str(err)) from err

    @app.post("/api/compare")
    def compare_age_endpoint(payload: AgeComparisonRequest) -> Dict[str, Any]:
        try:
            return compare_dates_payload(
                first_birth_date=payload.first_birth_date,
                second_birth_date=payload.second_birth_date,
                first_name=payload.first_name or "Person A",
                second_name=payload.second_name or "Person B",
            )
        except ValueError as err:
            raise HTTPException(status_code=422, detail=str(err)) from err

except ImportError:
    app = None


if __name__ == "__main__":
    # CLI mode for direct invocation from Next.js API Route
    if len(sys.argv) >= 3 and sys.argv[1] == "--calculate":
        raw = json.loads(sys.argv[2])
        try:
            res = calculate_age_payload(
                birth_date_str=raw.get("birth_date", ""),
                target_date_str=raw.get("target_date"),
                birth_time_str=raw.get("birth_time", "00:00"),
            )
            print(json.dumps({"ok": True, "data": res}))
        except Exception as e:
            print(json.dumps({"ok": False, "error": str(e)}))
            sys.exit(1)
    elif len(sys.argv) >= 3 and sys.argv[1] == "--compare":
        raw = json.loads(sys.argv[2])
        try:
            res = compare_dates_payload(
                first_birth_date=raw.get("first_birth_date", ""),
                second_birth_date=raw.get("second_birth_date", ""),
                first_name=raw.get("first_name", "Person A"),
                second_name=raw.get("second_name", "Person B"),
            )
            print(json.dumps({"ok": True, "data": res}))
        except Exception as e:
            print(json.dumps({"ok": False, "error": str(e)}))
            sys.exit(1)
