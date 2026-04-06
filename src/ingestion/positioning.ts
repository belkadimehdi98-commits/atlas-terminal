import axios from "axios";

export async function fetchPositioningData(symbol: string) {

  const pair = symbol.endsWith("USDT") ? symbol : symbol + "USDT";

  try {

    const funding = await axios.get(
      `https://data-api.binance.vision/fapi/v1/premiumIndex?symbol=${pair}`
    );

    const oi = await axios.get(
      `https://data-api.binance.vision/fapi/v1/openInterest?symbol=${pair}`
    );

    const ratio = await axios.get(
      `https://data-api.binance.vision/futures/data/globalLongShortAccountRatio?symbol=${pair}&period=5m&limit=1`
    );

    return {
      fundingRate: parseFloat(funding.data.lastFundingRate || "0"),
      openInterest: parseFloat(oi.data.openInterest || "0"),
      longShortRatio: parseFloat(ratio.data?.[0]?.longShortRatio || "1")
    };

  } catch (err) {
    console.error("POSITIONING ERROR:", err.message);
    return null;
  }
}