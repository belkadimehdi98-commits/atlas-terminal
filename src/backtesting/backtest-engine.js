"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runBacktest = runBacktest;
const fs_1 = __importDefault(require("fs"));
async function runBacktest(asset, candles) {
    const trades = [];
    for (let i = 50; i < candles.length - 20; i++) {
        if (i % 20 === 0)
            console.log("Processing candle:", i);
        const candle = candles[i];
        const signals = {
            price: candle.close,
            technical: {
                trend: candle.close > candles[i - 20].close ? "BULLISH" : "BEARISH",
                momentum: candle.close > candles[i - 5].close ? "BULLISH" : "BEARISH",
                structure: candle.high > candles[i - 10].high ? "BREAKOUT" : "RANGE"
            },
            macro: {
                summary: { regime: "NEUTRAL" }
            },
            crossAsset: {
                summary: "Mixed"
            },
            geopolitics: {},
            vix: { value: 20 }
        };
        const decision = {
            direction: signals.technical.trend === "BULLISH" ? "BUY" : "SELL"
        };
        if (!decision || decision.direction === "NO_TRADE")
            continue;
        const entry = candle.close;
        const stop = entry * 0.99;
        const target = entry * 1.02;
        let exit = entry;
        for (let j = i + 1; j < i + 20; j++) {
            const future = candles[j];
            if (decision.direction === "BUY") {
                if (future.low <= stop) {
                    exit = stop;
                    break;
                }
                if (future.high >= target) {
                    exit = target;
                    break;
                }
            }
            if (decision.direction === "SELL") {
                if (future.high >= stop) {
                    exit = stop;
                    break;
                }
                if (future.low <= target) {
                    exit = target;
                    break;
                }
            }
        }
        const profit = decision.direction === "BUY"
            ? exit - entry
            : entry - exit;
        const trade = { entry, exit, profit };
        trades.push(trade);
        // SAVE LIVE TRACK RECORD
        fs_1.default.appendFileSync("track-record.json", JSON.stringify({
            asset,
            entry,
            exit,
            profit,
            timestamp: Date.now()
        }) + "\n");
    }
    const wins = trades.filter(t => t.profit > 0).length;
    const losses = trades.filter(t => t.profit <= 0).length;
    const winRate = trades.length ? (wins / trades.length) * 100 : 0;
    const totalProfit = trades.reduce((s, t) => s + t.profit, 0);
    return {
        trades: trades.length,
        wins,
        losses,
        winRate,
        totalProfit
    };
}
