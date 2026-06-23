#!/usr/bin/env node
/**
 * One-shot patch: add estimated membership costs to city gym blog posts.
 * Run from frontend/: node scripts/patch-gym-post-prices.mjs
 */

import fs from "fs";
import path from "path";

const POSTS_DIR = path.join(process.cwd(), "posts");

const DISCLAIMER = `> **Pricing note:** All costs below are **approximate estimates** for 2026 based on publicly listed rates, member reports, and typical promo pricing. Your actual price can differ by location, contract length, initiation fees, add-ons (parking, classes, annual fee), student/military discounts, and seasonal promotions. Always confirm current rates on the gym's website or in person before signing.`;

/** slug → { currency label, table rows, gym index → est cost string } */
const DATA = {
  "top-20-gyms-new-york-city": {
    table: [
      ["Equinox Hudson Yards", "~$250–$350/mo"],
      ["Dogpound", "~$300–$500+/mo"],
      ["Chelsea Piers Fitness", "~$150–$220/mo"],
      ["Blink Fitness", "~$25–$40/mo"],
      ["Westside Barbell", "~$80–$150/mo"],
    ],
    costs: [
      "~$250–$350/month",
      "~$300–$500+/month",
      "~$150–$220/month",
      "~$200–$300/month",
      "~$250–$400/month",
      "~$80–$150/month",
      "~$200–$350/month (class packs)",
      "~$100–$180/month",
      "~$80–$150/month",
      "~$30–$60/month",
      "~$25–$40/month",
      "~$15–$25/month",
      "~$50–$90/month",
      "~$30–$45/class or ~$200–$350/mo unlimited",
      "~$30–$40/class or ~$150–$280/mo",
      "~$180–$250/month",
      "~$60–$100/month",
      "~$30–$50/month",
      "~$20–$35/month",
      "~$60–$120/month",
    ],
  },
  "top-20-gyms-los-angeles": {
    table: [
      ["Gold's Gym Venice", "~$50–$80/mo"],
      ["Equinox West Hollywood", "~$200–$300/mo"],
      ["EōS Fitness", "~$10–$30/mo"],
      ["The Yard Gym", "~$150–$250/mo"],
      ["LA Fitness", "~$35–$55/mo"],
    ],
    costs: [
      "~$50–$80/month",
      "~$200–$300/month",
      "~$10–$20/day pass or ~$80–$120/yr tourist",
      "~$10–$30/month",
      "~$35–$55/month",
      "~$30–$50/month",
      "~$150–$250/month",
      "~$30–$45/class or ~$200–$350/mo",
      "~$150–$220/month",
      "~$25–$40/class",
      "~$25–$35/class",
      "~$120–$200/month",
      "~$30–$60/month",
      "~$10–$25/month",
      "~$100–$180/month",
      "~$60–$100/month",
      "~$50–$90/month",
      "~$50–$100/month (student)",
      "~$150–$250/month",
      "~$30–$45/class",
    ],
  },
  "top-20-gyms-chicago": {
    table: [
      ["East Bank Club", "~$180–$280/mo"],
      ["Chicago Athletic Clubs", "~$150–$250/mo"],
      ["XSport Fitness", "~$10–$30/mo"],
      ["South Loop Strength & Conditioning", "~$150–$220/mo"],
      ["LA Fitness", "~$35–$55/mo"],
    ],
    costs: [
      "~$180–$280/month",
      "~$150–$250/month",
      "~$200–$300/month",
      "~$10–$30/month",
      "~$35–$55/month",
      "~$30–$50/month",
      "~$150–$220/month",
      "~$100–$160/month",
      "~$120–$200/month",
      "~$150–$220/month",
      "~$10–$25/month",
      "~$30–$60/month",
      "~$150–$220/month",
      "~$120–$200/month",
      "~$150–$250/month",
      "~$60–$100/month",
      "~$100–$160/month",
      "~$60–$100/month",
      "~$40–$80/month (student)",
      "~$10–$25/month",
    ],
  },
  "top-20-gyms-houston": {
    table: [
      ["Life Time Athletic", "~$150–$250/mo"],
      ["OAK Fitness", "~$40–$70/mo"],
      ["EōS Fitness", "~$10–$30/mo"],
      ["F45 Training", "~$150–$220/mo"],
      ["YMCA", "~$50–$90/mo"],
    ],
    costs: [
      "~$150–$250/month",
      "~$40–$70/month",
      "~$10–$30/month",
      "~$35–$55/month",
      "~$30–$50/month",
      "~$10–$25/month",
      "~$150–$220/month",
      "~$150–$220/month",
      "~$50–$90/month",
      "~$200–$300/month",
      "~$100–$180/month",
      "~$80–$140/month",
      "~$40–$70/month",
      "~$30–$60/month",
      "~$120–$200/month",
      "~$60–$100/month",
      "~$30–$45/class",
      "~$50–$100/month (student)",
      "~$60–$100/month",
      "~$30–$50/month",
    ],
  },
  "top-20-gyms-london": {
    table: [
      ["Third Space", "~£180–£280/mo"],
      ["Gymbox", "~£80–£130/mo"],
      ["PureGym", "~£25–£45/mo"],
      ["Virgin Active", "~£70–£120/mo"],
      ["Foundry Fitness", "~£120–£200/mo"],
    ],
    costs: [
      "~£180–£280/month",
      "~£80–£130/month",
      "~£70–£120/month",
      "~£25–£45/month",
      "~£20–£40/month",
      "~£200–£300/month",
      "~£120–£200/month",
      "~£25–£40/class",
      "~£30–£45/class",
      "~£150–£220/month",
      "~£60–£100/month",
      "~£80–£130/month",
      "~£80–£140/month",
      "~£70–£120/month",
      "~£50–£80/month",
      "~£30–£50/month",
      "~£150–£220/month",
      "~£50–£90/month",
      "~£25–£40/class",
      "~£30–£60/month (student)",
    ],
  },
  "top-20-gyms-toronto": {
    table: [
      ["Equinox Yorkville", "~$200–$300/mo"],
      ["Fit Factory Fitness", "~$50–$80/mo"],
      ["GoodLife Fitness", "~$50–$90/mo"],
      ["Planet Fitness", "~$15–$25/mo"],
      ["Strength Academy", "~$80–$130/mo"],
    ],
    costs: [
      "~$200–$300/month",
      "~$50–$80/month",
      "~$50–$90/month",
      "~$15–$25/month",
      "~$80–$130/month",
      "~$150–$220/month",
      "~$30–$45/class",
      "~$50–$90/month",
      "~$200–$350/month",
      "~$150–$220/month",
      "~$30–$50/month",
      "~$40–$70/month (student)",
      "~$80–$130/month",
      "~$30–$45/class",
      "~$30–$50/month",
      "~$30–$60/month",
      "~$80–$130/month",
      "~$120–$200/month",
      "~$100–$160/month",
      "~$15–$30/month",
    ],
  },
  "top-20-gyms-sydney": {
    table: [
      ["Fitness First", "~$25–$45/wk"],
      ["Anytime Fitness", "~$18–$30/wk"],
      ["F45 Training", "~$40–$65/wk"],
      ["Bondi outdoor gyms", "Free"],
      ["Virgin Active", "~$30–$50/wk"],
    ],
    costs: [
      "~$25–$45/week",
      "~$30–$50/week",
      "~$18–$30/week",
      "~$40–$65/week",
      "~$30–$45/class",
      "Free",
      "~$150–$220/week",
      "~$15–$25/week",
      "~$15–$22/week",
      "~$20–$35/week",
      "~$15–$22/week",
      "~$50–$80/week",
      "~$120–$180/week",
      "~$50–$90/week",
      "~$18–$28/week",
      "~$25–$40/week",
      "~$15–$25/week (student)",
      "~$60–$100/week",
      "~$120–$180/week",
      "~$15–$22/week",
    ],
  },
  "top-20-gyms-melbourne": {
    table: [
      ["Doherty's Gym", "~$18–$30/wk"],
      ["Fitness First", "~$25–$45/wk"],
      ["Revo Fitness", "~$12–$20/wk"],
      ["Anytime Fitness", "~$18–$30/wk"],
      ["F45 Training", "~$40–$65/wk"],
    ],
    costs: [
      "~$18–$30/week",
      "~$25–$45/week",
      "~$12–$20/week",
      "~$18–$30/week",
      "~$40–$65/week",
      "~$30–$50/week",
      "~$150–$220/week",
      "~$15–$22/week",
      "~$15–$22/week",
      "~$20–$35/week",
      "~$18–$28/week",
      "~$15–$25/week (student)",
      "~$60–$100/week",
      "~$25–$40/class",
      "~$30–$45/class",
      "~$50–$90/week",
      "~$20–$35/week",
      "~$120–$180/week",
      "~$25–$40/week",
      "~$15–$22/week",
    ],
  },
  "top-20-gyms-phoenix": {
    table: [
      ["Life Time Athletic", "~$150–$250/mo"],
      ["Mountainside Fitness", "~$50–$90/mo"],
      ["EōS Fitness", "~$10–$30/mo"],
      ["LA Fitness", "~$35–$55/mo"],
      ["Planet Fitness", "~$10–$25/mo"],
    ],
    costs: [
      "~$150–$250/month",
      "~$50–$90/month",
      "~$10–$30/month",
      "~$35–$55/month",
      "~$30–$50/month",
      "~$10–$25/month",
      "~$150–$220/month",
      "~$150–$220/month",
      "~$50–$90/month",
      "~$200–$300/month",
      "~$10–$25/month",
      "~$30–$50/month",
      "~$40–$70/month",
      "~$30–$60/month",
      "~$120–$200/month",
      "~$100–$180/month",
      "~$40–$80/month (student)",
      "~$60–$100/month",
      "~$150–$220/month",
      "~$10–$25/month",
    ],
  },
  "top-20-gyms-philadelphia": {
    table: [
      ["Philadelphia Sports Clubs", "~$80–$150/mo"],
      ["City Fitness", "~$40–$70/mo"],
      ["Retro Fitness", "~$10–$25/mo"],
      ["SWEAT Fitness", "~$30–$55/mo"],
      ["CrossFit Philly", "~$150–$220/mo"],
    ],
    costs: [
      "~$80–$150/month",
      "~$40–$70/month",
      "~$30–$55/month",
      "~$10–$25/month",
      "~$10–$25/month",
      "~$35–$55/month",
      "~$150–$220/month",
      "~$150–$220/month",
      "~$50–$90/month",
      "~$200–$300/month",
      "~$60–$100/month",
      "~$30–$60/month",
      "~$30–$50/month",
      "~$150–$220/month",
      "~$40–$80/month (student)",
      "~$10–$25/month",
      "~$120–$200/month",
      "~$30–$50/month",
      "~$40–$70/month",
      "~$80–$140/month",
    ],
  },
  "top-20-gyms-dallas": {
    table: [
      ["Life Time Athletic", "~$150–$250/mo"],
      ["Metroflex Gym", "~$40–$70/mo"],
      ["EōS Fitness", "~$10–$30/mo"],
      ["Equinox Uptown", "~$200–$300/mo"],
      ["LA Fitness", "~$35–$55/mo"],
    ],
    costs: [
      "~$150–$250/month",
      "~$40–$70/month",
      "~$200–$300/month",
      "~$10–$30/month",
      "~$35–$55/month",
      "~$30–$50/month",
      "~$10–$25/month",
      "~$150–$220/month",
      "~$150–$220/month",
      "~$50–$90/month",
      "~$40–$70/month",
      "~$30–$60/month",
      "~$120–$200/month",
      "~$30–$50/month",
      "~$30–$45/class",
      "~$10–$25/month",
      "~$50–$100/month (student)",
      "~$60–$100/month",
      "~$150–$220/month",
      "~$120–$200/month",
    ],
  },
  "top-20-gyms-vancouver": {
    table: [
      ["Equinox Vancouver", "~$200–$300/mo"],
      ["Steve Nash Fitness World", "~$50–$90/mo"],
      ["Anytime Fitness", "~$40–$65/mo"],
      ["F45 Training", "~$150–$220/mo"],
      ["Revo Fitness", "~$15–$30/mo"],
    ],
    costs: [
      "~$200–$300/month",
      "~$50–$90/month",
      "~$40–$65/month",
      "~$150–$220/month",
      "~$15–$30/month",
      "~$50–$90/month",
      "~$150–$220/month",
      "~$30–$45/class",
      "~$30–$55/month",
      "~$15–$30/month",
      "~$30–$60/month (student)",
      "~$15–$25/month",
      "~$30–$50/month",
      "~$50–$80/month",
      "~$120–$200/month",
      "~$50–$90/month",
      "~$15–$25/month",
      "~$25–$40/class",
      "~$120–$200/month",
      "~$40–$70/month",
    ],
  },
  "top-20-gyms-brisbane": {
    table: [
      ["Fitness First", "~$25–$45/wk"],
      ["Anytime Fitness", "~$18–$30/wk"],
      ["F45 Training", "~$40–$65/wk"],
      ["Jetts Fitness", "~$15–$22/wk"],
      ["Goodlife Health Clubs", "~$20–$35/wk"],
    ],
    costs: [
      "~$25–$45/week",
      "~$18–$30/week",
      "~$40–$65/week",
      "~$15–$22/week",
      "~$20–$35/week",
      "~$30–$50/week",
      "~$150–$220/week",
      "~$15–$22/week",
      "~$20–$35/week",
      "~$12–$20/week",
      "Free",
      "~$18–$28/week",
      "~$15–$25/week (student)",
      "~$25–$40/week",
      "~$40–$65/week",
      "~$50–$90/week",
      "~$50–$80/week",
      "~$150–$220/week",
      "~$25–$40/class",
      "~$15–$22/week",
    ],
  },
  "top-20-gyms-san-diego": {
    table: [
      ["Fit Athletic Club", "~$150–$250/mo"],
      ["EōS Fitness", "~$10–$30/mo"],
      ["World Gym San Diego", "~$40–$70/mo"],
      ["LA Fitness", "~$35–$55/mo"],
      ["The Gym Grounds", "~$120–$200/mo"],
    ],
    costs: [
      "~$150–$250/month",
      "~$10–$30/month",
      "~$40–$70/month",
      "~$35–$55/month",
      "~$120–$200/month",
      "~$30–$50/month",
      "~$10–$25/month",
      "~$150–$220/month",
      "~$150–$220/month",
      "~$50–$90/month",
      "~$10–$25/month",
      "~$30–$60/month",
      "~$30–$45/class",
      "Free",
      "~$30–$50/month",
      "~$40–$80/month (student)",
      "~$40–$70/month",
      "~$150–$220/month",
      "~$80–$140/month",
      "~$200–$300/month",
    ],
  },
  "top-20-gyms-dublin": {
    table: [
      ["Westwood Club", "~€120–€200/mo"],
      ["Flye Fit", "~€30–€50/mo"],
      ["Ben Dunne Gyms", "~€40–€65/mo"],
      ["FLYE Fitness", "~€45–€70/mo"],
      ["CrossFit Dublin", "~€120–€180/mo"],
    ],
    costs: [
      "~€120–€200/month",
      "~€30–€50/month",
      "~€40–€65/month",
      "~€45–€70/month",
      "~€70–€120/month",
      "~€120–€180/month",
      "~€150–€220/month",
      "~€50–€80/month",
      "~€25–€45/month",
      "~€25–€45/month",
      "~€80–€140/month",
      "~€30–€50/month",
      "~€30–€60/month (student)",
      "~€30–€60/month (student)",
      "~€60–€100/month",
      "~€30–€45/class",
      "~€50–€90/month",
      "~€25–€45/day pass",
      "~€50–€80/month",
      "~€25–€40/month",
    ],
  },
};

