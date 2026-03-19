"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CryptoFlowEngine = void 0;
const axios_1 = __importDefault(require("axios"));
class CryptoFlowEngine {
    async analyze() {
        try {
            const res = await axios_1.default.get("https://api.coingecko.com/api/v3/global");
            const data = res.data.data;
            const btcDominance = data.market_cap_percentage.btc;
            const totalMarketCap = data.total_market_cap.usd;
            let signal = "NEUTRAL";
            if (btcDominance > 52)
                signal = "BTC_STRENGTH";
            if (btcDominance < 48)
                signal = "ALTCOIN_ROTATION";
            return {
                btcDominance,
                totalMarketCap,
                signal,
                summary: [
                    `BTC Dominance: ${btcDominance.toFixed(2)}%`,
                    `Total Crypto Market Cap: $${Math.round(totalMarketCap / 1e9)}B`,
                    `Flow Signal: ${signal}`
                ]
            };
        }
        catch (_a) {
            return {
                summary: ["Crypto flow data unavailable"]
            };
        }
    }
}
exports.CryptoFlowEngine = CryptoFlowEngine;
