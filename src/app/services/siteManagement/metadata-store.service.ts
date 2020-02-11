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
    let resultHandler: (result: any) => SKNRefMeta = (result: any) => {
      let metadata: SKNRefMeta = {};
      result.forEach((result) => {
          let metadatum: SiteMetadata = {
            name: result.value.name,
            location: new LatLng(result.value.latitude, result.value.longitude),
            network: result.value.network,
            value: null
          };
          metadata[result.value.skn] = metadatum;
        });
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
