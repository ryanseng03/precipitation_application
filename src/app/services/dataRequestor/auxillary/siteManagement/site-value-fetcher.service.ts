import { Injectable } from '@angular/core';
import {MetadataStoreService, SKNRefMeta} from "./metadata-store.service";
import { DbConService } from "../dbCon/db-con.service";
import Day from "dayjs";
import dsconfig from "./DataSetConfig.json";

const LIVE: boolean = false;

@Injectable({
  providedIn: 'root'
})
export class SiteValueFetcherService {

  static readonly STEP: TimeStep = {
    size: 1,
    scale: "day"
  }

  //keep date static for lifetime (from initialization), can make dynamic if you think it's necessary later
  readonly date: Day.Dayjs = LIVE ? Day(null, null, "utc") : Day("1990-05-10T00:00:00.000Z");
  

  constructor(private siteMeta: MetadataStoreService, private dbcon: DbConService) {
    // console.log("Running");
    // this.getValuesTest();
  }


  //test date querying
  private getValuesTest() {
    //just use iso standard time format for everything and explicitly specify utc to ensure consistency
    console.log(Day(undefined, {utc: true}).toISOString(), Day("1990-05-10T00:00:00.000Z", {utc: true}).toISOString());
    //cant do any sorting or just get nearest date, so just subtract the expected data time step from the live (or test) date and use the first result; resubmit query with next timestep if no results

    // this.getAllValues().then((result) => {
    //   console.log(result);
    // });

    //get last value recursively until something is found in case missing a time step
    this.getRecentValuesRecursive(this.date, SiteValueFetcherService.STEP, 5).then((value) => {
      console.log(value);
      //have skns, can reference meta docs from this
    }, () => {
      console.log("Failed to get recent values. Too many iterations.");
      //should have some sort of fallback? maybe define a fallback date with known data to use if recent pullback fails (last data available at application push)
    });

  }

  //might want to add options param that allows changing the number of iterations
  getRecentValues(): Promise<DateRefValues> {
    return this.getRecentValuesRecursive(this.date, SiteValueFetcherService.STEP, 5);
  }

  //testing only, probably shouldn't call this once all the data is there
  private getAllValues() {
    return new Promise((resolve, reject) => {
      let query = `{'name':'${dsconfig.valueDocName}'}`;
  
  
      let resultHandler: (results: any) => any = (results: any) => {
        return results;
      }
  
      this.dbcon.query<any[]>(query, resultHandler).then((vals) => {
        resolve(vals);
      });
    });
     
  }

  //get values on range [min, max]
  getValueRange(min: Day.Dayjs, max: Day.Dayjs): Promise<DateRefValues> {
    return new Promise<DateRefValues>((resolve, reject) => {
      let query = `{'$and':[{'name':'${dsconfig.valueDocName}'},{'value.date':{$gte:{'$date':'${min.toISOString()}'}}},{'value.date':{$lte:{'$date':'${max.toISOString()}'}}}]}`;

      // let resultHandler: (results: any) => any = (results: any) => {
      //   return this.sortByDate(results);
      // }
  
      this.dbcon.query<DateRefValues>(query, this.sortByDate).then((vals) => {
        console.log(vals);
        resolve(vals);
      });
    });
  }

  private sortByDate(values: any[]): DateRefValues {
    let sorted: DateRefValues = {};
    values.forEach((doc) => {
      //remove type tag from date
      doc.value.date = doc.value.date.$date;
      let date = doc.value.date;
      if(sorted[date] == undefined) {
        sorted[date] = [];
      }
      sorted[date].push(doc.value);
    });
    return sorted;
  }

