# WindGrid — Wind Forecasting & Day-Ahead Procurement Intelligence

An enterprise energy analytics platform built for UK electricity utility trading teams to inspect national wind generation forecasts and evaluate forecast accuracy under strict day-ahead market timing rules without look-ahead bias.

---

## 1. Executive Summary & Business Objective

In the Great Britain (GB) wholesale power market, energy utilities must procure electricity on the day-ahead market (e.g., EPEX SPOT and Nord Pool UK Day-Ahead Auctions) to balance customer demand. Wind power constitutes a significant but intermittent share of generation. Because day-ahead purchasing decisions must be committed one day prior to physical delivery, procurement desks rely on renewable generation forecasts to determine how much residual power to contract.

**WindGrid** addresses two primary operational needs:
1. **Day-Ahead Intelligence:** Clearly presents the latest national wind generation forecasts physically available at the time day-ahead purchasing decisions are finalized.
2. **Quantitative Forecast Accuracy:** Quantifies forecast errors (MAE, RMSE, signed bias) against actual outturn wind generation, enabling procurement desks to account for forecast risk and uncertainty margins when bidding.

---

## 2. Explicit Scope Restrictions & Boundary Conditions

To maintain strict auditing integrity and avoid unsupported business claims:
* **Generation Type:** National-level wind power generation only.
* **Datasets:** Restricted strictly to official Elexon BMRS datasets:
  * **Actual Outturn Generation:** [`FUELHH`](https://bmrs.elexon.co.uk/api-documentation/endpoint/datasets/FUELHH/stream) filtered strictly to `fuelType = "WIND"`.
  * **Forecast Wind Generation:** [`WINDFOR`](https://bmrs.elexon.co.uk/api-documentation/endpoint/datasets/WINDFOR/stream).
* **Excluded Data:** No demand data, solar generation, wholesale power prices, thermal fleet dispatch, or third-party weather models are introduced.
* **Zero Fabrication / Zero Interpolation:** Missing data is explicitly reported as unavailable. No synthetic figures or smoothed interpolations are inserted into historical series.
* **Procurement Decision Boundary:** WindGrid quantifies wind forecast uncertainty. It does **not** independently calculate total consumer demand, system shortfalls, exact electricity purchasing schedules, or financial trading profits.

---

## 3. Market Timing & Cutoff Formulation (Zero Look-Ahead Bias)

### Day-Ahead Auction Timing in Great Britain
* **Decision Date ($D-1$):** The trading day on which bids and offers are placed.
* **Delivery Date ($D$):** The subsequent day of physical delivery ($D = D-1 + 1\text{ day}$), spanning 48 half-hour settlement periods (00:00 to 24:00 UK local time).
* **Decision Cutoff:** In the UK wholesale market, the EPEX SPOT GB Day-Ahead Auction and Nord Pool GB Auction close their order books at **11:00 London Time** on day $D-1$ (with 12:00 London Time serving as the BSC Gate Closure benchmark).
* **Default Benchmark:** WindGrid defaults to **11:00 Europe/London** (configurable to 12:00 or other run times).

### Forecast Selection Rule
For each half-hourly delivery period $t$ on delivery day $D$:
$$\text{selected\_forecast}(t) = \arg\max_{\text{publishTime} \le \text{cutoff}} \{\text{publishTime} \mid \text{forecast.startTime} = t\}$$

* **Look-Ahead Prevention:** Any forecast publication run issued after the decision cutoff (e.g., afternoon 15:30 or evening 22:30 runs) is **strictly excluded** from day-ahead evaluation.
* **Date Scope:** Evaluates purchasing decisions made between **1 January 2026 and 31 January 2026** (delivering 2 January 2026 through 1 February 2026).

### Resolution Handling in Real-World Elexon Data
Empirical analysis of the Elexon `WINDFOR` streaming dataset reveals that day-ahead horizon forecasts issued by National Grid ESO are published at **hourly resolution** (at `00:00, 01:00, 02:00, ..., 23:00 UTC`), yielding 24 points per delivery day. In compliance with the requirement:
> *"Do not interpolate missing actual or forecast records just to make charts look continuous. Calculate metrics only on valid, matched forecast/actual pairs."*

WindGrid pairs the 24 forecast points with the corresponding half-hourly `FUELHH` actuals (settlement periods 1, 3, 5, ..., 47) and computes all accuracy metrics strictly on these 24 matched pairs (50% coverage of the 48 periods), displaying unmatched periods as unavailable rather than inventing data.

---

## 4. Quantitative Metrics & Signed Error Convention

All calculations use a consistent signed error convention:
$$\text{error}_i = \text{forecast\_generation}_i - \text{actual\_generation}_i$$

* **Positive Error ($\text{error} > 0$):** **Overforecast** — Wind generation was overestimated; utility had less wind than expected.
* **Negative Error ($\text{error} < 0$):** **Underforecast** — Wind generation was underestimated; utility had surplus wind.
* **Mean Absolute Error (MAE):** $\text{MAE} = \frac{1}{N} \sum_{i=1}^N |\text{error}_i|$ (MW)
* **Root Mean Squared Error (RMSE):** $\text{RMSE} = \sqrt{\frac{1}{N} \sum_{i=1}^N \text{error}_i^2}$ (MW)
* **Forecast Bias:** $\text{Bias} = \frac{1}{N} \sum_{i=1}^N \text{error}_i$ (MW)

---

## 5. System Architecture

```mermaid
graph TD
    subgraph Elexon BMRS API
        E1["/datasets/FUELHH/stream (Actuals)"]
        E2["/datasets/WINDFOR/stream (Forecasts)"]
    end

    subgraph Django REST Backend
        EC["ElexonClient (Streaming & Disk/Memory Cache)"]
        DS["DataService (Timezones, fuelType='WIND', Intervals)"]
        FS["ForecastService (11:00 London Cutoff, Zero Bias)"]
        AS["AccuracyService (MAE, RMSE, Signed Bias)"]
        API["REST Endpoints (/api/overview, /api/accuracy, /api/history)"]
    end

    subgraph React Frontend (Vite)
        NV["Navbar (Date Picker, Cutoff Selector)"]
        OP["Procurement Overview Page"]
        AP["Forecast Accuracy Page"]
        HP["January 2026 Retrospective Page"]
        VP["Intraday Forecast Runs Page"]
    end

    E1 --> EC
    E2 --> EC
    EC --> DS
    EC --> FS
    DS --> AS
    FS --> AS
    AS --> API
    API --> NV
    API --> OP
    API --> AP
    API --> HP
    API --> VP
```

---

## 6. Directory Structure

```text
WindGrid/
├── backend/
│   ├── config/             # Django project settings, wsgi, asgi, urls
│   │   ├── settings.py
│   │   ├── urls.py
│   │   └── wsgi.py
│   ├── wind/               # Wind intelligence Django app
│   │   ├── services/
│   │   │   ├── elexon_client.py    # Elexon API streaming client & caching
│   │   │   ├── data_service.py     # Timestamp normalization & WIND filter
│   │   │   ├── forecast_service.py # Cutoff selection & anti-look-ahead logic
│   │   │   └── accuracy_service.py # MAE, RMSE, signed bias calculations
│   │   ├── data/cache/     # Local Elexon cache for rapid startup & offline resilience
│   │   ├── tests/          # Comprehensive automated unit & integration tests
│   │   │   ├── test_forecast_selection.py
│   │   │   ├── test_accuracy_metrics.py
│   │   │   ├── test_data_service.py
│   │   │   └── test_api_endpoints.py
│   │   ├── serializers.py
│   │   ├── views.py        # Django REST Framework endpoints
│   │   └── urls.py
│   ├── manage.py
│   ├── pytest.ini
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx          # Header, date picker, cutoff selector
│   │   │   ├── MetricCard.jsx      # High-fidelity KPI card component
│   │   │   └── ContextBanner.jsx   # Decision context pill banner
│   │   ├── pages/
│   │   │   ├── OverviewPage.jsx    # Day-ahead profile chart & schedule
│   │   │   ├── AccuracyPage.jsx    # Forecast vs Actual & signed error bar chart
│   │   │   ├── HistoryPage.jsx     # Full January 2026 evaluation & daily table
│   │   │   └── VersionsPage.jsx    # Multi-run intraday forecast evolution
│   │   ├── services/
│   │   │   └── api.js              # REST client
│   │   ├── App.jsx                 # Main layout & routing state
│   │   ├── main.jsx                # React DOM entry
│   │   └── index.css               # Clean enterprise design tokens & CSS
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   └── Dockerfile
├── docker-compose.yml
├── .env.example
├── .gitignore
└── README.md
```

---

## 7. Local Setup & Installation

### Prerequisites
* Python 3.10+ (Tested on Python 3.12 and 3.14)
* Node.js 18+ and npm
* Git

### Step 1: Clone the Repository
```bash
git clone https://github.com/prince-rai88/WindGrid.git
cd WindGrid
```

### Step 2: Backend Setup
```bash
# Create and activate Python virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r backend/requirements.txt

# Run migrations
cd backend
python manage.py migrate

# Run Django development server
python manage.py runserver 127.0.0.1:8000
```
Backend will be available at `http://127.0.0.1:8000/api/health/`.

### Step 3: Frontend Setup
In a new terminal window:
```bash
cd frontend
npm install
npm run dev -- --host 127.0.0.1 --port 5173
```
Frontend will be available at `http://127.0.0.1:5173/`.

---

## 8. Running Automated Tests

Run the backend test suite via Django's test runner:
```bash
source venv/bin/activate
cd backend
python manage.py test
```

Or via `pytest`:
```bash
source venv/bin/activate
cd backend
pytest
```

**Test Coverage Summary:**
* `test_forecast_selection.py`: Multiple forecasts, latest pre-cutoff selection, strict exclusion of post-cutoff forecasts, missing forecasts, configurable cutoff.
* `test_accuracy_metrics.py`: Mathematical verification of signed error convention, MAE, RMSE, signed bias, missing data exclusion, zero-handling without falsification.
* `test_data_service.py`: Strict `fuelType == 'WIND'` filtering, 48 settlement periods, month boundary (Jan 31 decision -> Feb 1 delivery), London timezone conversions.
* `test_api_endpoints.py`: Integration testing of all REST endpoints (`/api/health/`, `/api/overview/`, `/api/accuracy/`, `/api/history/`, `/api/forecast-versions/`).

---

## 9. Docker & Containerized Deployment

Run the entire application in isolated containers with Docker Compose:
```bash
docker compose up --build
```
* Frontend (Nginx): `http://localhost:3000`
* Backend (Gunicorn): `http://localhost:8000`

---

## 10. API Specification

| Endpoint | Method | Parameters | Description |
|---|---|---|---|
| `/api/health/` | GET | None | System status, scope, and Elexon data availability. |
| `/api/overview/` | GET | `decision_date` (YYYY-MM-DD), `cutoff_time` (HH:MM) | Day-ahead forecast series, peak/trough metrics, coverage. |
| `/api/accuracy/` | GET | `decision_date` (YYYY-MM-DD), `cutoff_time` (HH:MM) | Aligned forecast vs actual, MAE, RMSE, signed bias, half-hourly table. |
| `/api/history/` | GET | `start_date`, `end_date`, `cutoff_time` | Daily breakdown for January 2026 + month-wide aggregate metrics. |
| `/api/forecast-versions/` | GET | `decision_date` | Multi-run intraday forecast comparisons for retrospective study. |

---

## 11. Disclosure of AI Tooling

In accordance with academic and professional transparency guidelines:
* **AI Tool Used:** Google Antigravity (Advanced Agentic AI Assistant).
* **Role:** Antigravity assisted in exploring the Elexon BMRS streaming API schemas, scaffolding the Django REST and React architectures, implementing data normalization services and mathematical error metrics, generating unit tests, and structuring documentation.
* All logic, calculations, domain timing cutoff assumptions, and test results have been verified.

---

## 12. Deployment Links

* **GitHub Repository:** [https://github.com/prince-rai88/WindGrid](https://github.com/prince-rai88/WindGrid)
* **Frontend Production URL:** Configured for Vercel deployment (`https://windgrid.vercel.app` or user-configured Vercel project).
* **Backend Production URL:** Compatible with Heroku / Render / Railway container hosting.
