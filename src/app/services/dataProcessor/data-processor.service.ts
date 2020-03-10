import { Injectable } from '@angular/core';
import { SiteMetadata, SiteValue } from "../../models/SiteMetadata";
import {LatLng, latLng} from "leaflet";

@Injectable({
  providedIn: 'root'
})
export class DataProcessorService {

  constructor() { }

  processMetadataDoc(doc: any): SiteMetadata {
    let meta: SiteMetadata = null;
    //validate properties not undefined
    let props = {
      skn: doc.skn,
      name: doc.name,
      lat: doc.lat,
      lng: doc.lon,
      network: doc.network
    }
    if(this.verifyAssignedPropertiesNotUndefined(props)) {
      meta = new SiteMetadata(props);
    }
    
    return meta;
  }

  processValueDocs(doc: any): SiteValue {
    let value: SiteValue = null;
    //catch type error if doc.$date undefined
    try {
      let props = {
        date: doc.$date.date,
        type: doc.type,
        value: doc.value,
        skn: doc.skn
      }
      //validate properties not undefined
      if(this.verifyAssignedPropertiesNotUndefined(props)) {
        value = new SiteValue(props);
      }
    }
    catch(e) { }
    
    return value;
  }

  private verifyAssignedPropertiesNotUndefined(o: Object): boolean {
    let keys = Object.keys(o);
    let validate = true;
    for(let i = 0; i < keys.length; i++) {
      let key = keys[i];
      if(o[key] === undefined) {
        validate = false;
        break;
      }
    }

    return validate;
  }
}
