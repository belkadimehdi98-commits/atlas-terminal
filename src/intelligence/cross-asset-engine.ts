import { MarketRouter } from "../ingestion/market-router";

export interface CrossAssetResult {

  dxy?: number
  gold?: number
  spx?: number
  us10y?: number
  oil?: number
  btc?: number

  alignment: string
  summary: string

}

export class CrossAssetEngine {

  private router = new MarketRouter()

  async analyze(): Promise<CrossAssetResult> {

    const result: CrossAssetResult = {
      alignment: "",
      summary: ""
    }

    try {

      result.gold = await this.router.getPrice("XAUUSD")

    } catch {}

    try {

      result.spx = await this.router.getPrice("SPX")

    } catch {}

    try {

      result.btc = await this.router.getPrice("BTCUSDT")

    } catch {}

    try {

      result.oil = await this.router.getPrice("WTI")

    } catch {}

    let riskOffSignals = 0
    let riskOnSignals = 0

    if (result.gold && result.gold > 0) riskOffSignals++
    if (result.btc && result.btc > 0) riskOnSignals++

    if (riskOffSignals > riskOnSignals) {

      result.alignment = "RISK_OFF"

      result.summary =
        "Safe-haven flows dominate. Capital rotating to defensive assets."

    }

    else {

      result.alignment = "RISK_ON"

      result.summary =
        "Risk appetite present. Capital flowing toward growth assets."

    }

    return result

  }

}