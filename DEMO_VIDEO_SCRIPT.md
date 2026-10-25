# WindGrid — Demonstration Video Script & Presentation Guide

This guide provides the complete spoken script, slide structure, visual transitions, and recording checklist for the 10-minute video submission.

---

## Recording Checklist & Guidelines

* **Target Length:** 9:00 – 9:50 minutes (Must not exceed 10 minutes).
* **Part 1 (Customer Presentation):** ~4 to 4.5 minutes.
* **Part 2 (Technical Review):** ~4.5 to 5 minutes.
* **Format:** 1080p or 4K screen capture with clear microphone audio.
* **Platform:** Unlisted YouTube video.
* **Screen Setup:**
  * Screen 1: WindGrid Web Application (`http://127.0.0.1:5173/` or deployed URL).
  * Screen 2: Code Editor (VS Code / Antigravity IDE) and Terminal running test suites.

---

# Part 1: Customer Presentation (Energy Utility Procurement Desk)
**Duration:** ~4 minutes 30 seconds  
**Audience:** Head of Day-Ahead Power Procurement & Power Trading Team (UK Utility).  
**Tone:** Confident, analytical, domain-competent, professional.

### [0:00 – 0:45] Introduction & The Business Problem
*(Screen: WindGrid Overview dashboard, showing 15 January 2026)*

> "Good morning team. Today I am pleased to present the pilot demonstration of **WindGrid**, an analytics portal designed specifically for your day-ahead wholesale electricity procurement operations in Great Britain.
>
> As a UK utility, your procurement desk faces a daily challenge: you must purchase wholesale electricity one day before delivery to meet customer demand. Wind energy provides a massive share of your low-cost supply, but because wind output fluctuates with changing weather, you cannot rely on actual outturn—you must commit capital and place auction orders based solely on renewable forecasts.
>
> Every megawatt that wind is overforecast represents power you expected but didn't receive, forcing you into expensive short-term balancing markets. Conversely, every megawatt underforecast means unexpected surplus power.
>
> WindGrid solves this by delivering two core capabilities:
> 1. Clear day-ahead forecast visibility locked to your exact auction gate closure cutoff.
> 2. Rigorous, quantified forecast error analysis to give your traders confidence when hedging forecast risk."

### [0:45 – 1:45] Feature A: Procurement Overview & Cutoff Protection
*(Screen: Walk through the Procurement Overview tab; highlight the Context Banner, Date Picker, Cutoff Selector, and KPI Cards)*

