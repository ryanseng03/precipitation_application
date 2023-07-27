import { Injectable } from '@angular/core';
import { RequestService, RequestResults } from "./request.service";
import { RasterData } from '../../models/RasterData';
import { DataProcessorService } from "../dataProcessor/data-processor.service";

@Injectable({
  providedIn: 'root'
})
export class RequestFactoryService {
  //decouple for easy testing of API changes
  static readonly API_KEYS = {
    hcdp: "hcdp_api",
    tapis: "hcdp_api"
  };

  static readonly GEOTIFF_NODATA = -3.3999999521443642e+38;

  constructor(private reqService: RequestService, private processor: DataProcessorService) {}

  //////////////
  //// hcdp ////
  //////////////

  async getRaster(params: any, delay?: number): Promise<RequestResults> {
    let start = new Date().getTime();
    let response = await this.reqService.get(RequestFactoryService.API_KEYS.hcdp, "raster", "arraybuffer", params, undefined, undefined, delay);
    let time = new Date().getTime() - start;
    response.transformData((data: ArrayBuffer) => {
      let timeSec = time / 1000;
      console.log(`Retreived raster data for ${params.date || params.period}, time elapsed ${timeSec} seconds`);

      let handler = null;
      //if query wasn't cancelled process array buffer to raster data
      if(data != null) {
        //transform array buffer to raster data
        return this.processor.getRasterDataFromGeoTIFFArrayBuffer(data, RequestFactoryService.GEOTIFF_NODATA)
        .then((rasterData: RasterData) => {
          return rasterData
        });
      }

      return handler;
    });

    return response;
  }

  async submitEmailPackageReq(body: any, delay?: number): Promise<RequestResults> {
    let response = await this.reqService.post(RequestFactoryService.API_KEYS.hcdp, "email", "text", body, undefined, undefined, delay);
    let start = new Date().getTime();
    response.transformData(() => {
      let time = new Date().getTime() - start;
      let timeSec = time / 1000;
      console.log(`Got request confirmation, time elapsed ${timeSec} seconds`);
    });
    return response;
  }

  async submitInstantDownloadReq(body: any, delay?: number): Promise<RequestResults> {
    let response = await this.reqService.post(RequestFactoryService.API_KEYS.hcdp, "splitlink", "json", body, undefined, undefined, delay);
    let start = new Date().getTime();
    response.transformData((response: any) => {
      let time = new Date().getTime() - start;
      let timeSec = time / 1000;
      console.log(`Got generated file names, time elapsed ${timeSec} seconds`);
      return response.files;
    });
    return response;  
  }

  ///////////////
  //// tapis ////
  ///////////////

  async getRasterHeader(properties: any, delay?: number): Promise<RequestResults> {
    let query = this.propertiesToQuery("prew1", properties);
    let timingMessage = `Retreived raster header`;
    let response = await this.tapisQueryDispatch(query, delay, timingMessage);
    //extract first document
    response.transformData((response: any[]) => {
      let header = null;
      if(response != null) {
        header = response[0];
      }
      return header;
    });
    return response;
  }

  async getStationData(properties: any, delay?: number): Promise<RequestResults> {
    properties = Object.assign({}, properties);
    delete properties.dateRange;
    let query = this.propertiesToQuery("hcdp_station_value", properties);
    let timingMessage = `Retreived station data for ${properties.date}`;
    let response = await this.tapisQueryDispatch(query, delay, timingMessage);
    return response;
  }

  async getStationMetadata(properties: any, delay?: number): Promise<RequestResults> {
    let query = this.propertiesToQuery("hcdp_station_metadata", properties);
    let timingMessage = `Retreived station metadata`;
    let response = await this.tapisQueryDispatch(query, delay, timingMessage);
    return response;
  }

  async getStationTimeSeries(start: string, end: string, properties: any, delay?: number): Promise<RequestResults> {
    let query = this.propertiesToQuery("hcdp_station_value", properties);
    query = `{'$and':[${query},{'value.date':{'$gte':'${start}'}},{'value.date':{'$lt':'${end}'}}]}`;
    //let timingMessage = `Retreived station ${properties.station_id} timeseries for ${start}-${end}`;
    let response = await this.tapisQueryDispatch(query, delay);
    return response;
  }

  private async tapisQueryDispatch(query: string, delay?: number, timingMessage?: string): Promise<RequestResults> {
    let params = {
      q: query,
      limit: 10000,
      offset: 0
    };
    let response = await this.reqService.get(RequestFactoryService.API_KEYS.tapis, "metadata", "json", params, undefined, undefined, delay);
    let start = new Date().getTime();
    //let response = this.reqService.queryMetadata(query, delay);
    response.transformData((response: any) => {
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
        vals = response.result.map((metadata: any) => {
          return metadata.value;
        });
      }
      return vals;
    });

    return response;
  }

  private propertiesToQuery(name: string, properties: any): string {
    let query = `{'name':'${name}'`
    for(let property in properties) {
      let value = properties[property];
      query += `,'value.${property}':'${value}'`
    }
    query += "}";
    return query;
  }
}
