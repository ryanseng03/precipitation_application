import { Injectable } from '@angular/core';
import { DbConService } from "../db-con.service";
import { SiteMetadata } from "../../models/SiteMetadata"
import { LatLng } from "leaflet";

@Injectable({
  providedIn: 'root'
})
export class MetadataStoreService {

  //using skn as site id
  private siteMeta: Promise<SKNRefMeta>;

  constructor(private dbcon: DbConService) {
    let query = "{'name':{'$in':['RainfallStation']}}";
    query = "{'name':'meta_test'}";
    let resultHandler: (results: any) => SKNRefMeta = (results: any) => {
      let metadata: SKNRefMeta = {};
      console.log(results);
      results.forEach((result) => {
        //temp check for test data
        if(result.value.skn != undefined) {
          let metadatum: SiteMetadata = {
            name: result.value.name,
            location: new LatLng(result.value.lat, result.value.lon),
            network: result.value.network,
            value: null
          };
          if(metadata[result.value.skn]) {
            console.log("dupe");
          }
          if(Number(result.value.lat) > 100) {
            console.log(result);
          }
          metadata[result.value.skn] = metadatum;
        }
          
      });
      console.log(Object.keys(metadata).length);
      return metadata;
    }

    this.siteMeta = dbcon.query<SKNRefMeta>(query, resultHandler);
  }

  getMetaBySKN(skn: string): Promise<SiteMetadata> {
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
  [skn: string]: SiteMetadata
}
