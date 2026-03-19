"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LiquidityEngine = void 0;
const axios_1 = __importDefault(require("axios"));
const FRED_KEY = process.env.FRED_KEY;
class LiquidityEngine {
    async analyze() {
        try {
            const [walclRes, rrpRes, tgaRes] = await Promise.all([
                axios_1.default.get(`https://api.stlouisfed.org/fred/series/observations?series_id=WALCL&api_key=${FRED_KEY}&file_type=json&sort_order=desc&limit=1`),
                axios_1.default.get(`https://api.stlouisfed.org/fred/series/observations?series_id=RRPONTSYD&api_key=${FRED_KEY}&file_type=json&sort_order=desc&limit=1`),
                axios_1.default.get(`https://api.stlouisfed.org/fred/series/observations?series_id=WTREGEN&api_key=${FRED_KEY}&file_type=json&sort_order=desc&limit=1`)
            ]);
            const fedBalanceSheet = parseFloat(walclRes.data.observations[0].value);
            const reverseRepo = parseFloat(rrpRes.data.observations[0].value);
            const treasuryAccount = parseFloat(tgaRes.data.observations[0].value);
            const netLiquidity = fedBalanceSheet - reverseRepo - treasuryAccount;
            let signal = "NEUTRAL";
            if (netLiquidity > 0)
                signal = "EXPANDING";
            if (netLiquidity < 0)
                signal = "CONTRACTING";
            return {
                fedBalanceSheet,
                reverseRepo,
                treasuryAccount,
                netLiquidity,
                signal,
                summary: [
                    `Fed Balance Sheet: ${fedBalanceSheet}`,
                    `Reverse Repo: ${reverseRepo}`,
                    `Treasury Account: ${treasuryAccount}`,
                    `Net Liquidity: ${netLiquidity}`,
                    `Signal: ${signal}`
                ]
            };
        }
        catch (_a) {
            return {
                summary: ["Liquidity data unavailable"]
            };
        }
    }
}
exports.LiquidityEngine = LiquidityEngine;