  //resolves if recent value was found, otherwise rejects with lower bound date used
  private getRecentValuesMain(date: Day.Dayjs, step: TimeStep): Promise<DateRefValues> {
    return new Promise((resolve, reject) => {
      console.log(date);
      let lastDataMin = Day(date).subtract(step.size, step.scale);

      //inclusove
      let lastDataRange = [lastDataMin.toISOString(), date.toISOString()];
      console.log(lastDataRange);
  
      //let dateRange = [2017/01/01];
      //!!working!!
      //one of these (top one with dots) adds 10 hours, must be a weird time zone thing, make sure to standardize (change parser to use second time format, can use a string replace to replace dots with dashes)
      //Z indicates time zone always zero
      //ISO standard: YYYY-MM-DDTHH:MM:SS.SSSZ
  
      let query = `{'$and':[{'name':'${dsconfig.valueDocName}'},{'value.date':{$gte:{'$date':'${lastDataRange[0]}'}}},{'value.date':{$lte:{'$date':'${lastDataRange[1]}'}}}]}`;
      //query = `{'name':'${this.docName}'}`;
  
  
      // let resultHandler: (results: any) => any = (results: any) => {
      //   return this.extractLastValues(results);
      // }
  
      //need to add in some error handling
      this.dbcon.query<DateRefValues>(query, this.extractLastValues).then((vals) => {
        if(Object.keys(vals).length == 0) {
          console.log(lastDataMin);
          reject(lastDataMin);
        }
        else {
          console.log(vals);
          resolve(vals);
        }
        
      });
    });
    
  }

  //need to create a better definition for the value docs, using any for now
  //at the moment only need value, so just map SKNs to values, might need more later, e.g. step type, leave value as an object to make easier to expand
  private extractLastValues(recent: any[]): DateRefValues {
    //if empty just return an empty object
    if(recent.length == 0) {
      return {};
    }

    //initialize max date and value doc object to first item
    let doc = recent[0];
    let maxDate = Day(doc.value.date.$date);
    let valueDocs: DateRefValues = {};
    //remove type tag from date
    doc.value.date = doc.value.date.$date;
    valueDocs[doc.value.date] = [doc.value];
    for(let i = 1; i < recent.length; i++) {
      doc = recent[i]
      //remove type tag from date
      doc.value.date = doc.value.date.$date;
      let date = Day(doc.value.date);
      //the date of this doc falls after the others found, set max date and overwrite list of value docs with docs under current date
      if(date.isAfter(maxDate)) {
        maxDate = date;
        valueDocs = {};
        valueDocs[doc.value.date] = [doc.value];
      }
      //if in the same data set as the current max then add the value to the doc list
      else if(date.isSame(maxDate)) {
        valueDocs[doc.value.date].push(doc.value);
      }
      
    }

    return valueDocs;
  }

  
  private getRecentValuesRecursive(date: Day.Dayjs, step: TimeStep, max: number, i: number = 0): Promise<DateRefValues> {
    return new Promise((resolve, reject) => {
      if(i >= max) {
        reject("Too many iterations.");
      }
      this.getRecentValuesMain(this.date, SiteValueFetcherService.STEP).then((value) => {
        console.log(value);
        resolve(value);
      }, (min) => {
        return this.getRecentValuesRecursive(min, SiteValueFetcherService.STEP, max, i + 1);
      });
    });
  }

}

export interface TimeStep {
  size: number,
  scale: Day.OpUnitType
}

//remember that any date strings should always be iso standard at time 0
//ISO standard: YYYY-MM-DDTHH:MM:SS.SSSZ
export interface DateRefValues {
  [date: string]: RawSiteValues[]
}

//requires date (how did it get here without it), skn (need to ref the metadata doc it belongs with), value (the whole point)
//for date just remove the mongo type tag and store date directly, no reason to deal with that
export interface RawSiteValues {
  skn: string,
  value: number,
  date: string,
  [properties: string]: any
}

//need the skn, but shouldn't need to reference values by skn (only used to ref metadata), so key by date instead
// export interface SKNRefValue {
//   [skn: string]: {
//     value: number
//     type: string
//   }
// }
