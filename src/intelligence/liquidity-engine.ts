import axios from "axios";

const FRED_KEY = process.env.FRED_KEY;

export class LiquidityEngine {

  async analyze() {

    try {

      const [walclRes, rrpRes, tgaRes] = await Promise.all([

        axios.get("https://api.stlouisfed.org/fred/series/observations", {
          params: {
            series_id: "WALCL", // Fed balance sheet
            api_key: FRED_KEY,
            file_type: "json",
            sort_order: "desc",
            limit: 1
          }
        }),

        axios.get("https://api.stlouisfed.org/fred/series/observations", {
          params: {
            series_id: "RRPONTSYD", // Reverse repo
            api_key: FRED_KEY,
            file_type: "json",
            sort_order: "desc",
            limit: 1
          }
        }),

        axios.get("https://api.stlouisfed.org/fred/series/observations", {
          params: {
            series_id: "WTREGEN", // Treasury General Account
            api_key: FRED_KEY,
            file_type: "json",
            sort_order: "desc",
            limit: 1
          }
        })

      ]);

      const fedBalanceSheet = parseFloat(walclRes.data.observations[0].value);
      const reverseRepo = parseFloat(rrpRes.data.observations[0].value);
      const treasuryAccount = parseFloat(tgaRes.data.observations[0].value);

      const netLiquidity = fedBalanceSheet - reverseRepo - treasuryAccount;

      let signal = "NEUTRAL";
      if (netLiquidity > 0) signal = "EXPANDING";
      if (netLiquidity < 0) signal = "CONTRACTING";

      return {

        fedBalanceSheet,
        reverseRepo,
        treasuryAccount,
        netLiquidity,
        signal,

        summary: [
          `Fed Balance Sheet: ${fedBalanceSheet}`,
          `Reverse Repo: ${reverseRepo}`,
          `Treasury Account: ${treasuryAccount}`,
          `Net Liquidity: ${netLiquidity}`,
          `Signal: ${signal}`
        ]

      };

    } catch (err) {

      console.error("Liquidity fetch failed:", err);

      return {
        summary: ["Liquidity data unavailable"]
      };

    }

  }

}