# Cybersecurity Security Logs API

A small Node.js + Express REST API that serves fictional security events for students' Python Cybersecurity Log Analyzer final project.

**All records are simulated training data. They are not real OPAY logs or real customer records.**

## Requirements
- Node.js 18 or newer
- npm

## Run locally
1. Extract the project folder.
2. Open a terminal in the `cybersecurity-logs-api` folder.
3. Install dependencies:

   ```bash
   npm install
   ```

4. Start the API:

   ```bash
   npm start
   ```

5. Open `http://localhost:3000/` in a browser.

## Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | API information |
| GET | `/api/health` | Health check |
| GET | `/api/security-logs` | Retrieve security logs (default 50 per page) |
| GET | `/api/security-logs/stats` | Aggregate event counts |
| GET | `/api/security-logs/LOG100001` | Retrieve one log by ID (replace with a real ID) |

### Query parameters for `/api/security-logs`
- `page=1` — page number (starts at 1)
- `limit=50` — number of records (1–200)
- `event_type=failed_login`
- `status=failed`
- `severity=high`
- `ip_address=185.220.101.7`
- `user_id=USR1001`
- `from=2026-09-01`
- `to=2026-09-30`

Filters can be combined, for example:

`http://localhost:3000/api/security-logs?event_type=failed_login&severity=high&limit=100`

## Example Python client

Install the Python dependency with `pip install requests`, then save as `student_client.py`:

```python
import requests

API_URL = "http://localhost:3000/api/security-logs"

try:
    response = requests.get(API_URL, params={"limit": 100}, timeout=10)
    response.raise_for_status()
    payload = response.json()

    logs = payload.get("logs", [])
    print(f"Retrieved {len(logs)} logs")
    for log in logs[:5]:
        print(log.get("timestamp"), log.get("event_type"), log.get("severity"))

except requests.exceptions.Timeout:
    print("The request timed out. Try again.")
except requests.exceptions.ConnectionError:
    print("Could not connect. Is the Node.js API running?")
except requests.exceptions.HTTPError as exc:
    print(f"The API returned an HTTP error: {exc}")
except requests.exceptions.RequestException as exc:
    print(f"Request failed: {exc}")
except ValueError:
    print("The API did not return valid JSON.")
```

## Deployment
You can deploy this Node.js service to a hosting provider that supports Node.js. Set the start command to `npm start`. After deployment, replace `http://localhost:3000` in the students' Python clients with the public HTTPS URL.

Before public deployment, review the hosting provider's requirements, keep dependencies updated, and consider restricting CORS to your students' app origins. The API is read-only and contains only simulated training data.
