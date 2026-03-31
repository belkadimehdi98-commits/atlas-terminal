import axios from "axios";

export async function bondYieldEngine() {

  const key = process.env.FRED_KEY;

  let us10y = 0;
  let us02y = 0;

  try {

    const us10 = await axios.get(
      `https://api.stlouisfed.org/fred/series/observations?series_id=DGS10&api_key=${key}&file_type=json&limit=1&sort_order=desc`,
      {
        timeout: 4000,
        headers: { "User-Agent": "Mozilla/5.0" }
      }
    );

    const us02 = await axios.get(
      `https://api.stlouisfed.org/fred/series/observations?series_id=DGS2&api_key=${key}&file_type=json&limit=1&sort_order=desc`,
      {
        timeout: 4000,
        headers: { "User-Agent": "Mozilla/5.0" }
      }
    );

    us10y = Number(us10.data.observations?.[0]?.value || 0);
    us02y = Number(us02.data.observations?.[0]?.value || 0);

  } catch (e) {
    console.log("FRED blocked — fallback used");
  }

  const curve = us10y - us02y;

  let regime = "NEUTRAL";

  if (curve < 0) regime = "INVERTED";
  if (curve > 1) regime = "STEEPENING";

  return {
    us10y,
    us02y,
    curve,
    regime
  };
}