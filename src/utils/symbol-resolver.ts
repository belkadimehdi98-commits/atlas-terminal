export class SymbolResolver {

  private static map: Record<string, string> = {

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

  static resolve(input: string): string {

    const key = input.toLowerCase().trim();

    if (this.map[key]) {
      return this.map[key];
    }

    return input.toUpperCase();

  }

}