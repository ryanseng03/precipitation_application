import { Injectable } from '@angular/core';
import { SiteInfo, SiteMetadata } from 'src/app/models/SiteMetadata';

@Injectable({
  providedIn: 'root'
})
export class MetadataPrettifierService {

  constructor() { }

  prettifySiteMeta(stationMeta: SiteInfo) {

  }

  prettifySiteName(name: string): string {
    let translated = name;

    //substr abreviation assumed translation (lc all, transform first)
    let abnormalSubstrTransforms = {
      raingagenr: "rain gage near",
      raingafenr: "rain gage near",
      raingageat: "rain gage at",
      gagenr: "gage near",
      gafenr: "gage near",
      gageat: "gage at",
      rgat: "rainfall gatherer",
      nr: "near"
    }
    //keep strings capitalized (known abbreviations, typically directionals), also ignore . after
    let keepCap = ["S", "W", "N", "E", "SW", "SSW", "WSW", "NW", "NNW", "WNW", "SE", "SSE", "ESE", "NE", "NNE", "ENE"]
    let capLimit = 3

    //look for \.,.\ , \.\..\

    //tokenize
    //first split on spaces
    let tokenized = translated.split(" ");
    let temp = []
    //tokenize based on camel case
    for(let substr of tokenized) {
      //?= lookahead, matches [A-Z] but excludes from capture group (for split this will allow the matched token to be included in the results)
      let subtok = substr.split(/(?=[A-Z])/);
      //lowercase since case not important right now, make rest of regex easier

      temp.concat(subtok);
    }
    tokenized = temp;
    temp = []
    //tokenize based on periods and commas, don't split if numbers on both sides
    for(let substr of tokenized) {
      //commas and periods are at the end, so use lookbehind assertion (rather than lookahead)
      let subtok = substr.split(/(?<=[.,])/);
      temp.concat(subtok);
    }
    tokenized = temp;

    return translated;
  }

  prettifyPropertyName(property: string): string {
    let translated = property;
    switch(property) {
      case "skn": {
        translated = "SKN"
        break;
      }
      case "name": {
        translated = "Name"
        break;
      }
      case "observer": {
        translated = "Observer"
        break;
      }
      case "network": {
        translated = "Network"
        break;
      }
      case "island": {
        translated = "Island"
        break;
      }
      case "elevation": {
        translated = "Elevation"
        break;
      }
      case "lat": {
        translated = "Latitude"
        break;
      }
      case "lng": {
        translated = "Longitude"
        break;
      }
      case "nceiID": {
        translated = "NCEI ID"
        break;
      }
      case "nwsID": {
        translated = "NWS ID"
        break;
      }
      case "scanID": {
        translated = "SCAN ID"
        break;
      }
      case "smartNodeRfID": {
        translated = " Smart Node RFID"
        break;
      }
      case "value": {
        translated = "Value"
        break;
      }
      case "type": {
        translated = "Type"
        break;
      }
      case "date": {
        translated = "Date"
        break;
      }
    }
    return translated;
  }

  prettifyIsland(islandCode: string): string {
    //if for some reason no translation found, just use initial
    let name = islandCode;
    switch(islandCode) {
      case "BI": {
        name = "Big Island"
        break;
      }
      case "MA": {
        name = "Maui"
        break;
      }
      case "OA": {
        name = "Oʻahu"
        break;
      }
      case "MO": {
        name = "Molokaʻi"
        break;
      }
      case "KA": {
        name = "Kauaʻi"
        break;
      }
      case "LA": {
        name = "Lanai"
        break;
      }
      case "KO": {
        name = "Kahoʻolawe"
        break;
      }
    }
    return name;
  }
}
