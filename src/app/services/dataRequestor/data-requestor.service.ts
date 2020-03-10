import { Injectable } from '@angular/core';
import {SiteValueFetcherService, DateRefValues} from "./auxillary/siteManagement/site-value-fetcher.service";
import {MetadataStoreService, SKNRefMeta} from "./auxillary/siteManagement/metadata-store.service";
import { SiteValue, SiteMetadata, SiteInfo } from '../../models/SiteMetadata';
import Day from "dayjs";
import { RasterData } from '../../models/RasterData';

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

  //just return values, wait to combine with metadata references until needed to avoid excess storage
  getInitSiteVals(): Promise<DateRefValues> {
    return this.siteRetreiver.getRecentValues();
  }

  getSiteVals(start: string, end: string) {
    return this.siteRetreiver.getValueRange(Day(start), Day(end));
  }

  getInitRaster(): Promise<RasterData> {
    throw new Error("Unimplemented");
  }

  //all non-init raster data is just passed as a number array, maybe wrap this in a special class to make more obvious
  getRasters(start: string, end: string): Promise<number[]> {
    throw new Error("Unimplemented");
  }

  //use this to combine value docs and metadata docs
  combineWithMeta(values: SiteValue[]): Promise<SiteInfo[]> {
    let resPromises: Promise<SiteInfo>[] = [];
    for(let i = 0; i < values.length; i++) {
      let value: SiteValue = values[i];
      let skn: string = value.skn;
      resPromises.push(this.metaRetreiver.getMetaBySKN(skn).then((metadata: SiteMetadata) => {
        return new SiteInfo(metadata, value);
      }));
    }
    return Promise.all(resPromises);
  }

  //getInitData()
  
}
