import axios from "axios";

export interface NewsItem {
  title: string;
  source: string;
  url: string;
  publishedAt: string;
}

export class NewsFeed {

  private apiKey: string;

  constructor() {
    if (!process.env.NEWS_API_KEY) {
      throw new Error("NEWS_API_KEY missing in environment variables");
    }

    this.apiKey = process.env.NEWS_API_KEY;
  }

  async fetchMarketNews(asset: string): Promise<NewsItem[]> {

    const a = asset.toUpperCase();

    let query = "economy OR inflation OR central bank";

    /* ===============================
       CRYPTO
    =============================== */

    const cryptoAssets = [
      "BTC","ETH","SOL","BNB","XRP","ADA","AVAX","LINK","MATIC","DOGE"
    ];

    if (cryptoAssets.includes(a)) {
      query =
        "crypto OR bitcoin OR ethereum OR binance OR stablecoin OR crypto regulation OR SEC crypto OR crypto market";
    }

    /* ===============================
       FOREX
    =============================== */

    const forexAssets = [
      "EURUSD","GBPUSD","USDJPY","USDCHF","USDCAD","AUDUSD","NZDUSD"
    ];

    if (forexAssets.includes(a)) {
      query =
        "central bank OR interest rates OR inflation OR monetary policy OR forex market OR bond yields OR currency markets";
    }

    /* ===============================
       COMMODITIES
    =============================== */

    const commodities = [
      "GOLD","SILVER","OIL","BRENT","NATGAS","COPPER"
    ];

    if (commodities.includes(a)) {
      query =
        "oil supply OR OPEC OR commodities market OR energy crisis OR geopolitical tensions OR sanctions OR war OR energy prices";
    }

    /* ===============================
       STOCKS
    =============================== */

    const equities = [
      "AAPL","MSFT","GOOGL","AMZN","TSLA","NVDA","META"
    ];

    if (equities.includes(a)) {
      query =
        "earnings OR revenue OR guidance OR stock market OR corporate outlook OR tech sector OR company results";
    }

    const url =
      `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&language=en&sortBy=publishedAt&pageSize=20&apiKey=${this.apiKey}`;

    const res = await axios.get(url);

    return res.data.articles.map((a: any) => ({
      title: a.title,
      source: a.source?.name || "Unknown",
      url: a.url,
      publishedAt: a.publishedAt
    }));
  }
}