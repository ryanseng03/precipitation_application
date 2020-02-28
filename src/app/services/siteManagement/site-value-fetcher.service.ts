import { Injectable } from '@angular/core';
import {MetadataStoreService, SKNRefMeta} from "./metadata-store.service";
import { DbConService } from "../db-con.service";
import * as moment from "moment";

const LIVE = false;

@Injectable({
  providedIn: 'root'
})
export class SiteValueFetcherService {

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
    
    let date = LIVE ? new Date().toISOString() : new Date("2019-09-18").toISOString();
    //cant do any sorting or just get nearest date, so just subtract the expected data time step from the live (or test) date and use the 

    console.log(moment().subtract(1, "months").toISOString());

    //let dateRange = [2017/01/01];
    //!!working!!
    //one of these (top one with dots) adds 10 hours, must be a weird time zone thing, make sure to standardize (change parser to use second time format, can use a string replace to replace dots with dashes)
    //Z indicates time zone always zero
    //ISO standard: YYYY-MM-DD:HH:MM:SS.SSSZ
    console.log(new Date("2019.09.18").toISOString());
    console.log(new Date("2019-09-18").toISOString());
    console.log(new Date().toISOString());
    let query = `{'$and':[{'name':'value_test'},{'value.date':{$lt:{'$date':'${new Date("1990-05-04").toISOString()}'},{'value.date':{$gt:{'$date':'${new Date("1990-05-04").toISOString()}'}}}]}`;
    //query = "{'name':'value_test'}";


    let resultHandler: (results: any) => any = (results: any) => {
      return results;
    }

    this.dbcon.query<SKNRefMeta>(query, resultHandler).then((vals) => {
      console.log(vals);
    });

  }
}
