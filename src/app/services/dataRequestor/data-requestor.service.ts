import { Injectable } from '@angular/core';
import {SiteValueFetcherService, DateRefValues} from "./auxillary/siteManagement/site-value-fetcher.service";
import {MetadataStoreService} from "./auxillary/siteManagement/metadata-store.service";

//main service for data requestor, handles requests, gets and combines site metadata and values with site management services
//eventually also routes requests for remote raster data fetching
@Injectable({
  providedIn: 'root'
})
export class DataRequestorService {

  constructor(private siteRetreiver: SiteValueFetcherService, private metaRetreiver: MetadataStoreService) {

  }

  //need to be careful how you set up separation between site and raster data, need to keep date consistent
  //

  //need to change any to the full site obejct def type
  getInitSiteData(): Promise<any> {
    //might want to make the recursive method internal, add a wrapper and error fallback
    this.siteRetreiver.getRecentValues().then((values: DateRefValues) => {
      //get skns and retreive metadata
      //strip value docs from date tag and map to skn array (should only be one date)
      let skns = Object.values(values)[0].map((value) => {
        return value.skn;
      });
      this.metaRetreiver.getMetaBySKNs(skns).then((meta) => {
        //need to define the cross object then combine

      });
    }, () => {
      console.log("Failed to get recent values. Too many iterations.");
      //should have some sort of fallback? maybe define a fallback date with known data to use if recent pullback fails (last data available at application push)
    });
  }

  //getInitData()
  
}
