#!/usr/bin/env node
/**
 * Add official website links to city gym blog posts.
 * Run from frontend/: node scripts/patch-gym-post-websites.mjs
 */

import fs from "fs";
import path from "path";

const POSTS_DIR = path.join(process.cwd(), "posts");

/**
 * slug → array of { anchor, url } in gym order (1–20)
 * anchor = descriptive link text for SEO
 */
const WEBSITES = {
  "top-20-gyms-new-york-city": [
    { anchor: "Equinox Hudson Yards", url: "https://www.equinox.com/clubs/new-york/hudson-yards" },
    { anchor: "Dogpound", url: "https://www.thedogpound.com/" },
    { anchor: "Chelsea Piers Fitness", url: "https://www.chelseapiers.com/fitness" },
    { anchor: "Life Time Bryant Park", url: "https://www.lifetime.life/locations/ny/bryant-park.html" },
    { anchor: "TMPL Fitness", url: "https://www.tmpl-clubs.com/" },
    { anchor: "Westside Barbell", url: "https://www.westside-barbell.com/" },
    { anchor: "Tone House", url: "https://www.tonehouse.com/" },
    { anchor: "Asphalt Green", url: "https://www.asphaltgreen.org/" },
    { anchor: "CompleteBody Gym", url: "https://www.completebody.com/" },
    { anchor: "Crunch Fitness", url: "https://www.crunch.com/locations/new-york" },
    { anchor: "Blink Fitness", url: "https://www.blinkfitness.com/" },
    { anchor: "Planet Fitness", url: "https://www.planetfitness.com/gyms/new-york-ny" },
    { anchor: "New York Sports Club", url: "https://www.newyorksportsclubs.com/" },
    { anchor: "Barry's Bootcamp NYC", url: "https://www.barrys.com/studio/new-york-city" },
    { anchor: "Rumble Boxing", url: "https://www.rumbleboxinggym.com/" },
    { anchor: "CrossFit NYC", url: "https://crossfitnyc.com/" },
    { anchor: "Mid City Gym", url: "https://www.midcitygym.com/" },
    { anchor: "Lucille Roberts", url: "https://www.lucilleroberts.com/" },
    { anchor: "Retro Fitness", url: "https://www.retrofitness.com/" },
    { anchor: "YMCA of Greater New York", url: "https://ymcanyc.org/" },
  ],
  "top-20-gyms-los-angeles": [
    { anchor: "Gold's Gym Venice", url: "https://www.goldsgym.com/locations/ca/venice" },
    { anchor: "Equinox West Hollywood", url: "https://www.equinox.com/clubs/los-angeles/west-hollywood" },
    { anchor: "Muscle Beach Gym", url: "https://musclebeachvenice.com/" },
    { anchor: "EōS Fitness", url: "https://www.eosfitness.com/" },
    { anchor: "LA Fitness", url: "https://www.lafitness.com/" },
    { anchor: "24 Hour Fitness", url: "https://www.24hourfitness.com/" },
    { anchor: "The Yard Gym", url: "https://www.theyardgym.com/" },
    { anchor: "Barry's Bootcamp LA", url: "https://www.barrys.com/studio/los-angeles" },
    { anchor: "F45 Training", url: "https://f45training.com/" },
    { anchor: "Rise Nation", url: "https://risenation.com/" },
    { anchor: "Training Mate", url: "https://www.trainingmate.com/" },
    { anchor: "Spectrum Clubs", url: "https://www.spectrumclubs.com/" },
    { anchor: "Crunch Fitness", url: "https://www.crunch.com/locations/california" },
    { anchor: "Planet Fitness", url: "https://www.planetfitness.com/" },
    { anchor: "Fortis Fitness LA", url: "https://www.fortisfitnessla.com/" },
    { anchor: "Legacy Gym Pasadena", url: "https://www.legacygympasadena.com/" },
    { anchor: "Wilfitness", url: "https://www.wilfitness.com/" },
    { anchor: "UCLA Recreation", url: "https://recreation.ucla.edu/" },
    { anchor: "Sweat Garage", url: "https://www.sweatgarage.com/" },
    { anchor: "Body by Simone", url: "https://www.bodybysimone.com/" },
  ],
  "top-20-gyms-chicago": [
    { anchor: "East Bank Club", url: "https://www.eastbankclub.com/" },
    { anchor: "Chicago Athletic Clubs", url: "https://www.chicagoathleticclubs.com/" },
    { anchor: "Equinox Chicago", url: "https://www.equinox.com/clubs/chicago" },
    { anchor: "XSport Fitness", url: "https://www.xsportfitness.com/" },
    { anchor: "LA Fitness", url: "https://www.lafitness.com/" },
    { anchor: "South Loop Strength & Conditioning", url: "https://www.southloopstrength.com/" },
    { anchor: "Windy City Strength & Conditioning", url: "https://www.windycitystrength.com/" },
    { anchor: "Mode Gym", url: "https://www.modegym.com/" },
    { anchor: "Orange Shoe Personal Fitness", url: "https://www.orangeshoefitness.com/" },
    { anchor: "FFC Chicago", url: "https://www.ffc.com/" },
    { anchor: "Planet Fitness", url: "https://www.planetfitness.com/" },
    { anchor: "Crunch Fitness", url: "https://www.crunch.com/locations/illinois" },
    { anchor: "CrossFit Chicago", url: "https://crossfitchicago.com/" },
    { anchor: "Lakeshore Sport & Fitness", url: "https://www.lakeshoresf.com/" },
    { anchor: "Midtown Athletic Club", url: "https://www.midtown.com/" },
    { anchor: "Iron Flag Strength", url: "https://www.ironflagstrength.com/" },
    { anchor: "Hybrid Strength Athletics", url: "https://www.hybridstrengthathletics.com/" },
    { anchor: "YMCA of Metro Chicago", url: "https://www.ymcachicago.org/" },
    { anchor: "DePaul University Recreation", url: "https://depaul.edu/campus-recreation" },
    { anchor: "Charter Fitness", url: "https://www.charterfitness.com/" },
  ],
  "top-20-gyms-houston": [
    { anchor: "Life Time Athletic", url: "https://www.lifetime.life/locations/tx.html" },
    { anchor: "OAK Fitness", url: "https://www.oakfitness.com/" },
    { anchor: "EōS Fitness", url: "https://www.eosfitness.com/" },
    { anchor: "LA Fitness", url: "https://www.lafitness.com/" },
    { anchor: "24 Hour Fitness", url: "https://www.24hourfitness.com/" },
    { anchor: "Planet Fitness", url: "https://www.planetfitness.com/" },
    { anchor: "CrossFit Houston", url: "https://crossfithouston.com/" },
    { anchor: "F45 Training", url: "https://f45training.com/" },
    { anchor: "YMCA of Greater Houston", url: "https://www.ymcahouston.org/" },
    { anchor: "Equinox", url: "https://www.equinox.com/" },
    { anchor: "Urban Athletics", url: "https://www.urbanathleticshtx.com/" },
    { anchor: "Texas Elite Fitness", url: "https://www.texaselitefitness.com/" },
    { anchor: "Gold's Gym Houston", url: "https://www.goldsgym.com/" },
    { anchor: "Crunch Fitness", url: "https://www.crunch.com/locations/texas" },
    { anchor: "Chuze Fitness", url: "https://chuzefitness.com/" },
    { anchor: "Metroflex Gym Houston", url: "https://www.metroflexgym.com/" },
    { anchor: "DEFINE body & mind", url: "https://www.definebody.com/" },
    { anchor: "Memorial Athletic Club", url: "https://www.memorialathleticclub.com/" },
    { anchor: "The Houstonian Club", url: "https://www.houstonian.com/club" },
    { anchor: "Anytime Fitness", url: "https://www.anytimefitness.com/" },
  ],
  "top-20-gyms-london": [
    { anchor: "Third Space", url: "https://www.thirdspace.london/" },
    { anchor: "Gymbox", url: "https://www.gymbox.com/" },
    { anchor: "Virgin Active UK", url: "https://www.virginactive.co.uk/" },
    { anchor: "PureGym", url: "https://www.puregym.com/" },
    { anchor: "The Gym Group", url: "https://www.thegymgroup.com/" },
    { anchor: "Equinox London", url: "https://www.equinox.com/clubs/london" },
    { anchor: "Foundry Fitness", url: "https://www.foundryfit.com/" },
    { anchor: "1Rebel", url: "https://www.1rebel.com/" },
    { anchor: "Barry's Bootcamp London", url: "https://www.barrys.com/studio/london" },
    { anchor: "CrossFit London", url: "https://www.crossfitlondonuk.com/" },
    { anchor: "Strongman Fitness", url: "https://www.strongmanfitness.co.uk/" },
    { anchor: "Frame", url: "https://www.moveyourframe.com/" },
    { anchor: "David Lloyd Clubs", url: "https://www.davidlloyd.co.uk/" },
    { anchor: "Nuffield Health", url: "https://www.nuffieldhealth.com/gyms" },
    { anchor: "Fitness First UK", url: "https://www.fitnessfirst.co.uk/" },
    { anchor: "Snap Fitness UK", url: "https://www.snapfitness.com/uk/gyms" },
    { anchor: "F45 Training", url: "https://f45training.com/" },
    { anchor: "BXR London", url: "https://www.bxrlondon.com/" },
    { anchor: "YMCA St Paul's Group", url: "https://www.ymcalsw.org/" },
    { anchor: "UCL Sport", url: "https://www.ucl.ac.uk/sport/" },
  ],
  "top-20-gyms-toronto": [
    { anchor: "Equinox Yorkville", url: "https://www.equinox.com/clubs/canada/yorkville" },
    { anchor: "Fit Factory Fitness", url: "https://www.fitfactoryfitness.com/" },
    { anchor: "GoodLife Fitness", url: "https://www.goodlifefitness.com/" },
    { anchor: "Planet Fitness Canada", url: "https://www.planetfitness.ca/" },
    { anchor: "Strength Academy", url: "https://www.strengthacademy.ca/" },
    { anchor: "F45 Training", url: "https://f45training.com/" },
    { anchor: "Barry's Bootcamp Toronto", url: "https://www.barrys.com/studio/toronto" },
    { anchor: "YMCA of Greater Toronto", url: "https://www.ymcagta.org/" },
    { anchor: "LA Fitness", url: "https://www.lafitness.com/" },
    { anchor: "Totum Life Science", url: "https://www.totumlife.com/" },
    { anchor: "CrossFit YKV", url: "https://www.crossfitykv.com/" },
    { anchor: "Spynga", url: "https://www.spynga.com/" },
    { anchor: "Anytime Fitness Canada", url: "https://www.anytimefitness.ca/" },
    { anchor: "Crunch Fitness", url: "https://www.crunch.com/" },
    { anchor: "University of Toronto Athletics", url: "https://kpe.utoronto.ca/facilities" },
    { anchor: "Evolve Strength", url: "https://www.evolvestrength.ca/" },
    { anchor: "Sweat and Tonic", url: "https://www.sweatandtonic.com/" },
    { anchor: "Movati Athletic", url: "https://www.movatiathletic.com/" },
    { anchor: "Hone Fitness", url: "https://www.honefitness.com/" },
    { anchor: "Club 16 Trevor Linden Fitness", url: "https://www.club16fitness.com/" },
  ],
  "top-20-gyms-sydney": [
    { anchor: "Fitness First Australia", url: "https://www.fitnessfirst.com.au/" },
    { anchor: "Virgin Active Australia", url: "https://www.virginactive.com.au/" },
    { anchor: "Anytime Fitness Australia", url: "https://www.anytimefitness.com.au/" },
    { anchor: "F45 Training", url: "https://f45training.com.au/" },
    { anchor: "Barry's Bootcamp Sydney", url: "https://www.barrys.com/studio/sydney" },
    { anchor: "Bondi Beach outdoor gym", url: "https://www.waverley.nsw.gov.au/our-public-spaces/beaches-and-coast/bondi-beach" },
    { anchor: "CrossFit gyms Sydney", url: "https://www.crossfit.com/map" },
    { anchor: "Plus Fitness", url: "https://www.plusfitness.com.au/" },
    { anchor: "Jetts Fitness", url: "https://www.jetts.com.au/" },
    { anchor: "Fernwood Fitness", url: "https://www.fernwoodfitness.com.au/" },
    { anchor: "Revo Fitness", url: "https://www.revofitness.com.au/" },
    { anchor: "City Gym Sydney", url: "https://www.citygym.com.au/" },
    { anchor: "Flow Athletic", url: "https://www.flowathletic.com.au/" },
    { anchor: "YMCA NSW", url: "https://www.ymcansw.org.au/" },
    { anchor: "Snap Fitness Australia", url: "https://www.snapfitness.com/au/gyms" },
    { anchor: "Body Fit Training", url: "https://www.bodyfittraining.au/" },
    { anchor: "UniActive UTS", url: "https://www.uts.edu.au/about/facilities/sport-and-fitness" },
    { anchor: "Iron Grip Gym", url: "https://www.irongripgym.com.au/" },
    { anchor: "98 Riley Street Gym", url: "https://www.98riley.com.au/" },
    { anchor: "Planet Fitness Australia", url: "https://www.planetfitness.com.au/" },
  ],
  "top-20-gyms-melbourne": [
    { anchor: "Doherty's Gym", url: "https://www.dohertysgym.com.au/" },
    { anchor: "Fitness First Australia", url: "https://www.fitnessfirst.com.au/" },
    { anchor: "Revo Fitness", url: "https://www.revofitness.com.au/" },
    { anchor: "Anytime Fitness Australia", url: "https://www.anytimefitness.com.au/" },
    { anchor: "F45 Training", url: "https://f45training.com.au/" },
    { anchor: "Virgin Active Australia", url: "https://www.virginactive.com.au/" },
    { anchor: "CrossFit 3141", url: "https://www.crossfit3141.com.au/" },
    { anchor: "Jetts Fitness", url: "https://www.jetts.com.au/" },
    { anchor: "Plus Fitness", url: "https://www.plusfitness.com.au/" },
    { anchor: "Fernwood Fitness", url: "https://www.fernwoodfitness.com.au/" },
    { anchor: "Snap Fitness Australia", url: "https://www.snapfitness.com/au/gyms" },
    { anchor: "Melbourne University Sport", url: "https://sport.unimelb.edu.au/" },
    { anchor: "Iron Revolution", url: "https://www.ironrevolution.com.au/" },
    { anchor: "KX Pilates", url: "https://kxpilates.com/" },
    { anchor: "Barry's Bootcamp Melbourne", url: "https://www.barrys.com/studio/melbourne" },
    { anchor: "YMCA Victoria", url: "https://www.ymca.org.au/centres" },
    { anchor: "Goodlife Health Clubs", url: "https://www.goodlife.com.au/" },
    { anchor: "Warehouse Gym Melbourne", url: "https://www.warehousegym.com.au/" },
    { anchor: "Genesis Health and Fitness", url: "https://www.genesishealthandfitness.com.au/" },
    { anchor: "Planet Fitness Australia", url: "https://www.planetfitness.com.au/" },
  ],
  "top-20-gyms-phoenix": [
    { anchor: "Life Time Athletic", url: "https://www.lifetime.life/locations/az.html" },
    { anchor: "Mountainside Fitness", url: "https://www.mountainsidefitness.com/" },
    { anchor: "EōS Fitness", url: "https://www.eosfitness.com/" },
    { anchor: "LA Fitness", url: "https://www.lafitness.com/" },
    { anchor: "24 Hour Fitness", url: "https://www.24hourfitness.com/" },
    { anchor: "Planet Fitness", url: "https://www.planetfitness.com/" },
    { anchor: "CrossFit affiliates Phoenix", url: "https://www.crossfit.com/map" },
    { anchor: "F45 Training", url: "https://f45training.com/" },
    { anchor: "Valley of the Sun YMCA", url: "https://valleyymca.org/" },
    { anchor: "Equinox", url: "https://www.equinox.com/" },
    { anchor: "Chuze Fitness", url: "https://chuzefitness.com/" },
    { anchor: "Anytime Fitness", url: "https://www.anytimefitness.com/" },
    { anchor: "Gold's Gym", url: "https://www.goldsgym.com/" },
    { anchor: "Crunch Fitness", url: "https://www.crunch.com/locations/arizona" },
    { anchor: "Arizona Athletic Clubs", url: "https://www.arizonaathleticclubs.com/" },
    { anchor: "Vive Fitness", url: "https://www.vivefitnessaz.com/" },
    { anchor: "ASU Sun Devil Fitness", url: "https://fitness.asu.edu/" },
    { anchor: "Iron Athlete Gym", url: "https://www.ironathletegym.com/" },
    { anchor: "Orangetheory Fitness", url: "https://www.orangetheory.com/" },
    { anchor: "Retro Fitness", url: "https://www.retrofitness.com/" },
  ],
  "top-20-gyms-philadelphia": [
    { anchor: "Philadelphia Sports Clubs", url: "https://www.philadelphiasportsclubs.com/" },
    { anchor: "City Fitness Philadelphia", url: "https://www.cityfitnessphilly.com/" },
    { anchor: "SWEAT Fitness", url: "https://www.sweatfitness.com/" },
    { anchor: "Retro Fitness", url: "https://www.retrofitness.com/" },
    { anchor: "Planet Fitness", url: "https://www.planetfitness.com/" },
    { anchor: "LA Fitness", url: "https://www.lafitness.com/" },
    { anchor: "CrossFit Philly", url: "https://www.crossfitphilly.com/" },
    { anchor: "F45 Training", url: "https://f45training.com/" },
    { anchor: "YMCA of Philadelphia", url: "https://philaymca.org/" },
    { anchor: "Equinox", url: "https://www.equinox.com/" },
    { anchor: "Iron Gym Philadelphia", url: "https://www.irongymphilly.com/" },
    { anchor: "Crunch Fitness", url: "https://www.crunch.com/locations/pennsylvania" },
    { anchor: "24 Hour Fitness", url: "https://www.24hourfitness.com/" },
    { anchor: "Orangetheory Fitness", url: "https://www.orangetheory.com/" },
    { anchor: "University of Pennsylvania Recreation", url: "https://www.campusrec.upenn.edu/" },
    { anchor: "Chuze Fitness", url: "https://chuzefitness.com/" },
    { anchor: "Fusion Fitness Philadelphia", url: "https://www.fusionfitnessphilly.com/" },
    { anchor: "Anytime Fitness", url: "https://www.anytimefitness.com/" },
    { anchor: "Gold's Gym", url: "https://www.goldsgym.com/" },
    { anchor: "Philadelphia Rock Gyms", url: "https://www.philarockgym.com/" },
  ],
  "top-20-gyms-dallas": [
    { anchor: "Life Time Athletic", url: "https://www.lifetime.life/locations/tx.html" },
    { anchor: "Metroflex Gym", url: "https://www.metroflexgym.com/" },
    { anchor: "Equinox", url: "https://www.equinox.com/" },
    { anchor: "EōS Fitness", url: "https://www.eosfitness.com/" },
    { anchor: "LA Fitness", url: "https://www.lafitness.com/" },
    { anchor: "24 Hour Fitness", url: "https://www.24hourfitness.com/" },
    { anchor: "Planet Fitness", url: "https://www.planetfitness.com/" },
    { anchor: "CrossFit affiliates Dallas", url: "https://www.crossfit.com/map" },
    { anchor: "F45 Training", url: "https://f45training.com/" },
    { anchor: "YMCA of Metropolitan Dallas", url: "https://www.ymcadallas.org/" },
    { anchor: "Gold's Gym", url: "https://www.goldsgym.com/" },
    { anchor: "Crunch Fitness", url: "https://www.crunch.com/locations/texas" },
    { anchor: "Texas Health Fitness Center", url: "https://www.texashealth.org/fitness" },
    { anchor: "Anytime Fitness", url: "https://www.anytimefitness.com/" },
    { anchor: "Barry's Bootcamp", url: "https://www.barrys.com/" },
    { anchor: "Chuze Fitness", url: "https://chuzefitness.com/" },
    { anchor: "SMU Dedman Recreation Center", url: "https://www.smu.edu/Rec" },
    { anchor: "Destination Dallas", url: "https://www.destinationdallas.com/" },
    { anchor: "Orangetheory Fitness", url: "https://www.orangetheory.com/" },
    { anchor: "Recess Dallas", url: "https://www.recessdallas.com/" },
  ],
  "top-20-gyms-vancouver": [
    { anchor: "Equinox Vancouver", url: "https://www.equinox.com/clubs/canada/vancouver" },
    { anchor: "Fitness World BC", url: "https://www.fitnessworld.ca/" },
    { anchor: "Anytime Fitness Canada", url: "https://www.anytimefitness.ca/" },
    { anchor: "F45 Training", url: "https://f45training.com/" },
    { anchor: "Club 16 Trevor Linden Fitness", url: "https://www.club16fitness.com/" },
    { anchor: "YMCA of Greater Vancouver", url: "https://www.gv.ymca.ca/" },
    { anchor: "CrossFit affiliates Vancouver", url: "https://www.crossfit.com/map" },
    { anchor: "Barry's Bootcamp", url: "https://www.barrys.com/" },
    { anchor: "Oxygen Yoga & Fitness", url: "https://www.oxygenyogaandfitness.com/" },
    { anchor: "Club 16 Trevor Linden Fitness", url: "https://www.club16fitness.com/" },
    { anchor: "UBC Recreation", url: "https://recreation.ubc.ca/" },
    { anchor: "Jetts Fitness", url: "https://www.jetts.ca/" },
    { anchor: "Snap Fitness Canada", url: "https://www.snapfitness.com/ca/gyms" },
    { anchor: "Fittown Athletic Club", url: "https://www.fittownathleticclub.com/" },
    { anchor: "Kalev Fitness", url: "https://www.kalevfitness.com/" },
    { anchor: "GoodLife Fitness", url: "https://www.goodlifefitness.com/" },
    { anchor: "Planet Fitness Canada", url: "https://www.planetfitness.ca/" },
    { anchor: "Ride Cycle Club", url: "https://www.ridecycleclub.com/" },
    { anchor: "West Coast Strength", url: "https://www.westcoaststrength.ca/" },
    { anchor: "Gold's Gym", url: "https://www.goldsgym.com/" },
  ],
  "top-20-gyms-brisbane": [
    { anchor: "Fitness First Australia", url: "https://www.fitnessfirst.com.au/" },
    { anchor: "Anytime Fitness Australia", url: "https://www.anytimefitness.com.au/" },
    { anchor: "F45 Training", url: "https://f45training.com.au/" },
    { anchor: "Jetts Fitness", url: "https://www.jetts.com.au/" },
    { anchor: "Goodlife Health Clubs", url: "https://www.goodlife.com.au/" },
    { anchor: "Virgin Active Australia", url: "https://www.virginactive.com.au/" },
    { anchor: "CrossFit affiliates Brisbane", url: "https://www.crossfit.com/map" },
    { anchor: "Plus Fitness", url: "https://www.plusfitness.com.au/" },
    { anchor: "Fernwood Fitness", url: "https://www.fernwoodfitness.com.au/" },
    { anchor: "Revo Fitness", url: "https://www.revofitness.com.au/" },
    { anchor: "South Bank outdoor gym", url: "https://www.visitbrisbane.com.au/brisbane-city/south-bank" },
    { anchor: "Snap Fitness Australia", url: "https://www.snapfitness.com/au/gyms" },
    { anchor: "UQ Sport", url: "https://sport.uq.edu.au/" },
    { anchor: "Genesis Health and Fitness", url: "https://www.genesishealthandfitness.com.au/" },
    { anchor: "Body Fit Training", url: "https://www.bodyfittraining.au/" },
    { anchor: "YMCA Brisbane", url: "https://www.ymcabrisbane.org/" },
    { anchor: "World Gym Australia", url: "https://www.worldgym.com/" },
    { anchor: "Orangetheory Fitness", url: "https://www.orangetheory.com.au/" },
    { anchor: "KX Pilates", url: "https://kxpilates.com/" },
    { anchor: "Planet Fitness Australia", url: "https://www.planetfitness.com.au/" },
  ],
  "top-20-gyms-san-diego": [
    { anchor: "Fit Athletic Club", url: "https://www.fitacclub.com/" },
    { anchor: "EōS Fitness", url: "https://www.eosfitness.com/" },
    { anchor: "World Gym San Diego", url: "https://www.worldgym.com/sandiego" },
    { anchor: "LA Fitness", url: "https://www.lafitness.com/" },
    { anchor: "The Gym Grounds", url: "https://www.thegymgrounds.com/" },
    { anchor: "24 Hour Fitness", url: "https://www.24hourfitness.com/" },
    { anchor: "Planet Fitness", url: "https://www.planetfitness.com/" },
    { anchor: "CrossFit affiliates San Diego", url: "https://www.crossfit.com/map" },
    { anchor: "F45 Training", url: "https://f45training.com/" },
    { anchor: "YMCA of San Diego County", url: "https://www.ymcasd.org/" },
    { anchor: "Chuze Fitness", url: "https://chuzefitness.com/" },
    { anchor: "Crunch Fitness", url: "https://www.crunch.com/locations/california" },
    { anchor: "Barry's Bootcamp", url: "https://www.barrys.com/" },
    { anchor: "Mission Beach outdoor gym", url: "https://www.sandiego.gov/park-and-recreation/parks" },
    { anchor: "Anytime Fitness", url: "https://www.anytimefitness.com/" },
    { anchor: "UCSD Recreation", url: "https://recreation.ucsd.edu/" },
    { anchor: "Gold's Gym", url: "https://www.goldsgym.com/" },
    { anchor: "Orangetheory Fitness", url: "https://www.orangetheory.com/" },
    { anchor: "The Boxing Club", url: "https://www.theboxingclub.com/" },
    { anchor: "Equinox", url: "https://www.equinox.com/" },
  ],
  "top-20-gyms-dublin": [
    { anchor: "Westwood Club", url: "https://www.westwood.ie/" },
    { anchor: "Flye Fit", url: "https://www.flyefit.ie/" },
    { anchor: "Ben Dunne Gyms", url: "https://www.bendunnegyms.com/" },
    { anchor: "FLYE Fitness", url: "https://www.flyefitness.ie/" },
    { anchor: "Virgin Active Ireland", url: "https://www.virginactive.ie/" },
    { anchor: "CrossFit Dublin", url: "https://www.crossfitdublin.com/" },
    { anchor: "F45 Training", url: "https://f45training.ie/" },
    { anchor: "Aura Leisure", url: "https://www.auraleisure.ie/" },
    { anchor: "PureGym Ireland", url: "https://www.puregym.com/" },
    { anchor: "The Gym Group", url: "https://www.thegymgroup.com/" },
    { anchor: "David Lloyd Ireland", url: "https://www.davidlloyd.ie/" },
    { anchor: "Flye Fit 24-hour gyms", url: "https://www.flyefit.ie/" },
    { anchor: "UCD Sport & Fitness", url: "https://www.ucd.ie/sport/" },
    { anchor: "Trinity Sport", url: "https://www.tcd.ie/Sport/" },
    { anchor: "Ironmill Gym", url: "https://www.ironmill.ie/" },
    { anchor: "Barry's Bootcamp", url: "https://www.barrys.com/" },
    { anchor: "YMCA Ireland", url: "https://www.ymca.ie/" },
    { anchor: "The Marker Hotel Gym", url: "https://www.doylecollection.com/hotels/the-marker-hotel" },
    { anchor: "Swim Ireland", url: "https://www.swimireland.ie/" },
    { anchor: "Planet Fitness", url: "https://www.planetfitness.com/" },
  ],
};

