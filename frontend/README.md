# FoodShare — Frontend Demo

This folder contains a simple static frontend demo for the Food Waste Management project.

Files:
- `index.html` — main page (Bootstrap 5 CDN)
- `styles.css` — small custom styles
- `app.js` — simple in-memory/localStorage app logic

How to run:
1. Open `index.html` in a browser.
2. The Home (hero) appears first. Click "Donate Food" to reveal the donation form, or "View Available Food" to see listings.
3. Use the form to add items (stored in browser `localStorage`). Click "Request" on an item to view owner contact and pickup address.

Notes:
- This is a frontend prototype only — no backend or authentication.
- For integration, replace localStorage calls in `app.js` with API calls to your server.
