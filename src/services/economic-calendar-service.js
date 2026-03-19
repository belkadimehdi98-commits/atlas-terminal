"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchEconomicEvents = fetchEconomicEvents;
const axios_1 = __importDefault(require("axios"));
const API_KEY = process.env.TRADINGECONOMICS_KEY;
let cache = [];
let lastFetch = 0;
async function fetchEconomicEvents() {
    var _a;
    const now = Date.now();
    // 60s cache
    if (now - lastFetch < 60000 && cache.length) {
        return cache;
    }
    try {
        const url = `https://api.tradingeconomics.com/calendar?c=guest:guest&f=json`;
        const res = await axios_1.default.get(url, {
            headers: { Accept: "application/json" }
        });
        const events = res.data || [];
        cache = events.map((e) => ({
            event: e.Event,
            country: e.Country,
            actual: e.Actual ? parseFloat(String(e.Actual).replace("%", "")) : null,
            forecast: e.Forecast ? parseFloat(String(e.Forecast).replace("%", "")) : null,
            previous: e.Previous ? parseFloat(String(e.Previous).replace("%", "")) : null,
            importance: e.Importance || 1,
            timestamp: e.Date
        }));
        lastFetch = now;
        return cache;
    }
    catch (err) {
        console.log("Economic calendar error:", ((_a = err.response) === null || _a === void 0 ? void 0 : _a.data) || err.message);
        return cache;
    }
}
