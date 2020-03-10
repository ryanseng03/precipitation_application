import { Injectable } from '@angular/core';
import { DbConService } from "../dbCon/db-con.service";
import { SiteMetadata } from "../../../../models/SiteMetadata";
import {DataProcessorService} from "../../../dataProcessor/data-processor.service"
import { LatLng } from "leaflet";
import dsconfig from "./DataSetConfig.json";

@Injectable({
  providedIn: 'root'
})
export class MetadataStoreService {

  //using skn as site id
  private siteMeta: Promise<SKNRefMeta>;

  constructor(private dbcon: DbConService) {
    let query = "{'name':{'$in':['RainfallStation']}}";
    query = `{'name':'${dsconfig.metaDocName}'}`;
    let resultHandler: (results: any) => SKNRefMeta = (results: any) => {
      let metadata: SKNRefMeta = {};
      console.log(results);
      results.forEach((result) => {
        //temp check for test data
        if(result.value.skn != undefined) {
          metadata[result.value.skn] = result.value;
        }
        else {
          console.error("Metadata object received with no skn tag.");
        }
      });
      return metadata;
    }

    this.siteMeta = dbcon.query<SKNRefMeta>(query, resultHandler);
  }

  getMetaBySKN(skn: string): Promise<RawSiteMeta> {
    return this.siteMeta.then((meta: SKNRefMeta) => {
      return meta[skn];
    });
  }

  getMetaBySKNs(skns: string[]): Promise<SKNRefMeta> {

    return this.siteMeta.then((meta: SKNRefMeta) => {
      let metadata: SKNRefMeta = {};
      if(skns == null) {
        metadata = meta;
      }
      else {
        skns.forEach((skn: string) => {
          metadata[skn] = meta[skn];
        });
      }
      return metadata;
    });
  }

  

}

export interface SKNRefMeta {
  [skn: string]: RawSiteMeta
}


//instead of this the raw data from the database should go through the data processor, all the data handler functions should come from the data processor

//allow arbitrary properties to allow for changes, this will be normalized in data processor
//enforce skn since this must be available to reference values
export interface RawSiteMeta {
  skn: string,
  [properties: string]: any
}


// new SiteMetadata({
//   skn: result.value.skn,
//   name: result.value.name,
//   location: new LatLng(result.value.lat, result.value.lon),
//   network: result.value.network
// }