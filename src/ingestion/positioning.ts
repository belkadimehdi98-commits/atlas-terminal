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

    // FUNDING RATE (with fallback)
    let fundingRate = 0;

    try {
      const fundingRes = await axios.get(
        `https://fapi.binance.com/fapi/v1/premiumIndex?symbol=${pair}`
      );
      fundingRate = parseFloat(fundingRes.data?.lastFundingRate || "0");
    } catch {
      const fundingRes = await axios.get(
        `https://data-api.binance.vision/fapi/v1/premiumIndex?symbol=${pair}`
      );
      fundingRate = parseFloat(fundingRes.data?.lastFundingRate || "0");
    }

    // OPEN INTEREST (with fallback)
    let openInterest = 0;

    try {
      const oiRes = await axios.get(
        `https://fapi.binance.com/fapi/v1/openInterest?symbol=${pair}`
      );
      openInterest = parseFloat(oiRes.data?.openInterest || "0");
    } catch {
      const oiRes = await axios.get(
        `https://data-api.binance.vision/fapi/v1/openInterest?symbol=${pair}`
      );
      openInterest = parseFloat(oiRes.data?.openInterest || "0");
    }

    // LONG / SHORT RATIO (with fallback)
    let longShortRatio = 1;

    try {
      const ratioRes = await axios.get(
        `https://fapi.binance.com/futures/data/globalLongShortAccountRatio?symbol=${pair}&period=5m&limit=1`
      );
      longShortRatio = parseFloat(
        ratioRes.data?.[0]?.longShortRatio || "1"
      );
    } catch {
      const ratioRes = await axios.get(
        `https://data-api.binance.vision/futures/data/globalLongShortAccountRatio?symbol=${pair}&period=5m&limit=1`
      );
      longShortRatio = parseFloat(
        ratioRes.data?.[0]?.longShortRatio || "1"
      );
    }

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