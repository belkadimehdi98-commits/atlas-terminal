"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.marketRouter = exports.MarketRouter = void 0;
const axios_1 = __importDefault(require("axios"));
class MarketRouter {
    constructor() {
        this.source = "Unknown";
    }
    /* =========================================================
       FAST PROVIDER FAILOVER
    ========================================================= */
    async fastFallback(tasks) {
        for (const task of tasks) {
            try {
                const price = await task.fn();
                if (price && !isNaN(price)) {
                    this.source = task.name;
                    return price;
                }
            }
            catch (_a) { }
        }
console.error("ALL PROVIDERS FAILED — returning fallback");
this.source = "fallback";
return 0;
    }
    /* =========================================================
       MAIN ENTRY
    ========================================================= */
    async getPrice(symbol) {
        var _a;
        symbol = symbol.toUpperCase();
        const symbolMap = {
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
        symbol = (_a = symbolMap[symbol]) !== null && _a !== void 0 ? _a : symbol;
        /* =========================================================
           CRYPTO
        ========================================================= */
if (symbol.endsWith("USDT")) {
    return this.fastFallback([
        { fn: async () => { console.log("TRYING: Binance"); return this.binancePrice(symbol); }, name: "Binance REST API" },
        { fn: async () => { console.log("TRYING: CoinGecko"); return this.coinGeckoPrice(symbol); }, name: "CoinGecko API" },
        { fn: async () => { console.log("TRYING: CoinCap"); return this.coinCapPrice(symbol); }, name: "CoinCap API" },
        { fn: async () => { console.log("TRYING: CryptoCompare"); return this.cryptoComparePrice(symbol); }, name: "CryptoCompare API" }
    ]);
}
        /* =========================================================
           FOREX
        ========================================================= */
        if (symbol.includes("USD") && symbol.length === 6) {
            return this.fastFallback([
                { fn: () => this.frankfurterPrice(symbol), name: "Frankfurter FX API" },
                { fn: () => this.currencyFreaksPrice(symbol), name: "CurrencyFreaks API" },
                { fn: () => this.exchangeRateHost(symbol), name: "ExchangeRate Host API" }
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
                { fn: () => this.eiaOil(symbol), name: "US EIA Energy API" }
            ]);
        }
        if (symbol === "NATGAS") {
            return this.fastFallback([
                { fn: () => this.alphaVantageGas(), name: "AlphaVantage Gas API" },
                { fn: () => this.eiaGas(), name: "US EIA Natural Gas API" }
            ]);
        }
        /* =========================================================
           INDICES
        ========================================================= */
        if (["SPX", "NASDAQ", "DAX", "FTSE", "DJI"].includes(symbol)) {
            return this.fastFallback([
                { fn: () => this.yahooIndex(symbol), name: "Yahoo Finance API" },
                { fn: () => this.twelveDataIndex(symbol), name: "TwelveData Index API" }
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
                { fn: () => this.yahooStock(symbol), name: "Yahoo Finance API" }
            ]);
        }
        throw new Error(`No provider for ${symbol}`);
    }
    /* =========================================================
       CRYPTO PROVIDERS
    ========================================================= */
    async binancePrice(symbol) {
        const url = `${process.env.BINANCE_BASE}/api/v3/ticker/price?symbol=${symbol}`;
        const r = await axios_1.default.get(url);
        return Number(r.data.price);
    }
    async coinGeckoPrice(symbol) {
        var _a;
        const id = symbol.replace("USDT", "").toLowerCase();
        const url = `https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=usd`;
        const r = await axios_1.default.get(url);
        return Number((_a = r.data[id]) === null || _a === void 0 ? void 0 : _a.usd);
    }
    async coinCapPrice(symbol) {
        var _a, _b;
        const id = symbol.replace("USDT", "").toLowerCase();
        const url = `https://api.coincap.io/v2/assets/${id}`;
        const r = await axios_1.default.get(url);
        return Number((_b = (_a = r.data) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.priceUsd);
    }
    async cryptoComparePrice(symbol) {
        const base = symbol.replace("USDT", "");
        const url = `https://min-api.cryptocompare.com/data/price?fsym=${base}&tsyms=USD`;
        const r = await axios_1.default.get(url);
        return Number(r.data.USD);
    }
    /* =========================================================
       FOREX
    ========================================================= */
    async frankfurterPrice(pair) {
        const base = pair.slice(0, 3);
        const quote = pair.slice(3, 6);
        const r = await axios_1.default.get(`https://api.frankfurter.app/latest?from=${base}&to=${quote}`);
        return Number(r.data.rates[quote]);
    }
    async currencyFreaksPrice(pair) {
        const quote = pair.slice(3, 6);
        const r = await axios_1.default.get(`${process.env.CURRENCYFREAKS_BASE}/latest?apikey=${process.env.CURRENCYFREAKS_KEY}`);
        return Number(r.data.rates[quote]);
    }
    async exchangeRateHost(pair) {
        const base = pair.slice(0, 3);
        const quote = pair.slice(3, 6);
        const r = await axios_1.default.get(`${process.env.FX_BASE}/latest?base=${base}&symbols=${quote}`);
        return Number(r.data.rates[quote]);
    }
    /* =========================================================
       METALS
    ========================================================= */
    async twelveDataMetal(symbol) {
        const pair = symbol === "XAUUSD" ? "XAU/USD" : "XAG/USD";
        const r = await axios_1.default.get(`https://api.twelvedata.com/price?symbol=${pair}&apikey=${process.env.TWELVE_DATA_KEY}`);
        return Number(r.data.price);
    }
    async metalsAPI(symbol) {
        var _a;
        const metal = symbol === "XAUUSD" ? "XAU" : "XAG";
        const r = await axios_1.default.get(`${process.env.METALS_API_BASE}/latest?base=${metal}`);
        return Number((_a = r.data.rates) === null || _a === void 0 ? void 0 : _a.USD);
    }
    /* =========================================================
       ENERGY
    ========================================================= */
    async alphaVantageOil(symbol) {
        var _a, _b, _c, _d;
        const key = (_a = process.env.ALPHA_VANTAGE_KEYS) === null || _a === void 0 ? void 0 : _a.split(",")[0];
        const fn = symbol === "BRENT" ? "BRENT" : "WTI";
        const r = await axios_1.default.get(`${process.env.COMMODITIES_BASE}?function=${fn}&interval=daily&apikey=${key}`);
        return Number((_d = (_c = (_b = r.data) === null || _b === void 0 ? void 0 : _b.data) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.value);
    }
    async alphaVantageGas() {
        var _a, _b, _c, _d;
        const key = (_a = process.env.ALPHA_VANTAGE_KEYS) === null || _a === void 0 ? void 0 : _a.split(",")[0];
        const r = await axios_1.default.get(`${process.env.COMMODITIES_BASE}?function=NATURAL_GAS&interval=daily&apikey=${key}`);
        return Number((_d = (_c = (_b = r.data) === null || _b === void 0 ? void 0 : _b.data) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.value);
    }
    async eiaOil(symbol) {
        var _a, _b, _c, _d;
        const r = await axios_1.default.get(`${process.env.EIA_BASE}/petroleum/pri/spt/data/?api_key=${process.env.EIA_API_KEY}`);
        return Number((_d = (_c = (_b = (_a = r.data) === null || _a === void 0 ? void 0 : _a.response) === null || _b === void 0 ? void 0 : _b.data) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.value);
    }
    async eiaGas() {
        var _a, _b, _c, _d;
        const r = await axios_1.default.get(`${process.env.EIA_BASE}/natural-gas/pri/fut/data/?api_key=${process.env.EIA_API_KEY}`);
        return Number((_d = (_c = (_b = (_a = r.data) === null || _a === void 0 ? void 0 : _a.response) === null || _b === void 0 ? void 0 : _b.data) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.value);
    }
    /* =========================================================
       INDICES
    ========================================================= */
    async yahooIndex(symbol) {
        const map = {
            SPX: "^GSPC",
            NASDAQ: "^IXIC",
            DAX: "^GDAXI",
            FTSE: "^FTSE",
            DJI: "^DJI"
        };
        const r = await axios_1.default.get(`${process.env.YAHOO_BASE}/v7/finance/quote?symbols=${map[symbol]}`);
        return r.data.quoteResponse.result[0].regularMarketPrice;
    }
    async twelveDataIndex(symbol) {
        const r = await axios_1.default.get(`https://api.twelvedata.com/price?symbol=${symbol}&apikey=${process.env.TWELVE_DATA_KEY}`);
        return Number(r.data.price);
    }
    /* =========================================================
       STOCKS
    ========================================================= */
    async polygonStock(symbol) {
        const r = await axios_1.default.get(`${process.env.POLYGON_BASE}/v2/last/trade/${symbol}?apiKey=${process.env.POLYGON_KEY}`);
        return r.data.results.p;
    }
    async finnhubStock(symbol) {
        const r = await axios_1.default.get(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${process.env.FINNHUB_KEY}`);
        return Number(r.data.c);
    }
    async twelveDataStock(symbol) {
        const r = await axios_1.default.get(`https://api.twelvedata.com/price?symbol=${symbol}&apikey=${process.env.TWELVE_DATA_KEY}`);
        return Number(r.data.price);
    }
    async yahooStock(symbol) {
        const r = await axios_1.default.get(`${process.env.YAHOO_BASE}/v7/finance/quote?symbols=${symbol}`);
        return r.data.quoteResponse.result[0].regularMarketPrice;
    }
}
exports.MarketRouter = MarketRouter;
exports.marketRouter = new MarketRouter();
