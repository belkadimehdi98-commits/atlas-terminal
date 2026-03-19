"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventParser = void 0;
class EventParser {
    parse(news) {
        const events = [];
        for (const article of news) {
            const title = article.title.toLowerCase();
            /* ===============================
               MACRO EVENTS
            =============================== */
            if (this.contains(title, [
                "rate decision",
                "interest rate",
                "rate hike",
                "rate cut",
                "monetary policy",
                "policy meeting",
                "fed meeting",
                "fomc",
                "ecb policy",
                "central bank policy"
            ])) {
                events.push(this.buildEvent(article, "CENTRAL_BANK", "HIGH"));
                continue;
            }
            /* ===============================
               CENTRAL BANK
            =============================== */
            if (this.contains(title, [
                "federal reserve", "ecb", "central bank",
                "rate decision", "monetary policy", "fed chair"
            ])) {
                events.push(this.buildEvent(article, "CENTRAL_BANK", "HIGH"));
                continue;
            }
            /* ===============================
               SANCTIONS / TRADE
            =============================== */
            if (this.contains(title, [
                "sanctions", "trade ban", "export restrictions",
                "trade war", "tariffs"
            ])) {
                events.push(this.buildEvent(article, "SANCTIONS", "HIGH"));
                continue;
            }
            /* ===============================
               MARKET-RELEVANT WAR EVENTS
               (energy / supply / markets)
            =============================== */
            if (this.contains(title, ["war", "military", "attack", "conflict"]) &&
                this.contains(title, ["oil", "energy", "supply", "shipping", "pipeline", "strait"])) {
                events.push(this.buildEvent(article, "WAR", "HIGH"));
                continue;
            }
            /* ===============================
               ENERGY / OIL
            =============================== */
            if (this.contains(title, [
                "oil", "energy supply", "pipeline",
                "opec", "production cuts", "energy crisis"
            ])) {
                events.push(this.buildEvent(article, "MACRO", "HIGH"));
                continue;
            }
            /* ===============================
               NATURAL DISASTERS
               (only if supply risk)
            =============================== */
            if (this.contains(title, ["earthquake", "hurricane", "flood", "wildfire"]) &&
                this.contains(title, ["oil", "energy", "port", "supply"])) {
                events.push(this.buildEvent(article, "WEATHER", "MEDIUM"));
                continue;
            }
        }
        return events;
    }
    contains(text, keywords) {
        return keywords.some(k => text.includes(k));
    }
    buildEvent(article, type, impact) {
        return {
            type,
            title: article.title,
            source: article.source,
            timestamp: Date.now(),
            impact
        };
    }
}
exports.EventParser = EventParser;
