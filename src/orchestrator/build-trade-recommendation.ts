import { signalFusionEngine } from "../decision/signal-fusion-engine";
import { aiDecisionEngine } from "../ai/ai-decision-engine";
import { thesisEngine } from "../ai/thesis-engine";
import { vixEngine } from "../intelligence/vix-engine"
import { CryptoFlowEngine } from "../intelligence/crypto-flow-engine";
export async function buildTradeRecommendation(asset: string, signals: any, backtest = false) {

const cryptoFlowEngine = new CryptoFlowEngine();

if (!backtest) {

  const vix = await vixEngine();
  signals.vix = vix;

  const cryptoFlows = await cryptoFlowEngine.analyze();
  signals.cryptoFlows = cryptoFlows;

}
  // 1 — fuse raw engine signals into institutional market state
const fusedSignals = await signalFusionEngine({
  asset,
  signals
});

  // 2 — AI becomes final decision authority
  const finalTrade = await aiDecisionEngine({
    asset,
    signals,
    fusedSignals
  });

  // 3 — institutional thesis built from AI final decision
  const thesis = await thesisEngine({
    asset,
    signals,
    fusedSignals,
    finalTrade
  });

return {
  direction: finalTrade.direction,
  confidence: finalTrade.confidence,
  entry: finalTrade.entry,
  stop_loss: finalTrade.stopLoss,
  targets: finalTrade.targets,

crypto_flows: signals.cryptoFlows,
liquidation: fusedSignals.liquidation,
  explanation: typeof thesis === "string"
    ? thesis
    : (thesis as any)?.explanation ?? "",

  risk: typeof thesis === "string"
    ? ""
    : (thesis as any)?.risk ?? "",

  regime: (fusedSignals as any).regime,
  macro: (fusedSignals as any).macro,
  cross_asset: (fusedSignals as any).crossAsset,
  signal_quality: (fusedSignals as any).signalQuality,
  drivers: (fusedSignals as any).drivers
};
}