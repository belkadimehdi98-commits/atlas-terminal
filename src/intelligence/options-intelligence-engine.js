"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runOptionsIntelligence = runOptionsIntelligence;
const options_data_1 = require("../ingestion/options-data");
async function runOptionsIntelligence(asset) {
    var _a, _b, _c, _d;
    try {
        const data = await (0, options_data_1.fetchOptionsData)(asset);
        if (!data) {
            return {
                putCallRatio: 1,
                skew: 0,
                gammaExposure: 0,
                openInterest: 0,
                bias: "NEUTRAL"
            };
        }
        const putCallRatio = (_a = data.putCallRatio) !== null && _a !== void 0 ? _a : 1;
        const skew = (_b = data.skew) !== null && _b !== void 0 ? _b : 0;
        const gammaExposure = (_c = data.gammaExposure) !== null && _c !== void 0 ? _c : 0;
        const openInterest = (_d = data.openInterest) !== null && _d !== void 0 ? _d : 0;
        let bias = "NEUTRAL";
        if (putCallRatio < 0.8 && skew <= 0)
            bias = "BULLISH";
        if (putCallRatio > 1.2 && skew >= 0)
            bias = "BEARISH";
        return {
            putCallRatio,
            skew,
            gammaExposure,
            openInterest,
            bias
        };
    }
    catch (_e) {
        return null;
    }
}
