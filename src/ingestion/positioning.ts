import axios from "axios";

export async function fetchPositioningData(symbol: string) {

  const pair = symbol.endsWith("USDT") ? symbol : symbol + "USDT";

  try {

    const [fundingRes, oiRes, ratioRes] = await Promise.all([

      axios.get(`https://fapi.binance.com/fapi/v1/premiumIndex`, {
        params: { symbol: pair },
        timeout: 3000
      }),

      axios.get(`https://fapi.binance.com/fapi/v1/openInterest`, {
        params: { symbol: pair },
        timeout: 3000
      }),

      axios.get(`https://fapi.binance.com/futures/data/globalLongShortAccountRatio`, {
        params: { symbol: pair, period: "5m", limit: 1 },
        timeout: 3000
      })

    ]);

    return {
      fundingRate: parseFloat(fundingRes.data?.lastFundingRate || "0"),
      openInterest: parseFloat(oiRes.data?.openInterest || "0"),
      longShortRatio: parseFloat(ratioRes.data?.[0]?.longShortRatio || "1")
    };

  } catch (err: any) {

    console.error("POSITIONING BLOCKED:", err.message);

    return null;
  }
}