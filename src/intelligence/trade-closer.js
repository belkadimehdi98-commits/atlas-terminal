"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.closeTrades = closeTrades;
const fs_1 = __importDefault(require("fs"));
const market_router_1 = require("../ingestion/market-router");
async function closeTrades() {
    const router = new market_router_1.MarketRouter();
    const openTrades = JSON.parse(fs_1.default.readFileSync("open-trades.json", "utf-8"));
    const remainingTrades = [];
    for (const trade of openTrades) {
        const price = await router.getPrice(trade.asset);
        let closed = false;
        let exit = price;
        if (trade.direction === "BUY") {
            if (price <= trade.stop) {
                exit = trade.stop;
                closed = true;
            }
            if (price >= trade.target) {
                exit = trade.target;
                closed = true;
            }
        }
        if (trade.direction === "SELL") {
            if (price >= trade.stop) {
                exit = trade.stop;
                closed = true;
            }
            if (price <= trade.target) {
                exit = trade.target;
                closed = true;
            }
        }
        if (closed) {
            const profit = trade.direction === "BUY"
                ? exit - trade.entry
                : trade.entry - exit;
            fs_1.default.appendFileSync("track-record.json", JSON.stringify({
                asset: trade.asset,
                entry: trade.entry,
                exit,
                profit,
                timestamp: Date.now()
            }) + "\n");
        }
        else {
            remainingTrades.push(trade);
        }
    }
    fs_1.default.writeFileSync("open-trades.json", JSON.stringify(remainingTrades, null, 2));
}
