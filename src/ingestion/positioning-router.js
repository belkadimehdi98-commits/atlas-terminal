"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPositioning = getPositioning;
const positioning_1 = require("./positioning");
async function getPositioning(asset) {
    var _a, _b, _c;
    const crypto = [
        "BTC", "ETH", "SOL", "BNB", "XRP", "ADA", "AVAX", "LINK", "MATIC", "DOGE"
    ];
    // remove quote currency if present
    const base = asset.replace("USDT", "");
    if (crypto.includes(base)) {
        const data = await (0, positioning_1.fetchPositioningData)(base);
        if (!data)
            return null;
        return {
            fundingRate: (_a = data.fundingRate) !== null && _a !== void 0 ? _a : null,
            openInterest: (_b = data.openInterest) !== null && _b !== void 0 ? _b : null,
            longShortRatio: (_c = data.longShortRatio) !== null && _c !== void 0 ? _c : null,
            optionsSkew: null,
            source: "CRYPTO_DERIVATIVES"
        };
    }
    return null;
}