function patchFile(slug, { table, costs }) {
  const filePath = path.join(POSTS_DIR, `${slug}.md`);
  let content = fs.readFileSync(filePath, "utf8");

  // Insert disclaimer before Quick Comparison (once)
  if (!content.includes("**Pricing note:**")) {
    content = content.replace(
      /(Prices shift[^\n]+\n|Contract flexibility[^\n]+\n|Peak-hour capacity[^\n]+\n)/,
      `$1\n${DISCLAIMER}\n`,
    );
    // fallback: before ## Quick Comparison
    if (!content.includes("**Pricing note:**")) {
      content = content.replace(
        /(\n## Quick Comparison)/,
        `\n${DISCLAIMER}\n$1`,
      );
    }
  }

  // Update comparison table header and rows
  content = content.replace(
    /\| Gym \| Best For \| Price Tier \| Standout Feature \|/,
    "| Gym | Best For | Est. Monthly Cost | Standout Feature |",
  );
  content = content.replace(
    /\| Gym \| Best For \| Est\. Monthly Cost \| Standout Feature \|\n\| --- \| --- \| --- \| --- \|\n([\s\S]*?)\n\n## The 20 Best/,
    (match, tableBody) => {
      const rows = tableBody.trim().split("\n");
      const newRows = rows.map((row, i) => {
        if (i >= table.length) return row;
        const parts = row.split("|").map((p) => p.trim());
        // parts: ['', name, bestFor, oldTier, feature, '']
        if (parts.length >= 5) {
          parts[3] = table[i][1];
          return `| ${parts[1]} | ${parts[2]} | ${parts[3]} | ${parts[4]} |`;
        }
        return row;
      });
      return `| Gym | Best For | Est. Monthly Cost | Standout Feature |\n| --- | --- | --- | --- |\n${newRows.join("\n")}\n\n## The 20 Best`;
    },
  );

  // Australian posts: weekly label in table
  if (slug.includes("sydney") || slug.includes("melbourne") || slug.includes("brisbane")) {
    content = content.replace(
      "| Gym | Best For | Est. Monthly Cost | Standout Feature |",
      "| Gym | Best For | Est. Weekly Cost | Standout Feature |",
    );
  }

  // Replace **Price:** tiers with **Est. cost:**
  let costIndex = 0;
  content = content.replace(/\*\*Price:\*\* \$+(\$)?/g, () => {
    const est = costs[costIndex] ?? "varies — contact gym";
    costIndex += 1;
    return `**Est. cost:** ${est} *(approximate)*`;
  });
  content = content.replace(/\*\*Price:\*\* £+£?/g, () => {
    const est = costs[costIndex] ?? "varies — contact gym";
    costIndex += 1;
    return `**Est. cost:** ${est} *(approximate)*`;
  });
  content = content.replace(/\*\*Price:\*\* €+€?/g, () => {
    const est = costs[costIndex] ?? "varies — contact gym";
    costIndex += 1;
    return `**Est. cost:** ${est} *(approximate)*`;
  });

  // FAQ cost answer — add approximate note
  content = content.replace(
    /(### How much does a gym membership cost[^\n]+\n\n)(Expect[^\n]+)/,
    `$1$2 *(approximate ranges — actual rates vary by location, contract, and promotions.)*`,
  );

  fs.writeFileSync(filePath, content);
  console.log(`patched ${slug} (${costIndex} gym costs)`);
}

for (const [slug, data] of Object.entries(DATA)) {
  patchFile(slug, data);
}

console.log("done");
