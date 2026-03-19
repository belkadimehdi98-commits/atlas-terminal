"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TechnicalEngine = void 0;
const candles_router_1 = require("../ingestion/candles-router");
class TechnicalEngine {
    constructor(symbol, timeframe = "1h") {
        this.symbol = symbol;
        this.timeframe = timeframe;
    }
    async run() {
        // Normalize symbols (fix OIL provider issue)
        const normalizedSymbol = this.symbol.toUpperCase() === "OIL"
            ? "WTI"
            : this.symbol;
        const candleData = await candles_router_1.candlesRouter.getCandles({
            symbol: normalizedSymbol,
            assetClass: this.detectAssetClass(),
            interval: this.timeframe,
            limit: 300
        });
        const candles = candleData.candles;
        const closes = candles.map(c => c.close);
        const sma50 = this.sma(closes, 50);
        const sma200 = this.sma(closes, 200);
        const rsi = this.rsi(closes, 14);
        const atr = this.atr(candles, 14);
        const volPercentile = this.volatilityPercentile(candles);
        const volRegime = this.volatilityRegime(volPercentile);
        const trend = this.detectTrend(sma50, sma200);
        const momentum = this.detectMomentum(rsi);
        const structure = this.marketStructure(closes);
        return {
            trend,
            momentum,
            structure,
            indicators: [
                `SMA50: ${sma50.toFixed(2)}`,
                `SMA200: ${sma200.toFixed(2)}`,
                `RSI: ${rsi.toFixed(2)}`,
                `ATR: ${atr.toFixed(4)}`,
                `Volatility: ${volRegime}`,
                `Vol Percentile: ${volPercentile}%`
            ]
        };
    }
    detectAssetClass() {
        const s = this.symbol.toUpperCase();
        if (s.endsWith("USDT"))
            return "crypto";
        if (s === "XAUUSD" || s === "XAGUSD")
            return "metal";
        if (s === "OIL" || s === "WTI" || s === "BRENT")
            return "energy";
        if (s === "EURUSD" ||
            s === "GBPUSD" ||
            s === "USDJPY")
            return "forex";
        return "index";
    }
    sma(data, period) {
        const slice = data.slice(-period);
        const sum = slice.reduce((a, b) => a + b, 0);
        return sum / period;
    }
    rsi(data, period) {
        let gains = 0;
        let losses = 0;
        for (let i = data.length - period; i < data.length; i++) {
            const diff = data[i] - data[i - 1];
            if (diff >= 0)
                gains += diff;
            else
                losses += Math.abs(diff);
        }
        const rs = gains / (losses || 1);
        return 100 - 100 / (1 + rs);
    }
    atr(candles, period) {
        const trs = [];
        for (let i = 1; i < candles.length; i++) {
            const high = candles[i].high;
            const low = candles[i].low;
            const prevClose = candles[i - 1].close;
            const tr = Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose));
            trs.push(tr);
        }
        const slice = trs.slice(-period);
        const sum = slice.reduce((a, b) => a + b, 0);
        return sum / period;
    }
    volatilityRegime(percentile) {
        if (percentile > 80)
            return "EXTREME";
        if (percentile > 60)
            return "EXPANDING";
        if (percentile > 30)
            return "NORMAL";
        return "COMPRESSED";
    }
    detectTrend(sma50, sma200) {
        if (sma50 > sma200)
            return "BULLISH";
        if (sma50 < sma200)
            return "BEARISH";
        return "SIDEWAYS";
    }
    detectMomentum(rsi) {
        if (rsi > 70)
            return "Overbought momentum";
        if (rsi < 30)
            return "Oversold momentum";
        if (rsi > 55)
            return "Bullish momentum";
        if (rsi < 45)
            return "Bearish momentum";
        return "Neutral momentum";
    }
    marketStructure(data) {
        const recent = data.slice(-20);
        const highs = Math.max(...recent);
        const lows = Math.min(...recent);
        const last = data[data.length - 1];
        if (last > highs * 0.98)
            return "Price pressing resistance";
        if (last < lows * 1.02)
            return "Price testing support";
        return "Range structure";
    }
    volatilityPercentile(candles) {
        const ranges = candles.map(c => c.high - c.low);
        const current = ranges[ranges.length - 1];
        const sorted = [...ranges].sort((a, b) => a - b);
        const rank = sorted.findIndex(v => v >= current);
        const percentile = (rank / sorted.length) * 100;
        return Math.round(percentile);
    }
}
exports.TechnicalEngine = TechnicalEngine;
