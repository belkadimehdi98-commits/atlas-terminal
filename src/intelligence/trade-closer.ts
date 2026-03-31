import fs from "fs";
import { MarketRouter } from "../ingestion/market-router";

export async function closeTrades() {

  const router = new MarketRouter();

let openTrades: any[] = [];

try {
  const raw = fs.readFileSync("open-trades.json", "utf-8");
  openTrades = raw ? JSON.parse(raw) : [];
} catch {
  openTrades = [];
}

  const remainingTrades: any[] = [];

  for (const trade of openTrades) {

    let price;

try {
  price = await router.getPrice(trade.asset);
} catch {
  continue;
}

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

      const profit =
        trade.direction === "BUY"
          ? exit - trade.entry
          : trade.entry - exit;

      fs.appendFileSync(
        "track-record.json",
        JSON.stringify({
          asset: trade.asset,
          entry: trade.entry,
          exit,
          profit,
          timestamp: Date.now()
        }) + "\n"
      );

    } else {
      remainingTrades.push(trade);
    }

  }

  fs.writeFileSync(
    "open-trades.json",
    JSON.stringify(remainingTrades, null, 2)
  );
}