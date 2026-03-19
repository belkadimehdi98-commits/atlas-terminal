import axios from "axios";

export type AssetClass =
  | "crypto"
  | "forex"
  | "metal"
  | "energy"
  | "index"
  | "stock"
  | "unknown";

export interface Candle {
  timestamp: number; // unix ms
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export interface CandleRequest {
  symbol: string;           // BTC, BTCUSDT, EURUSD, XAUUSD, BRENT, SPX, AAPL
  assetClass: AssetClass;
  interval: CandleInterval; // 1min, 5min, 15min, 30min, 1h, 4h, 1day
  limit?: number;
}

export type CandleInterval =
  | "1min"
  | "5min"
  | "15min"
  | "30min"
  | "1h"
  | "4h"
  | "1day";

export interface CandleProviderResult {
  provider: "binance" | "okx" | "alphavantage" | "stooq" | "eia";
  symbol: string;
  assetClass: AssetClass;
  interval: CandleInterval;
  candles: Candle[];
}

export class CandleRouterError extends Error {
  constructor(message: string, public readonly meta?: Record<string, unknown>) {
    super(message);
    this.name = "CandleRouterError";
  }
}

const BINANCE_BASE = "https://api.binance.com";
const BINANCE_MARKET_DATA_BASE = "https://data-api.binance.vision";
const OKX_BASE = "https://www.okx.com";
const ALPHA_VANTAGE_BASE = "https://www.alphavantage.co/query";
const EIA_BASE = "https://api.eia.gov/v2";
const STOOQ_BASE = "https://stooq.com/q/d/l/";

const DEFAULT_LIMIT = 200;
const CACHE_TTL_MS = 60_000;

type CacheEntry = {
  expiresAt: number;
  value: CandleProviderResult;
};

export class CandlesRouter {
  private readonly cache = new Map<string, CacheEntry>();

  async getCandles(req: CandleRequest): Promise<CandleProviderResult> {
    const normalized: CandleRequest = {
      ...req,
      symbol: req.symbol.trim().toUpperCase(),
      limit: req.limit ?? DEFAULT_LIMIT,
    };

    const cacheKey = `${normalized.assetClass}:${normalized.symbol}:${normalized.interval}:${normalized.limit}`;
    const cached = this.cache.get(cacheKey);

    if (cached && cached.expiresAt > Date.now()) {
      return cached.value;
    }

    let result: CandleProviderResult;

    switch (normalized.assetClass) {
      case "crypto":
        result = await this.tryProviders([
          () => this.fetchBinanceCandles(normalized),
          () => this.fetchOkxCandles(normalized),
        ], normalized);
        break;

      case "forex":
        result = await this.tryProviders([
          () => this.fetchAlphaVantageCandles(normalized),
          () => this.fetchStooqCandles(normalized),
        ], normalized);
        break;

      case "metal":
        result = await this.tryProviders([
          () => this.fetchAlphaVantageCandles(normalized),
          () => this.fetchStooqCandles(normalized),
        ], normalized);
        break;

      case "index":
      case "stock":
        result = await this.tryProviders([
          () => this.fetchAlphaVantageCandles(normalized),
          () => this.fetchStooqCandles(normalized),
        ], normalized);
        break;

      case "energy":
        result = await this.tryProviders([
          () => this.fetchEnergyCandles(normalized),
          () => this.fetchAlphaVantageCandles(normalized),
          () => this.fetchStooqCandles(normalized),
        ], normalized);
        break;

      default:
        throw new CandleRouterError("Unsupported asset class for candles routing", {
          request: normalized,
        });
    }

    this.cache.set(cacheKey, {
      expiresAt: Date.now() + CACHE_TTL_MS,
      value: result,
    });

    return result;
  }

  private async tryProviders(
    providers: Array<() => Promise<CandleProviderResult>>,
    req: CandleRequest
  ): Promise<CandleProviderResult> {
    const errors: unknown[] = [];

    for (const provider of providers) {
      try {
        const result = await provider();
        if (result.candles.length > 0) return result;
      } catch (err) {
        errors.push(err);
      }
    }

    throw new CandleRouterError("All candle providers failed", {
      request: req,
      errors: errors.map((e) => (e instanceof Error ? e.message : String(e))),
    });
  }

