export interface PositioningSignal {
  fundingRate?: number
  openInterest?: number
  longShortRatio?: number
  optionsSkew?: number
  liquidationRisk?: "HIGH" | "MEDIUM" | "LOW"
  positioningBias: "LONG_CROWDED" | "SHORT_CROWDED" | "BALANCED"
}

export function analyzePositioning(data: any): PositioningSignal {

  const funding = data?.fundingRate || 0
  const ratio = data?.longShortRatio || 1

  let bias: PositioningSignal["positioningBias"] = "BALANCED"

  if (funding > 0.02 || ratio > 1.6) {
    bias = "LONG_CROWDED"
  }

  if (funding < -0.02 || ratio < 0.6) {
    bias = "SHORT_CROWDED"
  }

  let liquidationRisk: PositioningSignal["liquidationRisk"] = "LOW"

  if (Math.abs(funding) > 0.03) {
    liquidationRisk = "HIGH"
  } else if (Math.abs(funding) > 0.015) {
    liquidationRisk = "MEDIUM"
  }

  return {
    fundingRate: funding,
    openInterest: data?.openInterest,
    longShortRatio: ratio,
    optionsSkew: data?.optionsSkew,
    liquidationRisk,
    positioningBias: bias
  }
}