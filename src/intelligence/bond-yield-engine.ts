import axios from "axios";

export async function bondYieldEngine() {

  const key = process.env.FRED_KEY;

  const us10 = await axios.get(
    `https://api.stlouisfed.org/fred/series/observations?series_id=DGS10&api_key=${key}&file_type=json&limit=1&sort_order=desc`
  );

  const us02 = await axios.get(
    `https://api.stlouisfed.org/fred/series/observations?series_id=DGS2&api_key=${key}&file_type=json&limit=1&sort_order=desc`
  );

  const us10y = Number(us10.data.observations[0].value);
  const us02y = Number(us02.data.observations[0].value);

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