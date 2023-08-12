import { Injectable } from '@angular/core';
import { DbConService, RequestResults } from "./auxillary/dbCon/db-con.service";
import { RasterData } from '../../models/RasterData';
import {DataProcessorService} from "../dataProcessor/data-processor.service";
import { StringMap } from 'src/app/models/types';

export { RequestResults };

//main service for data requestor, handles requests, gets and combines site metadata and values with site management services
//eventually also routes requests for remote raster data fetching
@Injectable({
  providedIn: 'root'
})
export class DataRequestorService {
  static readonly GEOTIFF_NODATA = -3.3999999521443642e+38;

  constructor(private dbcon: DbConService, private processor: DataProcessorService) {}

  getRasterHeader(properties: any, delay?: number): RequestResults {
    let query = this.propertiesToQuery("prew1", properties);
    let timingMessage = `Retreived raster header`;
    let response = this.basicQueryDispatch(query, delay, timingMessage);
    //extract first document
    response.transform((response: any[]) => {
      let header = null;
      if(response != null) {
        header = response[0];
      }
      return header;
    });
    return response;
  }

  getRaster(properties: StringMap, delay?: number): RequestResults {
    let start = new Date().getTime();
    let response = this.dbcon.getRaster(properties, delay);
    response.transform((data: ArrayBuffer) => {
      let time = new Date().getTime() - start;
      let timeSec = time / 1000;
      console.log(`Retreived raster data for ${properties.date || properties.period}, time elapsed ${timeSec} seconds`);

      let handler = null;
      //if query wasn't cancelled process array buffer to raster data
      if(data != null) {
        //transform array buffer to raster data
        return this.processor.getRasterDataFromGeoTIFFArrayBuffer(data, DataRequestorService.GEOTIFF_NODATA)
        .then((rasterData: RasterData) => {
          return rasterData;
        });
      }

      return handler;
    });

    return response;
  }

  getStationData(properties: StringMap, delay?: number): RequestResults {
    properties = Object.assign({}, properties);
    delete properties.dateRange;
    let query = this.propertiesToQuery("hcdp_station_value", properties);
    let timingMessage = `Retreived station data for ${properties.date}`;
    let response = this.basicQueryDispatch(query, delay, timingMessage);
    return response;
  }

  getStationMetadata(properties: StringMap, delay?: number): RequestResults {
    let query = this.propertiesToQuery("hcdp_station_metadata", properties);
    let timingMessage = `Retreived station metadata`;
    let response = this.basicQueryDispatch(query, delay, timingMessage);
    return response;
  }

  getStationTimeseries(start: string, end: string, properties: StringMap, delay?: number): RequestResults {
    let query = this.propertiesToQuery("hcdp_station_value", properties);
    query = `{'$and':[${query},{'value.date':{'$gte':'${start}'}},{'value.date':{'$lt':'${end}'}}]}`;
    //let timingMessage = `Retreived station ${properties.station_id} timeseries for ${start}-${end}`;
    let response = this.basicQueryDispatch(query, delay);
    return response;
  }

  // getVStationTimeseries(start: string, end: string, properties: StringMap, delay?: number): RequestResults {
  //   //row and column are the best thing to query on, use that
  // }

  private basicQueryDispatch(query: string, delay?: number, timingMessage?: string): RequestResults {
    let start = new Date().getTime();
    let response = this.dbcon.queryMetadata(query, delay);
    response.transform((response: any) => {
      //if provided with a timing message print timing
      if(timingMessage) {
        let time = new Date().getTime() - start;
        let timeSec = time / 1000;
        let message = `${timingMessage}, time elapsed ${timeSec} seconds`;
        console.log(message);
      }

      let vals: any[] = null;
      //if query is not cancelled extract value fields
      if(response != null) {
        //extract value fields from results
        vals = response.result.map((data: any) => {
          return data.value;
        });
      }
      return vals;
    });

    return response;
  }

  private propertiesToQuery(name: string, properties: StringMap): string {
    let query = `{'name':'${name}'`
    for(let property in properties) {
      let value = properties[property];
      query += `,'value.${property}':'${value}'`
    }
    query += "}";
    return query;
  }
}
