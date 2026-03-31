import axios from "axios";
const HTTP_TIMEOUT = 4000;
export class MarketRouter {

  public source: string = "Unknown";

  /* =========================================================
     FAST PROVIDER FAILOVER
  ========================================================= */

private async fastFallback(
  tasks: { fn: () => Promise<number>, name: string }[]
): Promise<number> {

  for (const task of tasks) {

    try {

      const price = await task.fn();

      if (price !== null && price !== undefined && !isNaN(price) && price > 0) {

        this.source = task.name;

        return price;

      }

    } catch (err) {
      console.error(`Provider failed: ${task.name}`, err);
    }

  }

  console.error("ALL PROVIDERS FAILED — returning fallback");

  this.source = "failed";

 throw new Error("All providers failed");

}
  

  /* =========================================================
     MAIN ENTRY
  ========================================================= */

  async getPrice(symbol: string): Promise<number> {

    symbol = symbol.toUpperCase();

    const symbolMap: Record<string,string> = {

      /* CRYPTO */
      BTC: "BTCUSDT",
      ETH: "ETHUSDT",
      SOL: "SOLUSDT",
      BNB: "BNBUSDT",
      XRP: "XRPUSDT",
      ADA: "ADAUSDT",
      AVAX: "AVAXUSDT",
      LINK: "LINKUSDT",
      MATIC: "MATICUSDT",
      DOGE: "DOGEUSDT",

      /* METALS */
      GOLD: "XAUUSD",
      SILVER: "XAGUSD",

      /* ENERGY */
      OIL: "WTI",
      BRENT: "BRENT",
      NATGAS: "NATGAS",

      /* INDICES */
      SPX: "SPX",
      NAS100: "NASDAQ",
      NDX: "NASDAQ",
      DJI: "DJI",
      US30: "DJI",

      /* STOCKS */
      AAPL: "AAPL",
      MSFT: "MSFT",
      NVDA: "NVDA",
      TSLA: "TSLA",
      META: "META",
      AMZN: "AMZN"
    };

    symbol = symbolMap[symbol] ?? symbol;

    /* =========================================================
       CRYPTO
    ========================================================= */

    if (symbol.endsWith("USDT")) {

return this.fastFallback(
  [
    { fn: () => this.binancePrice(symbol), name: "Binance API" },
    { fn: () => this.coinGeckoPrice(symbol), name: "CoinGecko API" },
    { fn: () => this.coinCapPrice(symbol), name: "CoinCap API" },
{ fn: () => this.cryptoComparePrice(symbol), name: "CryptoCompare API" },
{ fn: () => this.fcsCryptoPrice(symbol), name: "FCS API" }
  ].map(t => ({
    name: t.name,
    fn: async () => {
      console.log("TRYING:", t.name);
      return await t.fn();
    }
  }))
);
    }

    /* =========================================================
       FOREX
    ========================================================= */

    if (symbol.includes("USD") && symbol.length === 6) {

return this.fastFallback([
  { fn: () => this.frankfurterPrice(symbol), name: "Frankfurter FX API" },
  { fn: () => this.currencyFreaksPrice(symbol), name: "CurrencyFreaks API" },
  { fn: () => this.exchangeRateHost(symbol), name: "ExchangeRate Host API" },
  { fn: () => this.fcsForexPrice(symbol), name: "FCS API" }
]);
    }

    /* =========================================================
       METALS
    ========================================================= */

    if (symbol === "XAUUSD" || symbol === "XAGUSD") {

return this.fastFallback([
  { fn: () => this.twelveDataMetal(symbol), name: "TwelveData Metals API" },
  { fn: () => this.metalsAPI(symbol), name: "MetalsAPI" }
]);
    }

    /* =========================================================
       ENERGY
    ========================================================= */

    if (symbol === "WTI" || symbol === "BRENT") {

return this.fastFallback([
  { fn: () => this.alphaVantageOil(symbol), name: "AlphaVantage Commodities API" },
  { fn: () => this.eiaOil(symbol), name: "US EIA Energy API" },
  { fn: () => this.fcsCommodityPrice(symbol), name: "FCS API" }
]);
    }

    if (symbol === "NATGAS") {

return this.fastFallback([
  { fn: () => this.alphaVantageGas(), name: "AlphaVantage Gas API" },
  { fn: () => this.eiaGas(), name: "US EIA Natural Gas API" },
  { fn: () => this.fcsCommodityPrice("NATGAS"), name: "FCS API" }
]);
    }

    /* =========================================================
       INDICES
    ========================================================= */

    if (["SPX","NASDAQ","DAX","FTSE","DJI"].includes(symbol)) {

return this.fastFallback([
  { fn: () => this.yahooIndex(symbol), name: "Yahoo Finance API" },
  { fn: () => this.twelveDataIndex(symbol), name: "TwelveData Index API" },
  { fn: () => this.fcsIndexPrice(symbol), name: "FCS API" }
]);
    }

    /* =========================================================
       STOCKS
    ========================================================= */

    if (/^[A-Z]{1,5}$/.test(symbol)) {

return this.fastFallback([
  { fn: () => this.polygonStock(symbol), name: "Polygon Market Data API" },
  { fn: () => this.finnhubStock(symbol), name: "Finnhub Market API" },
  { fn: () => this.twelveDataStock(symbol), name: "TwelveData Stocks API" },
  { fn: () => this.yahooStock(symbol), name: "Yahoo Finance API" },
  { fn: () => this.fcsStockPrice(symbol), name: "FCS API" }
]);
    }

    throw new Error(`No provider for ${symbol}`);
  }