  private async fetchBinanceCandles(
    req: CandleRequest
  ): Promise<CandleProviderResult> {
    const interval = this.mapIntervalToBinance(req.interval);
    const symbol = this.normalizeCryptoSymbolForBinance(req.symbol);

    const response = await axios.get(`${BINANCE_MARKET_DATA_BASE}/api/v3/klines`, {
      params: {
        symbol,
        interval,
        limit: Math.min(req.limit ?? DEFAULT_LIMIT, 1000),
      },
      timeout: 12_000,
    });

    const candles: Candle[] = (response.data as any[]).map((row) => ({
      timestamp: Number(row[0]),
      open: Number(row[1]),
      high: Number(row[2]),
      low: Number(row[3]),
      close: Number(row[4]),
      volume: Number(row[5]),
    }));

    return {
      provider: "binance",
      symbol: req.symbol,
      assetClass: req.assetClass,
      interval: req.interval,
      candles: this.validateCandles(candles, req),
    };
  }

  private async fetchOkxCandles(
    req: CandleRequest
  ): Promise<CandleProviderResult> {
    const instId = this.normalizeCryptoSymbolForOkx(req.symbol);
    const bar = this.mapIntervalToOkx(req.interval);

    const response = await axios.get(`${OKX_BASE}/api/v5/market/candles`, {
      params: {
        instId,
        bar,
        limit: Math.min(req.limit ?? DEFAULT_LIMIT, 300),
      },
      timeout: 12_000,
    });

    const rows = response.data?.data;
    if (!Array.isArray(rows) || rows.length === 0) {
      throw new CandleRouterError("No candle data returned from OKX", {
        request: req,
      });
    }

    const candles: Candle[] = rows.map((row: any[]) => ({
      timestamp: Number(row[0]),
      open: Number(row[1]),
      high: Number(row[2]),
      low: Number(row[3]),
      close: Number(row[4]),
      volume: Number(row[5] ?? 0),
    }));

    return {
      provider: "okx",
      symbol: req.symbol,
      assetClass: req.assetClass,
      interval: req.interval,
      candles: this.validateCandles(candles, req),
    };
  }

  private async fetchAlphaVantageCandles(
    req: CandleRequest
  ): Promise<CandleProviderResult> {
    const apiKey = process.env.ALPHA_VANTAGE_KEY;
    if (!apiKey) {
      throw new CandleRouterError("Missing ALPHA_VANTAGE_KEY in environment");
    }

    if (req.assetClass === "forex") {
      return this.fetchAlphaVantageForex(req, apiKey);
    }

    if (req.assetClass === "stock" || req.assetClass === "index" || req.assetClass === "metal" || req.assetClass === "energy") {
      return this.fetchAlphaVantageAsset(req, apiKey);
    }

    throw new CandleRouterError("Alpha Vantage does not support this route", {
      request: req,
    });
  }

  private async fetchAlphaVantageForex(
    req: CandleRequest,
    apiKey: string
  ): Promise<CandleProviderResult> {
    const { fromSymbol, toSymbol } = this.normalizeForexSymbol(req.symbol);
    const interval = this.mapIntervalToAlphaVantage(req.interval);

    const response = await axios.get(ALPHA_VANTAGE_BASE, {
      params: {
        function: req.interval === "1day" ? "FX_DAILY" : "FX_INTRADAY",
        from_symbol: fromSymbol,
        to_symbol: toSymbol,
        interval: req.interval === "1day" ? undefined : interval,
        outputsize: "compact",
        apikey: apiKey,
      },
      timeout: 12_000,
    });

    const timeSeriesKey = Object.keys(response.data).find((k) =>
      k.toLowerCase().includes("time series")
    );

    const series = timeSeriesKey ? response.data[timeSeriesKey] : undefined;
    if (!series || typeof series !== "object") {
      throw new CandleRouterError("No forex candle data returned from Alpha Vantage", {
        request: req,
        providerError: response.data,
      });
    }

    const candles: Candle[] = Object.entries(series).map(([ts, row]: [string, any]) => ({
      timestamp: new Date(ts).getTime(),
      open: Number(row["1. open"]),
      high: Number(row["2. high"]),
      low: Number(row["3. low"]),
      close: Number(row["4. close"]),
    }));

    return {
      provider: "alphavantage",
      symbol: req.symbol,
      assetClass: req.assetClass,
      interval: req.interval,
      candles: this.validateCandles(candles, req),
    };
  }

