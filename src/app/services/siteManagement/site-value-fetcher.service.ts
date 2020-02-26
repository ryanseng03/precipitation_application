import { Injectable } from '@angular/core';
import {MetadataStoreService, SKNRefMeta} from "./metadata-store.service";
import { DbConService } from "../db-con.service";

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
    //let dateRange = [2017/01/01];
//{$gt:2017-01-01T00:00:00.196-06:00}
    //!!working!!
    //time zones are dumb, apparently the time changes between 10 and 0 depending on what date string format is used, standardize this (should just explicitly convert everything to ISO standard to avoid confusion)
    //ISO standard: YYYY-MM-DD:HH:MM:SS:T.TTTZ
    console.log(new Date("2019.09.18").toISOString());
    console.log(new Date("2019-09-18").toISOString());
    let query = `{'$and':[{'name':'value_test'},{'value.date':{$gt:{'$date':'${new Date("1990-05-04").toISOString()}'}}}]}`;
    //query = "{'name':'value_test'}";


    let resultHandler: (results: any) => any = (results: any) => {
      return results;
    }

    this.dbcon.query<SKNRefMeta>(query, resultHandler).then((vals) => {
      console.log(vals);
    });

  }
}
