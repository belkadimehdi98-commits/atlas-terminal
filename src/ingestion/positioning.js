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
        const fundingRes = await axios_1.default.get(`https://fapi.binance.com/fapi/v1/premiumIndex?symbol=${pair}`);
        const fundingRate = parseFloat(((_a = fundingRes.data) === null || _a === void 0 ? void 0 : _a.lastFundingRate) || "0");
        // Open interest
        const oiRes = await axios_1.default.get(`https://fapi.binance.com/fapi/v1/openInterest?symbol=${pair}`);
        const openInterest = parseFloat(((_b = oiRes.data) === null || _b === void 0 ? void 0 : _b.openInterest) || "0");
        // Long / Short ratio (Binance global account ratio)
        const ratioRes = await axios_1.default.get(`https://fapi.binance.com/futures/data/globalLongShortAccountRatio?symbol=${pair}&period=5m&limit=1`);
        const longShortRatio = parseFloat(((_d = (_c = ratioRes.data) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.longShortRatio) || "1");
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