  private async fetchAlphaVantageAsset(
    req: CandleRequest,
    apiKey: string
  ): Promise<CandleProviderResult> {
    const avSymbol = this.mapSymbolForAlphaVantage(req.symbol, req.assetClass);

    const isDaily = req.interval === "1day";
    const interval = this.mapIntervalToAlphaVantage(req.interval);

    const response = await axios.get(ALPHA_VANTAGE_BASE, {
      params: {
        function: isDaily ? "TIME_SERIES_DAILY" : "TIME_SERIES_INTRADAY",
        symbol: avSymbol,
        interval: isDaily ? undefined : interval,
        outputsize: "compact",
        apikey: apiKey,
      },
      timeout: 12_000,
    });

    const timeSeriesKey = Object.keys(response.data).find((k) =>
      k.toLowerCase().includes("time series")
    );

    const series = timeSeriesKey ? response.data[timeSeriesKey] : undefined;
    if (!series || typeof series !== "object") {
      throw new CandleRouterError("No asset candle data returned from Alpha Vantage", {
        request: req,
        providerError: response.data,
      });
    }

    const candles: Candle[] = Object.entries(series).map(([ts, row]: [string, any]) => ({
      timestamp: new Date(ts).getTime(),
      open: Number(row["1. open"]),
      high: Number(row["2. high"]),
      low: Number(row["3. low"]),
      close: Number(row["4. close"]),
      volume: row["5. volume"] !== undefined ? Number(row["5. volume"]) : undefined,
    }));

    return {
      provider: "alphavantage",
      symbol: req.symbol,
      assetClass: req.assetClass,
      interval: req.interval,
      candles: this.validateCandles(candles, req),
    };
  }

  private async fetchStooqCandles(
    req: CandleRequest
  ): Promise<CandleProviderResult> {
    const stooqSymbol = this.mapSymbolForStooq(req.symbol, req.assetClass);
    const interval = this.mapIntervalToStooq(req.interval);

    const response = await axios.get(STOOQ_BASE, {
      params: {
        s: stooqSymbol,
        i: interval,
      },
      timeout: 12_000,
      responseType: "text",
    });

    const text = typeof response.data === "string" ? response.data.trim() : "";
    if (!text || text.toLowerCase().includes("no data")) {
      throw new CandleRouterError("No data returned from Stooq", {
        request: req,
      });
    }

    const lines = text.split("\n").filter(Boolean);
    if (lines.length < 2) {
      throw new CandleRouterError("Stooq response too short", {
        request: req,
        raw: text,
      });
    }

    const candles: Candle[] = lines.slice(1).map((line) => {
      const parts = line.split(",");
      const date = parts[0];
      const time = parts.length >= 6 && /^\d{2}:\d{2}(:\d{2})?$/.test(parts[1]) ? parts[1] : "";
      const offset = time ? 1 : 0;

      const open = Number(parts[1 + offset]);
      const high = Number(parts[2 + offset]);
      const low = Number(parts[3 + offset]);
      const close = Number(parts[4 + offset]);
      const volume = parts[5 + offset] !== undefined ? Number(parts[5 + offset]) : undefined;

      const iso = time ? `${date}T${time}` : `${date}T00:00:00`;

      return {
        timestamp: new Date(iso).getTime(),
        open,
        high,
        low,
        close,
        volume,
      };
    });

    return {
      provider: "stooq",
      symbol: req.symbol,
      assetClass: req.assetClass,
      interval: req.interval,
      candles: this.validateCandles(candles, req),
    };
  }

