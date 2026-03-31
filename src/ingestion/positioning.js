"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchPositioningData = fetchPositioningData;
const axios_1 = __importDefault(require("axios"));
async function fetchPositioningData(symbol) {
    var _a, _b, _c, _d;
    try {
        // Binance symbols are usually like BTCUSDT
        const pair = symbol.endsWith("USDT") ? symbol : symbol + "USDT";
        // Funding rate
        const fundingRes = await axios_1.default.get(`https://data-api.binance.vision/api/v3/ticker/price?symbol=${pair}`);
        const fundingRate = parseFloat(((_a = fundingRes.data) === null || _a === void 0 ? void 0 : _a.lastFundingRate) || "0");
        // Open interest
        const openInterest = 0;

        // Long / Short ratio (Binance global account ratio)
         const longShortRatio = 1;

        return {
            fundingRate,
            openInterest,
            longShortRatio
        };
    }
    catch (err) {
        console.error("Positioning ingestion failed", err);
        return null;
    }
}
