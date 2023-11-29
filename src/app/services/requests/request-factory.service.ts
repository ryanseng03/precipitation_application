import { Injectable } from '@angular/core';
import { RequestService, RequestResults } from "./request.service";
import { RasterData } from '../../models/RasterData';
import { DataProcessorService } from "../dataProcessor/data-processor.service";
import moment from 'moment';
import { MapLocation } from 'src/app/models/Stations';
import { TimeseriesGraphData } from 'src/app/components/rainfall-graph/rainfall-graph.component';
import { TimeseriesData, UnitOfTime } from '../dataset-form-manager.service';

@Injectable({
  providedIn: 'root'
})
export class RequestFactoryService {
  //decouple for easy testing of API changes
  static readonly API_KEYS = {
    hcdp: "cistore_test",
    tapis: "hcdp_api"
  };

  static readonly GEOTIFF_NODATA = -3.3999999521443642e+38;

  constructor(private reqService: RequestService, private processor: DataProcessorService) {}

  private printTiming(message: string, start: number) {
    let time = new Date().getTime() - start;
    let timeSec = time / 1000;
    console.log(`${message}, time elapsed ${timeSec} seconds`);
  }

  //////////////
  //// hcdp ////
  //////////////

  async getRaster(params: any, printTiming: boolean = true, delay?: number): Promise<RequestResults> {
    let response = await this.reqService.get(RequestFactoryService.API_KEYS.hcdp, "raster", "arraybuffer", params, undefined, undefined, delay);
    let start = new Date().getTime();
    response.transformData((data: ArrayBuffer) => {
      if(printTiming) {
        this.printTiming(`Retreived raster data for ${params.date || params.period}`, start);
      }
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

  async submitEmailPackageReq(body: any, printTiming: boolean = true, delay?: number): Promise<RequestResults> {
    let response = await this.reqService.post(RequestFactoryService.API_KEYS.hcdp, "email", "text", body, undefined, undefined, delay);
    let start = new Date().getTime();
    response.transformData(() => {
      if(printTiming) {
        this.printTiming(`Got request confirmation`, start);
      }
    });
    return response;
  }

  async submitInstantDownloadReq(body: any, printTiming: boolean = true, delay?: number): Promise<RequestResults> {
    let response = await this.reqService.post(RequestFactoryService.API_KEYS.hcdp, "splitlink", "json", body, undefined, undefined, delay);
    let start = new Date().getTime();
    response.transformData((response: any) => {
      if(printTiming) {
        this.printTiming(`Got generated file names`, start);
      }
      return response.files;
    });
    return response;  
  }

  async getVStationTimeseries(start: string, end: string, timeseriesData: TimeseriesData, location: MapLocation, properties: any, printTiming: boolean = true, delay?: number): Promise<RequestResults> {
    let params = {
      ...properties,
      start,
      end
    };
    let response = await this.reqService.get(RequestFactoryService.API_KEYS.hcdp, "raster_timeseries", "json", params, undefined, undefined, delay);
    let startTime = new Date().getTime();
    response.transformData((data: {[date: string]: number}) => {
      if(printTiming) {
        this.printTiming(`Retreived virtual station timeseries for ${start}-${end}`, startTime);
      }
      let transformed = null;
      //what to put in stationId and period? Test with null, will this work? Probably need period
      let entries = Object.entries(data);
      if(entries.length > 0) {
        transformed = {
          location,
          timeseriesData,
          values: entries.map((pair: [string, number]) => {
            return {
              value: pair[1],
              date: moment(pair[0])
            };
          })
        };
      }
      return transformed;
    });
    return response;
  }

  ///////////////
  //// tapis ////
  ///////////////

  async getRasterHeader(properties: any, printTiming: boolean = true, delay?: number): Promise<RequestResults> {
    let query = this.propertiesToQuery("prew1", properties);
    let timingMessage = printTiming ? `Retreived raster header`: undefined;
    let response = await this.tapisQueryDispatch(query, timingMessage, delay);
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

  async getStationData(properties: any, printTiming: boolean = true, delay?: number): Promise<RequestResults> {
    properties = Object.assign({}, properties);
    delete properties.dateRange;
    let query = this.propertiesToQuery("hcdp_station_value", properties);
    let timingMessage = printTiming ? `Retreived station data for ${properties.date}`: undefined;
    let response = await this.tapisQueryDispatch(query, timingMessage, delay);
    return response;
  }

  async getStationMetadata(properties: any, printTiming: boolean = true, delay?: number): Promise<RequestResults> {
    let query = this.propertiesToQuery("hcdp_station_metadata", properties);
    let timingMessage = printTiming ? `Retreived station metadata`: undefined;
    let response = await this.tapisQueryDispatch(query, timingMessage, delay);
    return response;
  }

  async getStationTimeseries(start: string, end: string, timeseriesData: TimeseriesData, location: MapLocation, properties: any, printTiming: boolean = true, delay?: number): Promise<RequestResults> {
    let query = this.propertiesToQuery("hcdp_station_value", properties);
    query = `{'$and':[${query},{'value.date':{'$gte':'${start}'}},{'value.date':{'$lt':'${end}'}}]}`;
    let timingMessage = printTiming ? `Retreived station ${properties.station_id} timeseries for ${start}-${end}`: undefined;
    let response = await this.tapisQueryDispatch(query, timingMessage, delay);
    response.transformData((data: any[]) => {
      if(data.length > 0) {
        let transformed: TimeseriesGraphData = {
          location,
          timeseriesData,
          values: data.map((item: any) => {
            return {
              value: item.value,
              date: moment(item.date)
            }
          })
        }
        return transformed;
      }
      else {
        return null;
      }
    });
    return response;
  }

  private async tapisQueryDispatch(query: string, timingMessage?: string, delay?: number): Promise<RequestResults> {
    let params = {
      q: query,
      limit: 10000,
      offset: 0
    };
    let response = await this.reqService.get(RequestFactoryService.API_KEYS.tapis, "metadata", "json", params, undefined, undefined, delay);
    let start = new Date().getTime();
    response.transformData((response: any) => {
      //if provided with a timing message print timing
      if(timingMessage) {
        this.printTiming(timingMessage, start);
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