function mdLink({ anchor, url }) {
  return `[${anchor}](${url})`;
}

function patchFile(slug, sites) {
  const filePath = path.join(POSTS_DIR, `${slug}.md`);
  let content = fs.readFileSync(filePath, "utf8");

  if (content.includes("**Website:**")) {
    console.log(`skip ${slug} (already has website links)`);
    return;
  }

  // Link top-5 comparison table gym names (first column only, data rows)
  const tableSection = content.match(
    /(\| Gym \| Best For \| Est\. (?:Monthly|Weekly) Cost \| Standout Feature \|\n\| --- \| --- \| --- \| --- \|\n)([\s\S]*?)(\n\n## The 20 Best)/,
  );
  if (tableSection) {
    const [, header, body, footer] = tableSection;
    const rows = body.trim().split("\n");
    const linkedRows = rows.map((row, i) => {
      if (i >= sites.length) return row;
      const match = row.match(/^\| ([^|]+) \| (.+)$/);
      if (!match) return row;
      const link = mdLink(sites[i]);
      return `| ${link} | ${match[2]}`;
    });
    content = content.replace(
      tableSection[0],
      `${header}${linkedRows.join("\n")}${footer}`,
    );
  }

  // Add **Website:** after each **Est. cost:** line in gym listings
  let siteIndex = 0;
  content = content.replace(
    /(\*\*Est\. cost:\*\* [^\n]+ \*\(approximate\)\*\n)(\n)/g,
    (match, costLine, followingNewline) => {
      if (siteIndex >= sites.length) return match;
      const site = sites[siteIndex];
      siteIndex += 1;
      return `${costLine}**Website:** ${mdLink(site)}\n${followingNewline}`;
    },
  );

  fs.writeFileSync(filePath, content);
  console.log(`patched ${slug} (${siteIndex} website links)`);
}

for (const [slug, sites] of Object.entries(WEBSITES)) {
  if (sites.length !== 20) {
    console.error(`${slug}: expected 20 sites, got ${sites.length}`);
    process.exit(1);
  }
  patchFile(slug, sites);
}

console.log("done");
