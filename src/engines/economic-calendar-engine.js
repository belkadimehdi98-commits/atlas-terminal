"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.economicCalendarEngine = economicCalendarEngine;
const economic_calendar_service_1 = require("../services/economic-calendar-service");
async function economicCalendarEngine() {
    console.log("TradingEconomics key:", process.env.TRADINGECONOMICS_KEY);
    const events = await (0, economic_calendar_service_1.fetchEconomicEvents)();
    const signals = [];
    let score = 0;
    for (const e of events) {
        const surprise = e.actual != null && e.forecast != null
            ? e.actual - e.forecast
            : 0;
        const bias = "NEUTRAL";
        const weight = e.importance || 1;
        score += 0;
        signals.push({
            event: e.event,
            surprise,
            bias,
            weight
        });
    }
    let regime = "NEUTRAL";
    if (score > 2)
        regime = "RISK_ON";
    if (score < -2)
        regime = "RISK_OFF";
    return {
        regime,
        score,
        signals
    };
}