  /* =========================================================
     CRYPTO PROVIDERS
  ========================================================= */

  private async binancePrice(symbol:string) {

const base = "https://data-api.binance.vision";

const url =
  `${base}/api/v3/ticker/price?symbol=${symbol}`;

    const r = await axios.get(url);

    return Number(r.data.price);
  }

private async coinGeckoPrice(symbol:string) {

  const map: any = {
    BTC: "bitcoin",
    ETH: "ethereum",
    SOL: "solana",
    BNB: "binancecoin",
    XRP: "ripple",
    ADA: "cardano",
    AVAX: "avalanche-2",
    LINK: "chainlink",
    MATIC: "polygon",
    DOGE: "dogecoin"
  };

  const base = symbol.replace("USDT","");
  const id = map[base];

  if (!id) throw new Error("CoinGecko mapping missing");

  const url =
    `https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=usd`;

  const r = await axios.get(url, { timeout: HTTP_TIMEOUT });

  return Number(r.data[id]?.usd);
}


  private async cryptoComparePrice(symbol:string) {

    const base = symbol.replace("USDT","");

    const url =
      `https://min-api.cryptocompare.com/data/price?fsym=${base}&tsyms=USD`;

    const r = await axios.get(url);

    return Number(r.data.USD);
  }

private async fcsCryptoPrice(symbol: string) {

  const key = process.env.FCS_KEY;

  const base = symbol.replace("USDT","");

  const formatted = base + "/USD";

  const r = await axios.get(
    `https://fcsapi.com/api-v3/crypto/latest?symbol=${formatted}&access_key=${key}`
  );

  return Number(r.data?.response?.[0]?.c);
}
  /* =========================================================
     FOREX
  ========================================================= */

  private async frankfurterPrice(pair:string) {

    const base = pair.slice(0,3);
    const quote = pair.slice(3,6);

    const r = await axios.get(
      `https://api.frankfurter.app/latest?from=${base}&to=${quote}`
    );

    return Number(r.data.rates[quote]);
  }

  private async currencyFreaksPrice(pair:string) {

    const quote = pair.slice(3,6);

    const r = await axios.get(
      `${process.env.CURRENCYFREAKS_BASE}/latest?apikey=${process.env.CURRENCYFREAKS_KEY}`
    );

    return Number(r.data.rates[quote]);
  }

  private async exchangeRateHost(pair:string) {

    const base = pair.slice(0,3);
    const quote = pair.slice(3,6);

    const r = await axios.get(
      `${process.env.FX_BASE}/latest?base=${base}&symbols=${quote}`
    );

    return Number(r.data.rates[quote]);
  }
private async fcsForexPrice(pair: string) {

  const key = process.env.FCS_KEY;

  const formatted =
    pair.slice(0,3) + "/" + pair.slice(3,6);

  const r = await axios.get(
    `https://fcsapi.com/api-v3/forex/latest?symbol=${formatted}&access_key=${key}`
  );

  return Number(r.data?.response?.[0]?.c);
}

  /* =========================================================
     METALS
  ========================================================= */

  private async twelveDataMetal(symbol:string) {

    const pair =
      symbol === "XAUUSD" ? "XAU/USD" : "XAG/USD";

    const r = await axios.get(
      `https://api.twelvedata.com/price?symbol=${pair}&apikey=${process.env.TWELVE_DATA_KEY}`
    );

    return Number(r.data.price);
  }

