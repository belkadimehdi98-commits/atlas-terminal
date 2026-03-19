"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SymbolResolver = void 0;
class SymbolResolver {
    static resolve(input) {
        const key = input.toLowerCase().trim();
        if (this.map[key]) {
            return this.map[key];
        }
        return input.toUpperCase();
    }
}
exports.SymbolResolver = SymbolResolver;
SymbolResolver.map = {
    /* ================= CRYPTO ================= */
    bitcoin: "BTCUSDT",
    btc: "BTCUSDT",
    ethereum: "ETHUSDT",
    eth: "ETHUSDT",
    solana: "SOLUSDT",
    sol: "SOLUSDT",
    bnb: "BNBUSDT",
    /* ================= METALS ================= */
    gold: "XAUUSD",
    xau: "XAUUSD",
    silver: "XAGUSD",
    xag: "XAGUSD",
    /* ================= FOREX ================= */
    eurusd: "EURUSD",
    eur: "EURUSD",
    gbpusd: "GBPUSD",
    gbp: "GBPUSD",
    usdjpy: "USDJPY",
    jpy: "USDJPY",
    audusd: "AUDUSD",
    /* ================= ENERGY ================= */
    oil: "OIL",
    wti: "OIL",
    crude: "OIL",
    /* ================= INDICES ================= */
    sp500: "SPX",
    spx: "SPX",
    nasdaq: "NAS100",
    nas100: "NAS100"
};
