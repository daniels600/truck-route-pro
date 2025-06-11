# Trip Planning App

A full-stack application built with Django and React to assist truck drivers in planning trips with compliance to FMCSA Hours of Service (HOS) regulations. This app calculates optimal routes, schedules fuel and rest stops, and generates ELD-compliant daily log sheets.

## Features
- **Route Planning**: Displays interactive maps with routes using a free OpenRouteService API, including start, pickup, dropoff, fuel, and rest locations.
- **HOS Compliance**: Enforces 11-hour driving, 14-hour duty, and 70-hour/8-day cycle limits with mandatory 10-hour rests.
- **Stop Management**: Automatically plans fuel stops every 1,000 miles and rest stops for multi-day trips.
- **ELD Logs**: Provides a 24-hour activity grid for daily logs, reflecting driving, on-duty, and off-duty periods.
- **Real-Time Data**: Tracks driver cycle hours persistently across trips.

## Getting Started
1. **Prerequisites**: Ensure you have Python, Node.js, and a free OpenRouteService API key.
2. **Installation**:
   - Clone the repo: `git clone https://github.com/yourusername/trip-planning-app.git`
   - Backend: `cd backend`, `pip install -r requirements.txt`, set `MAPBOX_TOKEN` in settings.py.
   - Frontend: `cd frontend`, `npm install`, set `VITE_MAPBOX_TOKEN` in `.env` (for map rendering).
3. **Run**: Start Django with `python manage.py runserver` and React with `npm start`.

## Demo
Check the live hosted version at https://spotter-frontend-cyli.vercel.app/ and view the 3-5 minute Loom walkthrough [loom-link] for a code overview.

## Contributions
Fork the repo and submit pull requests. Issues and feature requests are welcome!

## License
MIT License - See LICENSE file for details.
