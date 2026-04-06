import axios from "axios";

export async function bondYieldEngine() {

  try {

    const apiKey = process.env.FRED_KEY;

    const [us10, us02] = await Promise.all([
      axios.get(`https://api.stlouisfed.org/fred/series/observations`, {
        params: {
          series_id: "DGS10",
          api_key: apiKey,
          file_type: "json",
          sort_order: "desc",
          limit: 1
        }
      }),
      axios.get(`https://api.stlouisfed.org/fred/series/observations`, {
        params: {
          series_id: "DGS2",
          api_key: apiKey,
          file_type: "json",
          sort_order: "desc",
          limit: 1
        }
      })
    ]);

    const us10y = parseFloat(us10.data.observations[0].value);
    const us02y = parseFloat(us02.data.observations[0].value);

    const curve = us10y - us02y;

    let regime = "NEUTRAL";
    if (curve < 0) regime = "INVERTED";
    else if (curve > 1) regime = "STEEPENING";

    return {
      us10y,
      us02y,
      curve,
      regime
    };

  } catch (err) {

    console.error("Bond yield fetch failed:", err);

    return {
      us10y: 0,
      us02y: 0,
      curve: 0,
      regime: "NEUTRAL"
    };

  }
}