  private async fetchEnergyCandles(
    req: CandleRequest
  ): Promise<CandleProviderResult> {
    const eiaKey = process.env.EIA_API_KEY;
    if (!eiaKey) {
      throw new CandleRouterError("Missing EIA_API_KEY in environment");
    }

    if (!this.isEiaSymbol(req.symbol)) {
      throw new CandleRouterError("Unsupported EIA energy symbol", {
        symbol: req.symbol,
      });
    }

    return this.fetchEiaEnergySeries(req, eiaKey);
  }

  private async fetchEiaEnergySeries(
    req: CandleRequest,
    apiKey: string
  ): Promise<CandleProviderResult> {
    const seriesPath = this.mapEiaSeries(req.symbol);
    if (!seriesPath) {
      throw new CandleRouterError("Unsupported EIA energy symbol", {
        symbol: req.symbol,
      });
    }

    const response = await axios.get(`${EIA_BASE}/${seriesPath}`, {
      params: {
        api_key: apiKey,
        length: req.limit,
        sort: JSON.stringify([{ column: "period", direction: "asc" }]),
      },
      timeout: 12_000,
    });

    const data = response.data?.response?.data;
    if (!Array.isArray(data) || data.length === 0) {
      throw new CandleRouterError("No EIA energy data returned", {
        request: req,
      });
    }

    const candles: Candle[] = data.map((row: any) => {
      const close = Number(row.value);
      const ts = this.parseEiaPeriod(row.period);
      return {
        timestamp: ts,
        open: close,
        high: close,
        low: close,
        close,
      };
    });

    return {
      provider: "eia",
      symbol: req.symbol,
      assetClass: req.assetClass,
      interval: req.interval,
      candles: this.validateCandles(candles, req),
    };
  }

  private validateCandles(candles: Candle[], req: CandleRequest): Candle[] {
    if (!candles.length) {
      throw new CandleRouterError("Empty candles after normalization", {
        request: req,
      });
    }

    const cleaned = candles
      .filter(
        (c) =>
          Number.isFinite(c.timestamp) &&
          Number.isFinite(c.open) &&
          Number.isFinite(c.high) &&
          Number.isFinite(c.low) &&
          Number.isFinite(c.close)
      )
      .sort((a, b) => a.timestamp - b.timestamp);

    if (!cleaned.length) {
      throw new CandleRouterError("All candles invalid after validation", {
        request: req,
      });
    }

    return cleaned;
  }

  private normalizeCryptoSymbolForBinance(symbol: string): string {
    const upper = symbol.toUpperCase();
    return upper.endsWith("USDT") ? upper : `${upper}USDT`;
  }

  private normalizeCryptoSymbolForOkx(symbol: string): string {
    const upper = symbol.toUpperCase().replace(/-USDT$/, "").replace(/USDT$/, "");
    return `${upper}-USDT`;
  }

  private normalizeForexSymbol(symbol: string): { fromSymbol: string; toSymbol: string } {
    const upper = symbol.toUpperCase().replace("/", "");
    if (upper.length !== 6) {
      throw new CandleRouterError("Invalid forex symbol format", { symbol });
    }

    return {
      fromSymbol: upper.slice(0, 3),
      toSymbol: upper.slice(3, 6),
    };
  }

  private mapSymbolForAlphaVantage(symbol: string, assetClass: AssetClass): string {
    const upper = symbol.toUpperCase();

    const customMap: Record<string, string> = {
      SPX: "SPY",
      NDX: "QQQ",
      DJI: "DIA",
      RUT: "IWM",
      DAX: "^GDAXI",
      FTSE: "^FTSE",
      CAC40: "^FCHI",
      EUROSTOXX: "^STOXX50E",
      NIKKEI: "^N225",
      HANGSENG: "^HSI",
      GOLD: "GLD",
      SILVER: "SLV",
      COPPER: "CPER",
      PLATINUM: "PPLT",
      BRENT: "BZ=F",
      WTI: "CL=F",
      NATGAS: "NG=F",
    };

    if (assetClass === "metal" && upper === "XAUUSD") return "GLD";
    if (assetClass === "metal" && upper === "XAGUSD") return "SLV";

    return customMap[upper] ?? upper;
  }

