import { Injectable } from '@angular/core';
import { DbConService } from "../dbCon/db-con.service";
import Moment from "moment";
import "moment-timezone";
import dsconfig from "./DataSetConfig.json";
import { SiteValue } from '../../../../../models/SiteMetadata';
import {DataProcessorService} from "../../../../dataProcessor/data-processor.service";
import { BandData, RasterHeader, RasterData, IndexedValues } from 'src/app/models/RasterData';
import moment from 'moment';

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
  readonly date: Moment.Moment = LIVE ? Moment(null, null, "utc") : Moment("1990-05-10T00:00:00.000Z");


  constructor(private dbcon: DbConService, private processor: DataProcessorService) {

  }

  //MOVE THIS TO CONFIG FILE
  current = {
    name: "prew1",
    version: "v1.0",
  }

  getRasterHeader(): Promise<RasterHeader> {

    return new Promise((resolve, reject) => {
      let query = `{'$and':[{'name':'${this.current.name}'},{'value.version':'${this.current.version}'},{'value.type':'header'}]}`;


      let resultHandler: (results: any[]) => RasterHeader = (results: any[]) => {
        let res = results[0];
        let header: RasterHeader = {
          nCols: res.value.nCols,
          nRows: res.value.nRows,
          xllCorner: res.value.xllCorner,
          yllCorner: res.value.yllCorner,
          cellXSize: res.value.cellXSize,
          cellYSize: res.value.cellYSize,
        }
        return header;
      }

      this.dbcon.query<RasterHeader>(query, resultHandler).then((header: RasterHeader) => {
        console.log(header);
        resolve(header);
      });
    });
  }




  getRastersDate(date: Moment.Moment): Promise<BandData> {
    return new Promise((resolve, reject) => {
      //right now have month and year as fields, should change this to date?

      let year = date.year();
      let month = date.month();

      let query = `{'$and':[{'name':'${this.current.name}'},{'value.version':'${this.current.version}'},{'value.type':'raster'},{'value.year':${year}},{'value.month':${month}}]}`;

    //   `{'$and':
    //   [
    //     {'name':'${this.current.name}'},
    //     {'value.version':${this.current.version}},
    //     {'value.type':'raster'},{'value.year':${year}},
    //     {'value.month':${month}}
    // ]
    // }`

      let resultHandler: (results: any) => any = (results: any) => {
        return results;
      }

      this.dbcon.query<any[]>(query, resultHandler).then((vals: any[]) => {
        if(vals.length < 1) {
          resolve(null);
        }
        let res = vals[0];
        let data2map: IndexedValues = new Map<number, number>();
        for(let index in res.value.data) {
          let nIndex = Number(index);
          data2map.set(nIndex, res.value.data[index]);
        }
        let bands: BandData = {
          rainfall: data2map
        };
        resolve(bands);
      });
    });
  }


  getSiteTimeSeries(start: Moment.Moment, end: Moment.Moment, gpl: string): Promise<SiteValue[]> {
    return new Promise((resolve, reject) => {
      let startS = start.format("YYYY-MM-DD");
      let endS = end.format("YYYY-MM-DD");

      let query = `{'$and':[{'name':'station_vals'},{'value.date':{$gt:'${startS}'}},{'value.date':{$lt:'${endS}'}},{'value.gpl':${gpl}},{'value.version':'v1.2'}]}`;
      //query = `{'$and':[{'name':'${dsconfig.valueDocName}'}]}`;

      //wrap data handler to lexically bind to this
      let wrappedResultHandler = (recent: any[]) => {
        console.log(recent)
        let siteData = [];
        let dates = new Set();
        for(let item of recent) {
          dates.add(item.value.date);
          let siteValue: SiteValue = this.processor.processValueDocs(item.value);
          siteData.push(siteValue);
        }
        console.log(dates);
        console.log(siteData);

        return siteData;//this.extractLastValues(recent)
      }

      //need to add in some error handling
      this.dbcon.query<SiteValue[]>(query, wrappedResultHandler).then((vals: SiteValue[]) => {
        resolve(vals)
      });
    });
  }


  getSiteValsDate(date: Moment.Moment): Promise<SiteValue[]> {


    return new Promise((resolve, reject) => {
      // let year = date.year();
      // let month = date.month();

      //let dateRange = [2017/01/01];
      //!!working!!
      //one of these (top one with dots) adds 10 hours, must be a weird time zone thing, make sure to standardize (change parser to use second time format, can use a string replace to replace dots with dashes)
      //Z indicates time zone always zero
      //ISO standard: YYYY-MM-DDTHH:MM:SS.SSSZ

      //looks like only have data for december (-2018)
      //remember moments mutable so don't use date manipulations, make a new one then set date
      // date = Moment(date);
      // if(date.year() > 2018) {

      //   //set new moment year to 2018
      //   date.year(2018);
      // }
      // console.log(date.toISOString());
      // //use month as day in december to bypass issues
      // //+1 because 0 based index
      // let month = date.month() + 1;
      // console.log(date.toISOString());
      // //0 based indexing
      // date.month(11);
      // console.log(date.toISOString(), month);
      // date.date(month);
      // console.log(date.toISOString());
      //for now only daily, use simple format
      let dayFormat = date.format("YYYY-MM-DD");

      let query = `{'$and':[{'name':'station_vals'},{'value.date':{$eq:'${dayFormat}'}},{'value.version':'v1.2'}]}`;
      //query = `{'$and':[{'name':'${dsconfig.valueDocName}'}]}`;

      //wrap data handler to lexically bind to this
      let wrappedResultHandler = (recent: any[]) => {
        console.log(recent)
        let siteData = [];
        let dates = new Set();
        for(let item of recent) {
          dates.add(item.value.date);
          let siteValue: SiteValue = this.processor.processValueDocs(item.value);
          siteData.push(siteValue);
        }
        console.log(dates);
        console.log(siteData);

        return siteData;//this.extractLastValues(recent)
      }

      //need to add in some error handling
      this.dbcon.query<SiteValue[]>(query, wrappedResultHandler).then((vals: SiteValue[]) => {
        resolve(vals)
      });
    });
  }












  /////////////////////////////
  //////////////////////////
  //////////////////////









  getInitValues() {
    //just in case the initial data location is isolated or something and you still need the recent value function
    return this.getRecentValues();
  }

  //test date querying
  private getValuesTest() {
    //just use iso standard time format for everything and explicitly specify utc to ensure consistency
    console.log(Moment().tz("UTC").toISOString(), Moment("1990-05-10T00:00:00.000Z").toISOString());
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
  getValueRange(min: Moment.Moment, max: Moment.Moment): Promise<DateRefValues> {
    return new Promise<DateRefValues>((resolve, reject) => {
      let query = `{'$and':[{'name':'${dsconfig.valueDocName}'},{'value.date':{$gte:{'$date':'${min.toISOString()}'}}},{'value.date':{$lte:{'$date':'${max.toISOString()}'}}}]}`;

      //wrap data handler to lexically bind to this
      let wrappedResultHandler = (results: any[]) => {
        return this.sortByDate(results);
      }

      this.dbcon.query<DateRefValues>(query, wrappedResultHandler).then((vals) => {
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




  //for rainfall station data probably just use fake date transform for now and just use what's there (what is there???)


  //should sort out typing, etc
  private getRasterRange(min: Moment.Moment, max: Moment.Moment): Promise<any> {

    return new Promise((resolve, reject) => {
      let query = `{'$and':[{'name':'${this.current.name}'},{'value.version':${this.current.version}},{'value.type':'raster'},{'value.date':{$gte:{'$date':'${min.toISOString()}'}}},{'value.date':{$lte:{'$date':'${max.toISOString()}'}}}]}`;


      let resultHandler: (results: any) => any = (results: any) => {
        return results;
      }

      this.dbcon.query<any[]>(query, resultHandler).then((vals) => {
        resolve(vals);
      });
    });
  }

















  //resolves if recent value was found, otherwise rejects with lower bound date used
  private getRecentValuesMain(date: Moment.Moment, step: TimeStep): Promise<SiteValue[]> {
    return new Promise((resolve, reject) => {
      let lastDataMin = Moment(date).subtract(step.size, step.scale);

      let lastDataRange = [lastDataMin.toISOString(), date.toISOString()];

      //let dateRange = [2017/01/01];
      //!!working!!
      //one of these (top one with dots) adds 10 hours, must be a weird time zone thing, make sure to standardize (change parser to use second time format, can use a string replace to replace dots with dashes)
      //Z indicates time zone always zero
      //ISO standard: YYYY-MM-DDTHH:MM:SS.SSSZ

      let query = `{'$and':[{'name':'${dsconfig.valueDocName}'},{'value.date':{$gte:{'$date':'${lastDataRange[0]}'}}},{'value.date':{$lte:{'$date':'${lastDataRange[1]}'}}}]}`;

      //wrap data handler to lexically bind to this
      let wrappedResultHandler = (recent: any[]) => {
        return this.extractLastValues(recent)
      }

      //need to add in some error handling
      this.dbcon.query<SiteValue[]>(query, wrappedResultHandler).then((vals) => {
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
      let doc = recent[i];
      let value = this.processor.processValueDocs(doc.value);
      //if value is null then value doc from database is in an unexpected format
      if(value != null) {
        let date = Moment(value.date);
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


  private getRecentValuesRecursive(date: Moment.Moment, step: TimeStep, max: number, i: number = 0): Promise<SiteValue[]> {
    return new Promise((resolve, reject) => {
      if(i >= max) {
        reject("Too many iterations.");
      }
      else {
        this.getRecentValuesMain(date, step).then((value) => {
          //console.log(value);
          resolve(value);
        }, (min) => {
          return this.getRecentValuesRecursive(min, step, max, i + 1);
        });
      }
    });
  }

}

export interface TimeStep {
  size: Moment.DurationInputArg1,
  scale: Moment.unitOfTime.DurationConstructor
}

//remember that any date strings should always be iso standard at time 0
//ISO standard: YYYY-MM-DDTHH:MM:SS.SSSZ
export interface DateRefValues {
  [date: string]: SiteValue[]
}