  private async metalsAPI(symbol:string) {

    const metal =
      symbol === "XAUUSD" ? "XAU" : "XAG";

    const r = await axios.get(
      `${process.env.METALS_API_BASE}/latest?base=${metal}`
    );

    return Number(r.data.rates?.USD);
  }

  /* =========================================================
     ENERGY
  ========================================================= */

  private async alphaVantageOil(symbol:string) {

     const key = process.env.ALPHA_VANTAGE_KEY;

    const fn =
      symbol === "BRENT" ? "BRENT" : "WTI";

    const r = await axios.get(
      `${process.env.COMMODITIES_BASE}?function=${fn}&interval=daily&apikey=${key}`
    );

    return Number(r.data?.data?.[0]?.value);
  }

  private async alphaVantageGas() {

      const key = process.env.ALPHA_VANTAGE_KEY;

    const r = await axios.get(
      `${process.env.COMMODITIES_BASE}?function=NATURAL_GAS&interval=daily&apikey=${key}`
    );

    return Number(r.data?.data?.[0]?.value);
  }

  private async eiaOil(symbol:string) {

    const r = await axios.get(
      `${process.env.EIA_BASE}/petroleum/pri/spt/data/?api_key=${process.env.EIA_API_KEY}`
    );

    return Number(r.data?.response?.data?.[0]?.value);
  }

  private async eiaGas() {

    const r = await axios.get(
      `${process.env.EIA_BASE}/natural-gas/pri/fut/data/?api_key=${process.env.EIA_API_KEY}`
    );

    return Number(r.data?.response?.data?.[0]?.value);
  }
private async fcsCommodityPrice(symbol: string) {

  const key = process.env.FCS_KEY;

  const map: any = {
    WTI: "WTI",
    BRENT: "BRENT",
    NATGAS: "NATURAL_GAS"
  };

  const r = await axios.get(
    `https://fcsapi.com/api-v3/commodity/latest?symbol=${map[symbol]}&access_key=${key}`
  );

  return Number(r.data?.response?.[0]?.c);
}
  /* =========================================================
     INDICES
  ========================================================= */

  private async yahooIndex(symbol:string) {

    const map:any = {
      SPX:"^GSPC",
      NASDAQ:"^IXIC",
      DAX:"^GDAXI",
      FTSE:"^FTSE",
      DJI:"^DJI"
    };

    const r = await axios.get(
      `${process.env.YAHOO_BASE}/v7/finance/quote?symbols=${map[symbol]}`
    );

    return r.data.quoteResponse.result[0].regularMarketPrice;
  }

  private async twelveDataIndex(symbol:string) {

    const r = await axios.get(
      `https://api.twelvedata.com/price?symbol=${symbol}&apikey=${process.env.TWELVE_DATA_KEY}`
    );

    return Number(r.data.price);
  }
private async fcsIndexPrice(symbol: string) {

  const key = process.env.FCS_KEY;

  const r = await axios.get(
    `https://fcsapi.com/api-v3/index/latest?symbol=${symbol}&access_key=${key}`
  );

  return Number(r.data?.response?.[0]?.c);
}
  /* =========================================================
     STOCKS
  ========================================================= */

  private async polygonStock(symbol:string) {

    const r = await axios.get(
      `${process.env.POLYGON_BASE}/v2/last/trade/${symbol}?apiKey=${process.env.POLYGON_KEY}`
    );

    return r.data.results.p;
  }

  private async finnhubStock(symbol:string) {

    const r = await axios.get(
      `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${process.env.FINNHUB_KEY}`
    );

    return Number(r.data.c);
  }

  private async twelveDataStock(symbol:string) {

    const r = await axios.get(
      `https://api.twelvedata.com/price?symbol=${symbol}&apikey=${process.env.TWELVE_DATA_KEY}`
    );

    return Number(r.data.price);
  }

  private async yahooStock(symbol:string) {

    const r = await axios.get(
      `${process.env.YAHOO_BASE}/v7/finance/quote?symbols=${symbol}`
    );

    return r.data.quoteResponse.result[0].regularMarketPrice;
  }
private async fcsStockPrice(symbol: string) {

  const key = process.env.FCS_KEY;

  const r = await axios.get(
    `https://fcsapi.com/api-v3/stock/latest?symbol=${symbol}&access_key=${key}`
  );

  return Number(r.data?.response?.[0]?.c);
}
}

export const marketRouter = new MarketRouter();