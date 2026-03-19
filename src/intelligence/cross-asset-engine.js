"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CrossAssetEngine = void 0;
const market_router_1 = require("../ingestion/market-router");
class CrossAssetEngine {
    constructor() {
        this.router = new market_router_1.MarketRouter();
    }
    async analyze() {
        const result = {
            alignment: "",
            summary: ""
        };
        try {
            result.gold = await this.router.getPrice("XAUUSD");
        }
        catch (_a) { }
        try {
            result.spx = await this.router.getPrice("SPX");
        }
        catch (_b) { }
        try {
            result.btc = await this.router.getPrice("BTCUSDT");
        }
        catch (_c) { }
        try {
            result.oil = await this.router.getPrice("WTI");
        }
        catch (_d) { }
        let riskOffSignals = 0;
        let riskOnSignals = 0;
        if (result.gold && result.gold > 0)
            riskOffSignals++;
        if (result.btc && result.btc > 0)
            riskOnSignals++;
        if (riskOffSignals > riskOnSignals) {
            result.alignment = "RISK_OFF";
            result.summary =
                "Safe-haven flows dominate. Capital rotating to defensive assets.";
        }
        else {
            result.alignment = "RISK_ON";
            result.summary =
                "Risk appetite present. Capital flowing toward growth assets.";
        }
        return result;
    }
}
exports.CrossAssetEngine = CrossAssetEngine;
