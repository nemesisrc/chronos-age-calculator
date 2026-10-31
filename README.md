# Chronos — Precision Age & Date Comparison Calculator

A modern, full-stack chronological age calculator, cumulative time analyzer, next-birthday tracker, and two-person age gap comparison studio built with **Next.js 15**, **React 19**, **Tailwind CSS v4**, and a **Python FastAPI** backend.

**Website Link** https://chronos-age-calculator.ai.studio
**Repository:** [https://github.com/nemesisrc/chronos-age-calculator](https://github.com/nemesisrc/chronos-age-calculator)  
**Author:** Rajdeep Chakraborty (`nemesis`)

---

## Key Features

- **Exact Chronological Age Breakdown**: Calculates exact years, months, and days between any date of birth (from `1850` onward) and any target reference date, accurately handling leap years (`Feb 29`) and variable month lengths (`28`, `29`, `30`, and `31` days).
- **Cumulative Time Equivalents & Live Seconds Counter**: Converts total elapsed lifespan into single-unit totals—total months, total weeks, total calendar days, total hours, total minutes, and a real-time ticking seconds counter with pause/resume controls.
- **Next Birthday Countdown & Year Progress**: Displays the exact number of days (and months + extra days) remaining until the next birthday, the upcoming age, celebration weekday, and a visual completion bar for the current year of life.
- **Two-Person Age Gap Comparison**: Compares two individuals' dates of birth (`POST /api/compare`) to identify who is older and compute the exact chronological difference in years, months, days, total days, total weeks, and total hours.
- **Saved Profiles & Quick Reference Presets**: Save custom birth profiles to a searchable directory for instant one-click loading, or test notable reference dates (`Y2K`, `Leap Day 2004`, `Apollo 11`).
- **Dual-Theme (Light / Dark Mode) Interface**: Engineered with Tailwind CSS v4 class-based dark mode, tabular monospace numerals (`JetBrains Mono`), and accessible form controls.

---

## Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS v4, Lucide Icons |
| **Typography** | `Plus Jakarta Sans` (Display), `DM Sans` (UI Body), `JetBrains Mono` (Tabular Numerals) |
| **Backend** | Python 3.10+, FastAPI, Pydantic v2, Next.js API Route Bridge (`/api/calculate`, `/api/compare`) |
| **Testing** | Node.js Built-in Test Runner (`node:test`, `node:assert/strict`) via `tsx` |

---

## Project Structure

```text
.
├── app/
│   ├── api/
│   │   ├── calculate/route.ts       # POST /api/calculate route bridging to Python FastAPI engine
│   │   └── compare/route.ts         # POST /api/compare route bridging to Python FastAPI engine
│   ├── globals.css                  # Tailwind CSS v4 setup & custom dark variant
│   ├── layout.tsx                   # Root layout, Google Fonts, and OpenGraph metadata
│   └── page.tsx                     # Main Chronos calculator workspace & theme controller
├── backend/
│   ├── main.py                      # FastAPI application, Pydantic schemas & CLI bridge
│   └── requirements.txt             # Python dependencies (fastapi, uvicorn, pydantic)
├── components/
│   ├── AgeBreakdownPanel.tsx        # Chronological figures, cumulative time units & next birthday card
│   └── CompareAndProfilesPanel.tsx  # Two-date age gap calculator & searchable saved profiles table
└── lib/
    ├── age-calculator.ts            # Pure calendar math & chronological calculation module
    └── age-calculator.test.ts       # Automated unit test suite (node:test)
```

---

## Getting Started

### 1. Install Frontend Dependencies

```bash
npm install
```

### 2. Optional: Set Up Python FastAPI Environment

The application includes a hybrid execution bridge so Next.js API routes execute `backend/main.py` directly via `python3`, with an identical TypeScript fallback engine (`lib/age-calculator.ts`). To run the standalone FastAPI ASGI server with Swagger UI (`/docs`):

```bash
pip install -r backend/requirements.txt
uvicorn backend.main:app --reload --port 8000
```

### 3. Start the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Running Tests & Verification

Run the unit test suite covering calendar month-borrowing, leap-year (`Feb 29`) edge cases, exact birthday detection, date validation, and two-date comparisons:

```bash
npx --yes tsx --test lib/age-calculator.test.ts
```

Run ESLint and production build checks:

```bash
npm run lint
npm run build
```

---

## API Reference

### `POST /api/calculate`

Calculates chronological age, cumulative time units, birth facts, and next-birthday countdown.

**Request Body:**

```json
{
  "birth_date": "1996-05-14",
  "target_date": "2026-10-31",
  "birth_time": "08:30"
}
```

**Response (`200 OK`):**

```json
{
  "input": {
    "birth_date": "1996-05-14",
    "target_date": "2026-10-31",
    "birth_time": "08:30"
  },
  "chronological": {
    "years": 30,
    "months": 5,
    "days": 17,
    "is_birthday_today": false
  },
  "totals": {
    "total_months": 365,
    "total_weeks": 1589,
    "remaining_days_after_weeks": 4,
    "total_days": 11127,
    "total_hours": 267048,
    "total_minutes": 16022880,
    "total_seconds": 961372800,
    "leap_days_experienced": 7
  },
  "next_birthday": {
    "date": "2027-05-14",
    "formatted_date": "May 14, 2027",
    "weekday": "Friday",
    "days_remaining": 195,
    "months_remaining": 6,
    "extra_days_remaining": 13,
    "turning_age": 31
  }
}
```

### `POST /api/compare`

Calculates the exact chronological age gap between two dates of birth.

**Request Body:**

```json
{
  "first_birth_date": "1992-03-10",
  "second_birth_date": "1996-05-14",
  "first_name": "Elena Vance",
  "second_name": "Marcus Sterling"
}
```

---

## Author

Built by **Rajdeep Chakraborty (`nemesis`)** — [https://github.com/nemesisrc/chronos-age-calculator](https://github.com/nemesisrc/chronos-age-calculator)
