"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzePositioning = analyzePositioning;
function analyzePositioning(data) {
    const funding = (data === null || data === void 0 ? void 0 : data.fundingRate) || 0;
    const ratio = (data === null || data === void 0 ? void 0 : data.longShortRatio) || 1;
    let bias = "BALANCED";
    if (funding > 0.02 || ratio > 1.6) {
        bias = "LONG_CROWDED";
    }
    if (funding < -0.02 || ratio < 0.6) {
        bias = "SHORT_CROWDED";
    }
    let liquidationRisk = "LOW";
    if (Math.abs(funding) > 0.03) {
        liquidationRisk = "HIGH";
    }
    else if (Math.abs(funding) > 0.015) {
        liquidationRisk = "MEDIUM";
    }
    return {
        fundingRate: funding,
        openInterest: data === null || data === void 0 ? void 0 : data.openInterest,
        longShortRatio: ratio,
        optionsSkew: data === null || data === void 0 ? void 0 : data.optionsSkew,
        liquidationRisk,
        positioningBias: bias
    };
}