> "Let's look at the operational dashboard. Here, we're inspecting a purchasing decision made on **15 January 2026** for delivery on **16 January 2026**.
>
> Notice the **Auction Cutoff control**: in the UK wholesale market, EPEX SPOT and Nord Pool day-ahead auctions close order books at **11:00 London time** on day D-1. WindGrid enforces strict zero look-ahead bias—it automatically selects the latest forecast run published on or before 11:00 (in this case, National Grid ESO's 09:30 run) and ignores all later updates.
>
> Across the top KPI cards, your trading desk immediately sees:
> * Expected **Peak Generation** of 15,280 MW at SP 38 (18:30 London peak evening demand).
> * Expected **Trough Generation** of 8,420 MW during the early morning.
> * Average expected wind generation of 12,150 MW.
>
> Below, the half-hourly generation profile chart and schedule give your dispatch team the exact shape of expected wind delivery across all settlement periods."

### [1:45 – 3:15] Feature B: Forecast Accuracy & Signed Bias Analysis
*(Screen: Click on 'Forecast Accuracy' tab; highlight MAE, RMSE, signed bias, dual line chart, and signed error bar chart)*

> "Now let's move to **Forecast Accuracy**, where we evaluate how that day-ahead forecast performed against actual generation published in Elexon's FUELHH dataset.
>
> To ensure mathematical clarity, WindGrid uses an industry-standard signed error convention:
> `Error = Forecast Generation - Actual Generation`
>
> That means:
> * A **positive error** indicates an **overforecast**—the forecast overestimated wind output.
> * A **negative error** indicates an **underforecast**—wind generation exceeded expectations.
>
> For 16 January delivery, we see:
> * A **Mean Absolute Error (MAE)** of **897 MW**, representing the average magnitude of error.
> * A **Root Mean Squared Error (RMSE)** of **1,124 MW**, which penalizes large forecasting excursions.
> * A **Forecast Bias of +393 MW**. This tells your procurement desk that the forecast had a net positive skew—wind underperformed the morning forecast by an average of 393 MW.
>
> In the dual-line chart, you can visually trace actual outturn (in green) against the day-ahead forecast (in blue). The signed error bar chart below instantly highlights where errors concentrated: notice the orange bars during the afternoon peak showing overforecasting, followed by cyan bars in the late evening showing underforecasting."

### [3:15 – 4:15] Feature C: Month-Wide Retrospective & Strategic Value
*(Screen: Click on 'January 2026 Retrospective' tab; show aggregate metrics and daily table)*

> "Finally, let's step back to the **January 2026 Retrospective**, analyzing all 31 purchasing decisions made during January.
>
> Across the entire month and nearly 1,500 evaluated half-hour periods:
> * The system identified a month-wide MAE of approximately 1,995 MW.
> * A systemic positive bias of +1,727 MW, indicating that weather models during this winter period consistently anticipated higher wind generation than materialized.
>
> For your procurement team, this insight is actionable: knowing that morning forecasts had a systemic positive bias allows your traders to apply a defensive margin when deciding how much backup power to procure, preventing expensive imbalance cash-out penalties."

### [4:15 – 4:45] Scope Boundary & Value Proposition
*(Screen: Return to main dashboard; summarize)*

> "It's important to clarify what WindGrid does and does not do: it analyzes national wind generation forecasts from official Elexon datasets. It does not pretend to optimize your total electricity book or calculate consumer demand.
>
> Instead, it gives your team a reliable, mathematically rigorous foundation to understand renewable uncertainty. Thank you, and I look forward to your questions."

---

# Part 2: Internal Technical Review (Technical Lead & Architecture Review)
**Duration:** ~4 minutes 45 seconds  
**Audience:** Internal Technical Lead / Engineering Reviewer.  
**Tone:** Technical, structured, clear code walkthrough.

### [4:45 – 5:30] Architecture & Clean Separation of Concerns
*(Screen: Show repository directory tree in IDE: `frontend/` and `backend/`)*

> "Welcome to Part 2 of the presentation: the internal technical walkthrough.
>
> As required by the engineering specifications, the application is built as a decoupled monorepo:
> * **Backend:** Python 3 with Django and Django REST Framework.
> * **Frontend:** React with Vite, JavaScript (JSX), Recharts for responsive visualizations, and Lucide icons.
> * **Containerization:** Multi-stage Dockerfiles and Docker Compose.
>
> We strictly adhered to a clean service-oriented architecture inside Django, avoiding bloated views. Let's look at `backend/wind/services/`:"

### [5:30 – 6:45] Data Pipeline & Anti-Look-Ahead Logic
*(Screen: Open `backend/wind/services/forecast_service.py` and `backend/wind/services/data_service.py`)*

> "Let's inspect `forecast_service.py`. This is where our critical domain logic lives.
>
> When a client queries a `decision_date`—say `2026-01-15`—the service:
> 1. Maps the decision date to the target delivery day: `delivery_date = decision_date + timedelta(days=1)`.
> 2. Resolves the decision cutoff: default `11:00 Europe/London`. Using Python's `zoneinfo.ZoneInfo`, we convert London time to UTC to guarantee daylight saving time and GMT/BST safety.
> 3. Filters eligible forecasts: `rec['publishTime'] <= cutoff_utc`.
>
> Any forecast published after cutoff is filtered out into `excludedPostCutoffForecasts`. For each delivery interval `startTime`, we find `max(candidates, key=lambda c: c['publishDt'])`.
>
> In `data_service.py`, we ingest Elexon's `FUELHH` dataset and strictly filter `fuelType == 'WIND'`. We normalize all timestamps to ISO 8601 UTC while formatting user-facing strings in `Europe/London`."

### [6:45 – 7:45] Real Elexon API Data & Resolution Discovery
*(Screen: Open `backend/wind/services/elexon_client.py` and show `backend/wind/data/cache/`)*

> "Next, let's examine `elexon_client.py`. We connect directly to Elexon's Insights Solution endpoints:
> `/datasets/FUELHH/stream` and `/datasets/WINDFOR/stream`.
>
> During our initial exploratory research, we validated real historical data coverage for all of January 2026. We implemented a two-tier caching strategy: in-memory caching and persistent JSON caching in `data/cache/`. This ensures sub-10ms response times and offline resilience while retaining the ability to query live streaming endpoints.
>
> Crucially, our empirical investigation revealed that Elexon's `WINDFOR` dataset publishes day-ahead horizon forecasts at **hourly resolution** (24 periods per day), while `FUELHH` actuals are published half-hourly (48 periods).
> In strict accordance with the assignment instructions—*never fabricate or interpolate missing data just to make charts continuous*—our `AccuracyService` matches exactly the 24 valid pairs, computes MAE, RMSE, and bias strictly on those matched points, and clearly reports 50% coverage."

### [7:45 – 8:45] Automated Test Suite Execution
*(Screen: Terminal in IDE; run `python manage.py test` and `pytest`)*

> "Let's run the automated test suite.
>
> As you can see, 18 comprehensive tests run in under 0.4 seconds across both Django's test runner and pytest:
> * `test_forecast_selection.py`: Tests multiple runs, latest pre-cutoff selection, exclusion of post-cutoff runs, and zero look-ahead bias.
> * `test_accuracy_metrics.py`: Mathematically tests MAE, RMSE, signed bias, and guarantees that empty datasets return `isAvailable: False` rather than masking missing data with zero.
> * `test_data_service.py`: Validates strict `fuelType == 'WIND'` filtering, 48 settlement periods, and the January 31 decision boundary delivering on February 1.
> * `test_api_endpoints.py`: Validates HTTP status codes, parameter bounds, and 400 Bad Request error handling."

### [8:45 – 9:30] Docker, Deployment, & Transparency
*(Screen: Show `docker-compose.yml` and Git status)*

> "Finally, let's look at deployment and infrastructure:
> * `docker-compose.yml` orchestrates both services: a multi-stage Nginx container serving the built React bundle and reverse-proxying `/api/` requests to Gunicorn running the Django application.
> * For cloud deployment, the React frontend is configured for Vercel, and Django runs on a compatible Python container host with CORS properly configured.
> * All code is committed to Git with an anonymous repository name.
> * AI Tool Disclosure: In the README and project documentation, we explicitly and transparently disclose that Google Antigravity assisted in exploring API endpoints, scaffolding, and testing.
>
> This concludes the technical review. Thank you!"
