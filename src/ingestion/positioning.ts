import axios from "axios";

export interface RawPositioningData {
  fundingRate: number;
  openInterest: number;
  longShortRatio: number;
  optionsSkew?: number;
}

export async function fetchPositioningData(symbol: string): Promise<RawPositioningData | null> {

  try {

    const pair = symbol.endsWith("USDT") ? symbol : symbol + "USDT";

    // Funding rate
    const fundingRes = await axios.get(
      `https://fapi.binance.com/fapi/v1/premiumIndex?symbol=${pair}`
    );

    const fundingRate = parseFloat(fundingRes.data?.lastFundingRate || "0");

    // Open interest
    const oiRes = await axios.get(
      `https://fapi.binance.com/fapi/v1/openInterest?symbol=${pair}`
    );

    const openInterest = parseFloat(oiRes.data?.openInterest || "0");

    // Long / Short ratio
    const ratioRes = await axios.get(
      `https://fapi.binance.com/futures/data/globalLongShortAccountRatio?symbol=${pair}&period=5m&limit=1`
    );

    const longShortRatio = parseFloat(
      ratioRes.data?.[0]?.longShortRatio || "1"
    );

    return {
      fundingRate,
      openInterest,
      longShortRatio
    };

  } catch (err) {

    console.error("Positioning ingestion failed", err);

    return null;
  }
}