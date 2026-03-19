"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MacroEngine = void 0;
const economic_calendar_engine_1 = require("../engines/economic-calendar-engine");
class MacroEngine {
    async analyze(events) {
        const economic = await (0, economic_calendar_engine_1.economicCalendarEngine)();
        const keyDrivers = [];
        let riskOnScore = 0;
        let riskOffScore = 0;
        if (economic.regime === "RISK_OFF")
            riskOffScore += 2;
        if (economic.regime === "RISK_ON")
            riskOnScore += 2;
        keyDrivers.push("Economic calendar signals influencing macro regime");
        for (const e of events) {
            if (e.type === "MACRO") {
                keyDrivers.push(e.title);
                const title = e.title.toLowerCase();
                if (title.includes("inflation"))
                    riskOffScore += 2;
                if (title.includes("recession"))
                    riskOffScore += 2;
                if (title.includes("rate hike"))
                    riskOffScore += 2;
                if (title.includes("growth"))
                    riskOnScore += 1;
                if (title.includes("stimulus"))
                    riskOnScore += 2;
            }
            if (e.type === "CENTRAL_BANK") {
                keyDrivers.push(e.title);
                riskOffScore += 1;
            }
            if (e.type === "WAR") {
                riskOffScore += 2;
            }
            if (e.type === "SANCTIONS") {
                riskOffScore += 1;
            }
        }
        let regime = "NEUTRAL";
        if (riskOffScore > riskOnScore)
            regime = "RISK_OFF";
        if (riskOnScore > riskOffScore)
            regime = "RISK_ON";
        const summary = {
            regime,
            keyDrivers
        };
        const impactChain = this.buildImpact(regime);
        return {
            summary,
            impactChain
        };
    }
    buildImpact(regime) {
        if (regime === "RISK_OFF") {
            return "Macro signals point to tightening liquidity or economic stress → capital shifts to safe assets → pressure on equities and risk assets";
        }
        if (regime === "RISK_ON") {
            return "Macro signals indicate growth or liquidity support → investors increase exposure to risk assets → bullish environment for equities and crypto";
        }
        return "Macro signals mixed → markets likely to remain range-bound awaiting clearer economic direction";
    }
}
exports.MacroEngine = MacroEngine;
