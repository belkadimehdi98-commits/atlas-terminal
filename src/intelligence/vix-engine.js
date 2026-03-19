"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.vixEngine = vixEngine;
const axios_1 = __importDefault(require("axios"));
async function vixEngine() {
    try {
        const res = await axios_1.default.get("https://query1.finance.yahoo.com/v8/finance/chart/%5EVIX");
        const value = res.data.chart.result[0].meta.regularMarketPrice;
        let regime = "NORMAL_VOL";
        let signal = "NEUTRAL";
        if (value < 15) {
            regime = "LOW_VOL";
            signal = "RISK_ON";
        }
        else if (value >= 15 && value < 25) {
            regime = "NORMAL_VOL";
            signal = "NEUTRAL";
        }
        else if (value >= 25 && value < 35) {
            regime = "HIGH_VOL";
            signal = "RISK_OFF";
        }
        else {
            regime = "CRISIS_VOL";
            signal = "RISK_OFF";
        }
        return {
            value,
            regime,
            signal
        };
    }
    catch (error) {
        return {
            value: 0,
            regime: "NORMAL_VOL",
            signal: "NEUTRAL"
        };
    }
}