  private mapSymbolForStooq(symbol: string, assetClass: AssetClass): string {
    const upper = symbol.toUpperCase();

    if (assetClass === "stock") {
      return upper.toLowerCase() + ".us";
    }

    const map: Record<string, string> = {
      SPX: "^spx",
      DJI: "^dji",
      NDX: "^ndq",
      RUT: "^rut",
      DAX: "^dax",
      FTSE: "^ukx",
      CAC40: "^cac",
      NIKKEI: "^nkx",
      HANGSENG: "^hsi",
      GOLD: "xauusd",
      SILVER: "xagusd",
      XAUUSD: "xauusd",
      XAGUSD: "xagusd",
      EURUSD: "eurusd",
      GBPUSD: "gbpusd",
      USDJPY: "usdjpy",
      USDCHF: "usdchf",
      USDCAD: "usdcad",
      AUDUSD: "audusd",
      NZDUSD: "nzdusd",
      BRENT: "cb.f",
      WTI: "cl.f",
      NATGAS: "ng.f",
    };

    return map[upper] ?? upper.toLowerCase();
  }

  private mapIntervalToBinance(interval: CandleInterval): string {
    const map: Record<CandleInterval, string> = {
      "1min": "1m",
      "5min": "5m",
      "15min": "15m",
      "30min": "30m",
      "1h": "1h",
      "4h": "4h",
      "1day": "1d",
    };
    return map[interval];
  }

  private mapIntervalToOkx(interval: CandleInterval): string {
    const map: Record<CandleInterval, string> = {
      "1min": "1m",
      "5min": "5m",
      "15min": "15m",
      "30min": "30m",
      "1h": "1H",
      "4h": "4H",
      "1day": "1D",
    };
    return map[interval];
  }

  private mapIntervalToAlphaVantage(interval: CandleInterval): string {
    const map: Partial<Record<CandleInterval, string>> = {
      "1min": "1min",
      "5min": "5min",
      "15min": "15min",
      "30min": "30min",
      "1h": "60min",
    };

    const mapped = map[interval];
    if (!mapped) {
      throw new CandleRouterError("Alpha Vantage interval not supported for this route", {
        interval,
      });
    }

    return mapped;
  }

  private mapIntervalToStooq(interval: CandleInterval): string {
    const map: Record<CandleInterval, string> = {
      "1min": "1",
      "5min": "5",
      "15min": "15",
      "30min": "30",
      "1h": "60",
      "4h": "240",
      "1day": "d",
    };
    return map[interval];
  }

  private isEiaSymbol(symbol: string): boolean {
    return ["WTI", "BRENT", "NATGAS", "NG"].includes(symbol.toUpperCase());
  }

  private mapEiaSeries(symbol: string): string | null {
    const upper = symbol.toUpperCase();

    const map: Record<string, string> = {
      WTI: "petroleum/pri/spt/data/?frequency=daily&data[0]=value&facets[product][]=EPCWTI",
      BRENT: "petroleum/pri/spt/data/?frequency=daily&data[0]=value&facets[product][]=EPCBRENT",
      NATGAS: "natural-gas/pri/fut/data/?frequency=daily&data[0]=value",
      NG: "natural-gas/pri/fut/data/?frequency=daily&data[0]=value",
    };

    return map[upper] ?? null;
  }

  private parseEiaPeriod(period: string): number {
    if (/^\d{4}-\d{2}-\d{2}$/.test(period)) {
      return new Date(period).getTime();
    }

    if (/^\d{8}$/.test(period)) {
      const yyyy = period.slice(0, 4);
      const mm = period.slice(4, 6);
      const dd = period.slice(6, 8);
      return new Date(`${yyyy}-${mm}-${dd}`).getTime();
    }

    return new Date(period).getTime();
  }
}

export const candlesRouter = new CandlesRouter();