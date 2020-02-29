import { Injectable } from '@angular/core';
import {MetadataStoreService, SKNRefMeta} from "./metadata-store.service";
import { DbConService } from "../db-con.service";
import * as Day from "dayjs";

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
  readonly date: Day.Dayjs = LIVE ? Day(null, null, "utc") : Day("1990-05-10:00:00:00.000Z");
  

  constructor(private siteMeta: MetadataStoreService, private dbcon: DbConService) {
    console.log("Running");
    this.getValuesTest();
  }

  getValues(start: string, end?: string) {
    //query
    let skns = new Set();
    //insert skns from query results to skns set
    let sknArr = Array.from(skns);
    let meta = this.siteMeta.getMetaBySKNs(sknArr);
    //where are these stored, how are they handled?
    //probably have this just retreive them then have the storage etc handled elsewhere
  }

  //test date querying
  getValuesTest() {
    //just use iso standard time format for everything and explicitly specify utc to ensure consistency
    console.log(Day(undefined, {utc: true}).toISOString(), Day("1990-05-10:00:00:00.000Z", {utc: true}).toISOString());
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

  getAllValues() {
    return new Promise((resolve, reject) => {
      let query = "{'name':'value_test'}";
  
  
      let resultHandler: (results: any) => any = (results: any) => {
        return results;
      }
  
      this.dbcon.query<any[]>(query, resultHandler).then((vals) => {
        resolve(vals);
      });
    });
     
  }

  getValueRange() {

  }

  //resolves if recent value was found, otherwise rejects with lower bound date used
  getRecentValues(date: Day.Dayjs, step: TimeStep) {
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
      //ISO standard: YYYY-MM-DD:HH:MM:SS.SSSZ
  
      let query = `{'$and':[{'name':'value_test'},{'value.date':{$gte:{'$date':'${lastDataRange[0]}'}}},{'value.date':{$lte:{'$date':'${lastDataRange[1]}'}}}]}`;
      //query = "{'name':'value_test'}";
  
  
      let resultHandler: (results: any) => any = (results: any) => {
        return this.extractLastValues(results);
        console.log(results);
        return results;
      }
  
      //need to add in some error handling
      this.dbcon.query<SKNRefValue>(query, this.extractLastValues).then((vals) => {
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
  extractLastValues(recent: any[]): SKNRefValue {
    //if empty just return an empty object
    if(recent.length == 0) {
      return {};
    }

    //initialize max date and value doc object to first item
    let doc = recent[0];
    let maxDate = Day(doc.value.date.$date);
    let valueDocs: SKNRefValue = {};
    valueDocs[doc.value.skn] = {
      value: doc.value.value
    };
    for(let i = 1; i < recent.length; i++) {
      doc = recent[i]
      let date = Day(doc.value.date.$date);
      //the date of this doc falls after the others found, set max date and overwrite list of value docs with docs under current date
      if(date.isAfter(maxDate)) {
        maxDate = date;
        valueDocs = {};
        valueDocs[doc.value.skn] = {
          value: doc.value.value
        };
      }
      //if in the same data set as the current max then add the value to the doc list
      else if(date.isSame(maxDate)) {
        valueDocs[doc.value.skn] = {
          value: doc.value.value
        };
      }
      
    }

    return valueDocs;
  }

  //should add a limit on how many recursions
  getRecentValuesRecursive(date: Day.Dayjs, step: TimeStep, max: number, i: number = 0): Promise<any> {
    return new Promise((resolve, reject) => {
      if(i >= max) {
        reject();
      }
      this.getRecentValues(this.date, SiteValueFetcherService.STEP).then((value) => {
        console.log(value);
        resolve(value);
      }, (min) => {
        console.log("failed");
        return this.getRecentValuesRecursive(min, SiteValueFetcherService.STEP, max, i + 1);
      });
    });
  }

}



// class RecursivePromise<T, V> {
//   constructor(f: () => Promise<T>, cb: (T | V) => ) {
//     f().then((result: T) => {
//       if(condition(result)) {
        
//       }
//       else {

//       }
//     }, (result: V) => {

//     })

//     if(condition)
//   }
// }

export interface TimeStep {
  size: number,
  scale: Day.OpUnitType
}


export interface SKNRefValue {
  [skn: string]: {
    value: number
  }
}
