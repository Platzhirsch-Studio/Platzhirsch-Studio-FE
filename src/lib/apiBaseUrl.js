// lib/apiBaseUrl.js

// API Configuration from environment variables
const SERVER = process.env.SERVER;
const API_KEY = process.env.API_KEY;
const API_SECRET = process.env.API_SECRET;

export const API_BASE_URL = `${SERVER}/api/method/`;

// Backend for the product/brand endpoints (Produkte New, Marken, Produkte
// Kategorie, Sub Kategorie, Produkte Farbe, Produkte Material, collections) and
// the /cmx file proxy. These are now deployed on SERVER, so they use it too.
// Every one of them is a whitelisted allow_guest method — no credentials
// needed for any fetch* module. Falls back to the dev instance when SERVER is
// not set.
export const NEW_API_SERVER = SERVER || "http://10.30.70.201:8000";
export const NEW_API_BASE_URL = `${NEW_API_SERVER}/api/method/`;

export function getApiHeaders() {
    if (!API_KEY || !API_SECRET) {
        console.error('Missing API credentials in environment variables');
        throw new Error('API credentials not configured');
    }

    const headers = new Headers();
    headers.append('Authorization', `token ${API_KEY}:${API_SECRET}`);
    headers.append('Content-Type', 'application/json');
    return headers;
}

// Optional: Helper function to check if API is configured
export function isApiConfigured() {
    return !!(API_KEY && API_SECRET);
}