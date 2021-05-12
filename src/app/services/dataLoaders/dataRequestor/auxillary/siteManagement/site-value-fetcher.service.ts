import { Injectable } from '@angular/core';
import { DbConService, RequestResults, RequestReject } from "../dbCon/db-con.service";
import Moment from "moment";
import "moment-timezone";
import dsconfig from "./DataSetConfig.json";
import { SiteValue } from '../../../../../models/SiteMetadata';
import {DataProcessorService} from "../../../../dataProcessor/data-processor.service";
import { BandData, RasterHeader, RasterData, IndexedValues } from 'src/app/models/RasterData';
import moment from 'moment';
//import { DataPack } from 'src/app/services/dataManager/data-manager.service';

export {RequestResults} from "../dbCon/db-con.service";

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

  getRasterHeader(): RequestResults {

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

    let response = this.dbcon.query(query);

    response.transform((response: any) => {
      //query cancelled, propogate null
      if(response == null) {
        return null;
      }
      //console.log(response)
      let header: RasterHeader = resultHandler(response.result)
      //console.log(header);
      return header;
    }, (reason: RequestReject) => {
      if(reason.reason) {
        console.error(reason.reason);
      }
    });

    return response;
  }


  getDataPackByDate(date: Moment.Moment): RequestResults {
    let rasterRequest = this.getRastersDate(date);
    let stationRequest = this.getSiteValsDate(date);
    rasterRequest.combine(stationRequest);
    rasterRequest.transform((data: [BandData, SiteValue[]]) => {
      console.log(data);
      let dataPack = {
        bands: data[0],
        stations: data[1]
      };
      return dataPack;
    }, (reason: RequestReject) => {
      if(reason.reason) {
        console.error(reason.reason);
      }
    });

    return rasterRequest;
  }


  getRastersDate(date: Moment.Moment): RequestResults {

    //TEMPORARY VALUES TO BE USED UNTIL MORE STABLE DATASET PRODUCED
    let tempKey = {
      "header_id": "hawaii_statewide_250m",
      "classification": "rainfall",
      "subclassification": "new",
      "units": "mm",
      "period": "month"
    };
    let doc_name = "hcdp_raster";
    let version = "0.1";
    let dateStr = date.format("YYYY-MM");
    let query = `{'$and':[{'name':'${doc_name}'},{'value.date':'${dateStr}'},{'value.version':'${version}'}`;
    
    for(let value in tempKey) {
      query += `,{'value.key.${value}':'${tempKey[value]}'}`
    }
    query += `]}`;

    //right now have month and year as fields, should change this to date?

    // let year = date.year();
    // let month = date.month();

    //let query = `{'$and':[{'name':'${this.current.name}'},{'value.version':'${this.current.version}'},{'value.type':'raster'},{'value.year':${year}},{'value.month':${month}}]}`;

    //   `{'$and':
    //   [
    //     {'name':'${this.current.name}'},
    //     {'value.version':${this.current.version}},
    //     {'value.type':'raster'},{'value.year':${year}},
    //     {'value.month':${month}}
    // ]
    // }`

    let response = this.dbcon.query(query);

    response.transform((response: any) => {
      //query cancelled, propogate null
      if(response == null) {
        return null;
      }
      let vals: any = response.result;

      //should get exactly one result, if got multiples just use first and log error
      if(vals.length > 1) {
        console.error(`Got multiple raster results for date ${date.format("DD-MM-YYYY")}`);
      }

      let data2map: IndexedValues = new Map<number, number>();
      //if no results then just return empty mapping
      if(vals.length >= 1) {
        let res = vals[0];
        for(let index in res.value.data) {
          let nIndex = Number(index);
          data2map.set(nIndex, res.value.data[index]);
        }
      }
      else {
        console.error(`Could not get raster data for date ${date.format("DD-MM-YYYY")}!`);
      }
      let bands: BandData = {
        rainfall: data2map
      };
      return bands;
    }, (reason: RequestReject) => {
      if(reason.reason) {
        console.error(reason.reason);
      }
    });

    return response;

  }


  getSiteTimeSeries(start: Moment.Moment, end: Moment.Moment, skn: string): RequestResults {
    
    let startS = start.format("YYYY-MM-DD");
    let endS = end.format("YYYY-MM-DD");

    let query = `{'$and':[{'name':'station_vals'},{'value.date':{$gt:'${startS}'}},{'value.date':{$lt:'${endS}'}},{'value.skn':'${skn}'},{'value.version':'v1.2'}]}`;
    //query = `{'$and':[{'name':'${dsconfig.valueDocName}'}]}`;
    query = `{'$and':[{'name':'hcdp_station_value'},{'value.version':'2.0'},{'value.key.fill':'partial'},{'value.descriptor.station_id':'${skn}'},{'value.key.datatype':'rainfall'},{'value.key.period':'day'}]}`;
    //console.log(query);

    //wrap data handler to lexically bind to this
    let wrappedResultHandler = (recent: any[]) => {
      let siteData: SiteValue[] = [];
      let dates = new Set();
      for(let item of recent) {

        //TEMP TRANSFORM
        item.value = {
          date: item.value.date,
          datatype: item.value.key.datatype,
          value: parseFloat(item.value.data),
          skn: item.value.descriptor.station_id
        };
        ////////////////

        dates.add(item.value.date);
        let siteValue: SiteValue = this.processor.processValueDocs(item.value);
        //console.log(siteValue);
        siteData.push(siteValue);
      }
      //sort by date
      siteData.sort((a: SiteValue, b: SiteValue) => {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });

      return siteData;//this.extractLastValues(recent)
    }


    let response = this.dbcon.query(query);

    //need to add in some error handling
    response.transform((response: any) => {
      //query cancelled, propogate null
      if(response == null) {
        return null;
      }
      let vals: SiteValue[] = wrappedResultHandler(response.result);
      return vals;
    }, (reason: RequestReject) => {
      if(reason.reason) {
        console.error(reason.reason);
      }
    });

    return response
  }

  //for now everything by month, note that format will change if doing daily
  getSiteValsDate(date: Moment.Moment): RequestResults {

    let formattedDate = date.format("YYYY-MM");

    let query = `{'$and':[{'name':'station_vals_month'},{'value.date':{$eq:'${formattedDate}'}},{'value.version':'v1.1'}]}`;
    query = `{'$and':[{'name':'hcdp_station_value'},{'value.date':'${formattedDate}'},{'value.version':'2.0'},{'value.key.fill':'partial'},{'value.key.datatype':'rainfall'},{'value.key.period':'month'}]}`;
    //console.log(query);
    //"{'name': 'hcdp_station_value', 'value.version': '2.0', 'value.key.fill': 'partial'}"

    //wrap data handler to lexically bind to this
    let wrappedResultHandler = (vals: any[]) => {
      //console.log(vals);
      // console.log(recent)
      let siteData = [];
      let dates = new Set();
      for(let item of vals) {
        dates.add(item.value.date);

        //TEMP TRANSFORM
        item.value = {
          date: item.value.date,
          datatype: item.value.key.datatype,
          value: parseFloat(item.value.data),
          skn: item.value.descriptor.station_id
        };
        ////////////////

        let siteValue: SiteValue = this.processor.processValueDocs(item.value);
        siteData.push(siteValue);
      }
      // console.log(dates);
      // console.log(siteData);

      return siteData;//this.extractLastValues(recent)
    }

    let response = this.dbcon.query(query);

    //need to add in some error handling
    response.transform((response: any) => {
 
      //query cancelled, propogate null
      if(response == null) {
        return null;
      }
      let vals: SiteValue[] = wrappedResultHandler(response.result);
      return vals;

    }, (reason: RequestReject) => {
      if(reason.reason) {
        console.error(reason.reason);
      }
    });

    return response;
  }





  //get values on range [min, max]
  getValueRange(min: Moment.Moment, max: Moment.Moment): RequestResults {

    let query = `{'$and':[{'name':'${dsconfig.valueDocName}'},{'value.date':{$gte:{'$date':'${min.toISOString()}'}}},{'value.date':{$lte:{'$date':'${max.toISOString()}'}}}]}`;

    //wrap data handler to lexically bind to this
    let wrappedResultHandler = (results: any[]) => {
      return this.sortByDate(results);
    }

    let response = this.dbcon.query(query);

    response.transform((response: any) => {
      //query cancelled, propogate null
      if(response == null) {
        return null;
      }
      let vals: DateRefValues = wrappedResultHandler(response.result);
      //console.log(vals);
      return vals;
    }, (reason: RequestReject) => {
      if(reason.reason) {
        console.error(reason.reason);
      }
    });

    return response;
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


interface DataPack {
  bands: BandData,
  //might change to something a bit more robust
  sites: SiteValue[],
}