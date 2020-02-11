import { Injectable } from '@angular/core';
import {MetadataStoreService, SKNRefMeta} from "./metadata-store.service";

@Injectable({
  providedIn: 'root'
})
export class SiteValueFetcherService {

  constructor(private siteMeta: MetadataStoreService) { }

  getValues(start: string, end?: string) {
    //query
    let skns = new Set();
    //insert skns from query results to skns set
    let sknArr = Array.from(skns);
    let meta = this.siteMeta.getMetaBySKNs(sknArr);
    //where are these stored, how are they handled?
    //probably have this just retreive them then have the storage etc handled elsewhere
  }
}
