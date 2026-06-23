#!/usr/bin/env node
/** Fix top-5 comparison table links to match correct gyms per row. */

import fs from "fs";
import path from "path";

const POSTS_DIR = path.join(process.cwd(), "posts");

/** Five explicit table links per post (matches Quick Comparison rows). */
const TABLE_LINKS = {
  "top-20-gyms-new-york-city": [
    { anchor: "Equinox Hudson Yards", url: "https://www.equinox.com/clubs/new-york/hudson-yards" },
    { anchor: "Dogpound", url: "https://www.thedogpound.com/" },
    { anchor: "Chelsea Piers Fitness", url: "https://www.chelseapiers.com/fitness" },
    { anchor: "Blink Fitness", url: "https://www.blinkfitness.com/" },
    { anchor: "Westside Barbell", url: "https://www.westside-barbell.com/" },
  ],
  "top-20-gyms-los-angeles": [
    { anchor: "Gold's Gym Venice", url: "https://www.goldsgym.com/locations/ca/venice" },
    { anchor: "Equinox West Hollywood", url: "https://www.equinox.com/clubs/los-angeles/west-hollywood" },
    { anchor: "EōS Fitness", url: "https://www.eosfitness.com/" },
    { anchor: "The Yard Gym", url: "https://www.theyardgym.com/" },
    { anchor: "LA Fitness", url: "https://www.lafitness.com/" },
  ],
  "top-20-gyms-chicago": [
    { anchor: "East Bank Club", url: "https://www.eastbankclub.com/" },
    { anchor: "Chicago Athletic Clubs", url: "https://www.chicagoathleticclubs.com/" },
    { anchor: "XSport Fitness", url: "https://www.xsportfitness.com/" },
    { anchor: "South Loop Strength & Conditioning", url: "https://www.southloopstrength.com/" },
    { anchor: "LA Fitness", url: "https://www.lafitness.com/" },
  ],
  "top-20-gyms-houston": [
    { anchor: "Life Time Athletic", url: "https://www.lifetime.life/locations/tx.html" },
    { anchor: "OAK Fitness", url: "https://www.oakfitness.com/" },
    { anchor: "EōS Fitness", url: "https://www.eosfitness.com/" },
    { anchor: "F45 Training", url: "https://f45training.com/" },
    { anchor: "YMCA of Greater Houston", url: "https://www.ymcahouston.org/" },
  ],
  "top-20-gyms-london": [
    { anchor: "Third Space", url: "https://www.thirdspace.london/" },
    { anchor: "Gymbox", url: "https://www.gymbox.com/" },
    { anchor: "PureGym", url: "https://www.puregym.com/" },
    { anchor: "Virgin Active UK", url: "https://www.virginactive.co.uk/" },
    { anchor: "Foundry Fitness", url: "https://www.foundryfit.com/" },
  ],
  "top-20-gyms-toronto": [
    { anchor: "Equinox Yorkville", url: "https://www.equinox.com/clubs/canada/yorkville" },
    { anchor: "Fit Factory Fitness", url: "https://www.fitfactoryfitness.com/" },
    { anchor: "GoodLife Fitness", url: "https://www.goodlifefitness.com/" },
    { anchor: "Planet Fitness Canada", url: "https://www.planetfitness.ca/" },
    { anchor: "Strength Academy", url: "https://www.strengthacademy.ca/" },
  ],
  "top-20-gyms-sydney": [
    { anchor: "Fitness First Australia", url: "https://www.fitnessfirst.com.au/" },
    { anchor: "Anytime Fitness Australia", url: "https://www.anytimefitness.com.au/" },
    { anchor: "F45 Training", url: "https://f45training.com.au/" },
    { anchor: "Bondi Beach outdoor gym", url: "https://www.waverley.nsw.gov.au/our-public-spaces/beaches-and-coast/bondi-beach" },
    { anchor: "Virgin Active Australia", url: "https://www.virginactive.com.au/" },
  ],
  "top-20-gyms-melbourne": [
    { anchor: "Doherty's Gym", url: "https://www.dohertysgym.com.au/" },
    { anchor: "Fitness First Australia", url: "https://www.fitnessfirst.com.au/" },
    { anchor: "Revo Fitness", url: "https://www.revofitness.com.au/" },
    { anchor: "Anytime Fitness Australia", url: "https://www.anytimefitness.com.au/" },
    { anchor: "F45 Training", url: "https://f45training.com.au/" },
  ],
  "top-20-gyms-phoenix": [
    { anchor: "Life Time Athletic", url: "https://www.lifetime.life/locations/az.html" },
    { anchor: "Mountainside Fitness", url: "https://www.mountainsidefitness.com/" },
    { anchor: "EōS Fitness", url: "https://www.eosfitness.com/" },
    { anchor: "LA Fitness", url: "https://www.lafitness.com/" },
    { anchor: "Planet Fitness", url: "https://www.planetfitness.com/" },
  ],
  "top-20-gyms-philadelphia": [
    { anchor: "Philadelphia Sports Clubs", url: "https://www.philadelphiasportsclubs.com/" },
    { anchor: "City Fitness Philadelphia", url: "https://www.cityfitnessphilly.com/" },
    { anchor: "Retro Fitness", url: "https://www.retrofitness.com/" },
    { anchor: "SWEAT Fitness", url: "https://www.sweatfitness.com/" },
    { anchor: "CrossFit Philly", url: "https://www.crossfitphilly.com/" },
  ],
  "top-20-gyms-dallas": [
    { anchor: "Life Time Athletic", url: "https://www.lifetime.life/locations/tx.html" },
    { anchor: "Metroflex Gym", url: "https://www.metroflexgym.com/" },
    { anchor: "EōS Fitness", url: "https://www.eosfitness.com/" },
    { anchor: "Equinox", url: "https://www.equinox.com/" },
    { anchor: "LA Fitness", url: "https://www.lafitness.com/" },
  ],
  "top-20-gyms-vancouver": [
    { anchor: "Equinox Vancouver", url: "https://www.equinox.com/clubs/canada/vancouver" },
    { anchor: "Fitness World BC", url: "https://www.fitnessworld.ca/" },
    { anchor: "Anytime Fitness Canada", url: "https://www.anytimefitness.ca/" },
    { anchor: "F45 Training", url: "https://f45training.com/" },
    { anchor: "Club 16 Trevor Linden Fitness", url: "https://www.club16fitness.com/" },
  ],
  "top-20-gyms-brisbane": [
    { anchor: "Fitness First Australia", url: "https://www.fitnessfirst.com.au/" },
    { anchor: "Anytime Fitness Australia", url: "https://www.anytimefitness.com.au/" },
    { anchor: "F45 Training", url: "https://f45training.com.au/" },
    { anchor: "Jetts Fitness", url: "https://www.jetts.com.au/" },
    { anchor: "Goodlife Health Clubs", url: "https://www.goodlife.com.au/" },
  ],
  "top-20-gyms-san-diego": [
    { anchor: "Fit Athletic Club", url: "https://www.fitacclub.com/" },
    { anchor: "EōS Fitness", url: "https://www.eosfitness.com/" },
    { anchor: "World Gym San Diego", url: "https://www.worldgym.com/sandiego" },
    { anchor: "LA Fitness", url: "https://www.lafitness.com/" },
    { anchor: "The Gym Grounds", url: "https://www.thegymgrounds.com/" },
  ],
  "top-20-gyms-dublin": [
    { anchor: "Westwood Club", url: "https://www.westwood.ie/" },
    { anchor: "Flye Fit", url: "https://www.flyefit.ie/" },
    { anchor: "Ben Dunne Gyms", url: "https://www.bendunnegyms.com/" },
    { anchor: "FLYE Fitness", url: "https://www.flyefitness.ie/" },
    { anchor: "CrossFit Dublin", url: "https://www.crossfitdublin.com/" },
  ],
};

function link({ anchor, url }) {
  return `[${anchor}](${url})`;
}

for (const [slug, links] of Object.entries(TABLE_LINKS)) {
  const filePath = path.join(POSTS_DIR, `${slug}.md`);
  let content = fs.readFileSync(filePath, "utf8");

  content = content.replace(
    /(\| Gym \| Best For \| Est\. (?:Monthly|Weekly) Cost \| Standout Feature \|\n\| --- \| --- \| --- \| --- \|\n)([\s\S]*?)(\n\n## The 20 Best)/,
    (_, header, body, footer) => {
      const rows = body.trim().split("\n");
      const fixed = rows.map((row, i) => {
        if (i >= links.length) return row;
        const parts = row.split("|").map((p) => p.trim()).filter(Boolean);
        if (parts.length < 4) return row;
        return `| ${link(links[i])} | ${parts[1]} | ${parts[2]} | ${parts[3]} |`;
      });
      return `${header}${fixed.join("\n")}${footer}`;
    },
  );

  fs.writeFileSync(filePath, content);
  console.log(`fixed table ${slug}`);
}

console.log("done");
