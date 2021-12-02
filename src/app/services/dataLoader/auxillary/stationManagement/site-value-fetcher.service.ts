import { Injectable } from '@angular/core';
import { DbConService, RequestResults } from "../dbCon/db-con.service";
import { SiteValue } from '../../../../models/SiteMetadata';
import {DataProcessorService} from "../../../dataProcessor/data-processor.service";
import { RasterHeader, RasterData } from 'src/app/models/RasterData';

export { RequestResults };


@Injectable({
  providedIn: 'root'
})
export class SiteValueFetcherService {
  static readonly GEOTIFF_NODATA = -3.3999999521443642e+38;

  constructor(private dbcon: DbConService, private processor: DataProcessorService) {
    this.getDateRange(null);
  }

  getRasterHeader(properties: any, delay?: number): RequestResults {
    let query = this.propertiesToQuery("prew1", properties);
    let response = this.dbcon.queryMetadata(query, delay);
    let start = new Date().getTime();
    response.transform((response: any[]) => {
      let header: RasterHeader = null;
      //if query not cancelled extract header
      if(response != null) {
        header = response[0].value;
      }
      return header;
    });

    return response;
  }

  getDateRange(properties: any, delay?: number): RequestResults {
    let query = this.propertiesToQuery("hcdp_station_value_range", properties);
    let response = this.dbcon.queryMetadata(query, 0 , delay);
    let start = new Date().getTime();
    response.transform((response: any[]) => {
      let time = new Date().getTime() - start;
      let timeSec = time / 1000;
      console.log(`Retreived raster data for ${properties.date}, time elapsed ${timeSec} seconds`);


    });

    return response;
  }

  getRaster(properties: any, delay?: number): RequestResults {
    let response = this.dbcon.getRaster(properties, delay);
    let start = new Date().getTime();
    response.transform((data: ArrayBuffer) => {
      let time = new Date().getTime() - start;
      let timeSec = time / 1000;
      console.log(`Retreived raster data for ${properties.date}, time elapsed ${timeSec} seconds`);

      let handler = null;

      //if query wasn't cancelled handle array buffer
      if(data != null) {
        //transform array buffer to raster data
        return this.processor.getRasterDataFromGeoTIFFArrayBuffer(data, SiteValueFetcherService.GEOTIFF_NODATA)
        .then((rasterData: RasterData) => {
          return rasterData
        });
      }

      return handler;
    });

    return response;
  }

  getStationData(properties: any, delay?: number): RequestResults {
    let query = this.propertiesToQuery("hcdp_station_value", properties);

    let response = this.dbcon.queryMetadata(query, 0, delay);

    let start = new Date().getTime();
    //need to add in some error handling
    response.transform((response: any) => {

      let time = new Date().getTime() - start;
      let timeSec = time / 1000;
      console.log(`Retreived station data for ${properties.date}, time elapsed ${timeSec} seconds`);

      let vals: SiteValue[] = null

      //if query is not cancelled transform response
      if(response != null) {
        //extract value fields from result
        vals = response.result.map((metadata: any) => {
          return metadata.value;
        });
      }
      return vals;
    });

    return response;
  }

  getStationMetadata(properties: any, delay?: number): RequestResults {
    return null;
    // let query = this.propertiesToQuery("station_metadata", properties);

    // let response = this.dbcon.queryMetadata(query, delay);


    // //query = `{'name':'${dsconfig.metaDocName}'}`;
    // let resultHandler: (results: any) => SKNRefMeta = (results: any) => {
    //   let metadata: SKNRefMeta = {};
    //   results.forEach((result) => {
    //     //process data from database into internal metadata object
    //     let metadatum = processor.processMetadataDoc(result.value);
    //     //if returns null then the format was unexpected
    //     if(metadatum != null) {
    //       //index by skn
    //       metadata[metadatum.skn] = metadatum;
    //     }
    //     else {
    //       console.error("Unrecognized metadata document format received.");
    //     }
    //   });
    //   return metadata;
    // }

    // this.siteMeta = dbcon.queryMetadata(query).toPromise()
    // .then((response: any) => {
    //   let siteMeta: SKNRefMeta = resultHandler(response.result);
    //   //console.log(siteMeta);
    //   return siteMeta;
    // })
    // .catch((reason: RequestReject) => {
    //   if(reason.reason) {
    //     console.error(reason.reason);
    //   }
    //   return null;
    // });
  }

  //note properties should not have date
  getStationTimeSeries(start: string, end: string, properties: any, delay?: number): RequestResults {

    let query = this.propertiesToQuery("hcdp_station_value", properties);
    query = `{'$and':[${query},{'value.date':{'$gte':'${start}'}},{'value.date':{'$lt':'${end}'}}]}`;

    let response = this.dbcon.queryMetadata(query, delay);

    response.transform((response: any) => {
      let vals: SiteValue[] = null

      //if query is not cancelled transform response
      if(response != null) {
        //extract value fields from results
        vals = response.result.map((metadata: any) => {
          return metadata.value;
        });

        //need to separate stations
      }
      return vals;
    });

    return response;
  }

  private propertiesToQuery(name: string, properties: any): string {
    let query = `{'name':${name}`
    for(let property in properties) {
      let value = properties[property];
      query += `,'value.${property}':'${value}'`
    }
    query += "}";
    return query;
  }
}



