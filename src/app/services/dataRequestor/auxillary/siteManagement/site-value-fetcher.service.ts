import { Injectable } from '@angular/core';
import { DbConService } from "../dbCon/db-con.service";
import Day from "dayjs";
import dsconfig from "./DataSetConfig.json";
import { SiteValue } from '../../../../models/SiteMetadata';
import {DataProcessorService} from "../../../dataProcessor/data-processor.service";

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
  

  constructor(private dbcon: DbConService, private processor: DataProcessorService) {

  }


  getInitValues() {
    //just in case the initial data location is isolated or something and you still need the recent value function
    return this.getRecentValues();
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
  getRecentValues(): Promise<SiteValue[]> {
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
      let value = this.processor.processValueDocs(doc.value);
      if(value != null) {
        let date = value.date;
        if(sorted[date] == undefined) {
          sorted[date] = [];
        }
        sorted[date].push(value);
      }
      else {
        console.error("Unrecognized value document format received.");
      }

      
    });
    return sorted;
  }

  //resolves if recent value was found, otherwise rejects with lower bound date used
  private getRecentValuesMain(date: Day.Dayjs, step: TimeStep): Promise<SiteValue[]> {
    return new Promise((resolve, reject) => {
      let lastDataMin = Day(date).subtract(step.size, step.scale);

      let lastDataRange = [lastDataMin.toISOString(), date.toISOString()];
  
      //let dateRange = [2017/01/01];
      //!!working!!
      //one of these (top one with dots) adds 10 hours, must be a weird time zone thing, make sure to standardize (change parser to use second time format, can use a string replace to replace dots with dashes)
      //Z indicates time zone always zero
      //ISO standard: YYYY-MM-DDTHH:MM:SS.SSSZ
  
      let query = `{'$and':[{'name':'${dsconfig.valueDocName}'},{'value.date':{$gte:{'$date':'${lastDataRange[0]}'}}},{'value.date':{$lte:{'$date':'${lastDataRange[1]}'}}}]}`;

  
      //need to add in some error handling
      this.dbcon.query<SiteValue[]>(query, this.extractLastValues).then((vals) => {
        if(Object.keys(vals).length == 0) {
          reject(lastDataMin);
        }
        else {
          resolve(vals);
        }
        
      });
    });
    
  }

  //need to create a better definition for the value docs, using any for now
  //at the moment only need value, so just map SKNs to values, might need more later, e.g. step type, leave value as an object to make easier to expand
  private extractLastValues(recent: any[]): SiteValue[] {

    let maxDate = null;
    let valueDocs = [];
    for(let i = 0; i < recent.length; i++) {
      let doc = recent[i]
      let value = this.processor.processValueDocs(doc.value);
      //if value is null then value doc from database is in an unexpected format
      if(value != null) {
        let date = Day(value.date);
        //the date of this doc falls after the others found or this is the first valid value doc, set max date and overwrite list of value docs with docs under current date
        if(maxDate == null || date.isAfter(maxDate)) {
          maxDate = date;
          valueDocs = [value];
        }
        //if in the same data set as the current max then add the value to the doc list
        else if(date.isSame(maxDate)) {
          valueDocs.push(value);
        }
      }
      else {
        console.error("Unrecognized value document format received.");
      }
    }

    return valueDocs;
  }

  
  private getRecentValuesRecursive(date: Day.Dayjs, step: TimeStep, max: number, i: number = 0): Promise<SiteValue[]> {
    return new Promise((resolve, reject) => {
      if(i >= max) {
        reject("Too many iterations.");
      }
      this.getRecentValuesMain(date, step).then((value) => {
        console.log(value);
        resolve(value);
      }, (min) => {
        return this.getRecentValuesRecursive(min, step, max, i + 1);
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
  [date: string]: SiteValue[]
}
