import { Injectable } from '@angular/core';
import { SiteValueFetcherService, RequestResults } from "./auxillary/siteManagement/site-value-fetcher.service";
import { MetadataStoreService, SKNRefMeta}  from "./auxillary/siteManagement/metadata-store.service";
import { SiteMetadata } from '../../../models/SiteMetadata';
import Moment from "moment";
import { RasterData, IndexedValues } from '../../../models/RasterData';
export { RequestResults };

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

  getRasterHeader(): RequestResults {
    return this.siteRetreiver.getRasterHeader();
  }

  getSiteValsDate(date: Moment.Moment): RequestResults {
    return this.siteRetreiver.getSiteValsDate(date);
  }

  getSiteTimeSeries(start: Moment.Moment, end: Moment.Moment, focus: Moment.Moment, skn: string): {[group: string]: RequestResults} {
    return this.siteRetreiver.getSiteTimeSeries(start, end, focus, skn);
  }

  getRastersDate(date: Moment.Moment): RequestResults {
    return this.siteRetreiver.getRastersDate(date);
  }

  getDataPack(date: Moment.Moment, delay?: number) {
    return this.siteRetreiver.getDataPackByDate(date, delay);
  }

  // //just return values, wait to combine with metadata references until needed to avoid excess storage
  // getInitSiteVals(): Promise<SiteValue[]> {
  //   return this.siteRetreiver.getInitValues();
  // }

  getSiteVals(start: string, end: string): RequestResults {
    return this.siteRetreiver.getValueRange(Moment(start), Moment(end));
  }

  getInitRasters(): Promise<RasterData> {
    throw new Error("Unimplemented");
  }

  //all non-init raster data is just passed as a set of indexed values
  getRasters(start: string, end: string): Promise<IndexedValues> {
    throw new Error("Unimplemented");
  }


  //wrappers, everything should go through this service rather than aux services directly
  getMetaBySKN(skn: string): Promise<SiteMetadata> {
    return this.metaRetreiver.getMetaBySKN(skn);
  }

  getMetaBySKNs(skns: string[]): Promise<SKNRefMeta> {
    return this.metaRetreiver.getMetaBySKNs(skns);
  }



  //getInitData()

}
