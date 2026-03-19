"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const backtest_engine_1 = require("./backtest-engine");
const candles_router_1 = require("../ingestion/candles-router");
async function startBacktest() {
    const asset = "BTCUSDT";
    console.log("Starting backtest:", asset);
    console.log("Fetching candles...");
    const response = await candles_router_1.candlesRouter.getCandles({
        symbol: asset,
        assetClass: "crypto",
        interval: "1h",
        limit: 2000
    });
    console.log("Candles received:", response.candles.length);
    const candles = response.candles.map((c) => ({
        time: c.timestamp,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close
    }));
    const results = await (0, backtest_engine_1.runBacktest)(asset, candles);
    console.log("\n===== BACKTEST RESULTS =====");
    console.log("Trades:", results.trades);
    console.log("Win Rate:", results.winRate.toFixed(2) + "%");
    console.log("Total Profit:", results.totalProfit);
    console.log("Wins:", results.wins);
    console.log("Losses:", results.losses);
}
startBacktest();
