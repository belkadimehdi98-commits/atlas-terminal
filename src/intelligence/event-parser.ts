import { NewsItem } from "../ingestion/news-feed";
import { DetectedEvent } from "../types/signal";

export class EventParser {

  parse(news: NewsItem[]): DetectedEvent[] {

    const events: DetectedEvent[] = [];

    for (const article of news) {

      const title = article.title.toLowerCase();

      /* ===============================
         MACRO EVENTS
      =============================== */
if (
  this.contains(title, [
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
  ])
) {
  events.push(this.buildEvent(article,"CENTRAL_BANK","HIGH"));
  continue;
}

      /* ===============================
         CENTRAL BANK
      =============================== */

      if (this.contains(title, [
        "federal reserve","ecb","central bank",
        "rate decision","monetary policy","fed chair"
      ])) {
        events.push(this.buildEvent(article,"CENTRAL_BANK","HIGH"));
        continue;
      }

      /* ===============================
         SANCTIONS / TRADE
      =============================== */

      if (this.contains(title, [
        "sanctions","trade ban","export restrictions",
        "trade war","tariffs"
      ])) {
        events.push(this.buildEvent(article,"SANCTIONS","HIGH"));
        continue;
      }

      /* ===============================
         MARKET-RELEVANT WAR EVENTS
         (energy / supply / markets)
      =============================== */

      if (
        this.contains(title, ["war","military","attack","conflict"]) &&
        this.contains(title, ["oil","energy","supply","shipping","pipeline","strait"])
      ) {
        events.push(this.buildEvent(article,"WAR","HIGH"));
        continue;
      }

      /* ===============================
         ENERGY / OIL
      =============================== */

      if (this.contains(title, [
        "oil","energy supply","pipeline",
        "opec","production cuts","energy crisis"
      ])) {
        events.push(this.buildEvent(article,"MACRO","HIGH"));
        continue;
      }

      /* ===============================
         NATURAL DISASTERS
         (only if supply risk)
      =============================== */

      if (
        this.contains(title, ["earthquake","hurricane","flood","wildfire"]) &&
        this.contains(title, ["oil","energy","port","supply"])
      ) {
        events.push(this.buildEvent(article,"WEATHER","MEDIUM"));
        continue;
      }

    }

    return events;
  }

  private contains(text: string, keywords: string[]): boolean {
    return keywords.some(k => text.includes(k));
  }

  private buildEvent(
    article: NewsItem,
    type: DetectedEvent["type"],
    impact: DetectedEvent["impact"]
  ): DetectedEvent {

    return {
      type,
      title: article.title,
      source: article.source,
      timestamp: Date.now(),
      impact
    };
  }

}