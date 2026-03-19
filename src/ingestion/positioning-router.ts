import { fetchPositioningData } from "./positioning"

export async function getPositioning(asset: string){

  const crypto = [
    "BTC","ETH","SOL","BNB","XRP","ADA","AVAX","LINK","MATIC","DOGE"
  ]

  // remove quote currency if present
  const base = asset.replace("USDT","")

  if (crypto.includes(base)) {

    const data = await fetchPositioningData(base)

    if (!data) return null

    return {
      fundingRate: data.fundingRate ?? null,
      openInterest: data.openInterest ?? null,
      longShortRatio: data.longShortRatio ?? null,
      optionsSkew: null,
      source: "CRYPTO_DERIVATIVES"
    }

  }

  return null
}