import { Injectable } from '@angular/core';
import {RasterData} from "../../../../models/RasterData";
import {DataProcessorService} from "../../../dataProcessor/data-processor.service"
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { EventParamRegistrarService } from 'src/app/services/inputManager/event-param-registrar.service';


@Injectable({
  providedIn: 'root'
})
export class GeotiffDataLoaderService {

  constructor(private http: HttpClient, private processor: DataProcessorService, private paramService: EventParamRegistrarService) {
  }

  getDataFromGeotiff(url: string, customNoData?: number, bands?: string[]): Promise<RasterData> {
    return this.http.get(url, {
      responseType: "arraybuffer"
    }).toPromise().then((data: ArrayBuffer) => {
      //send data buffer to data processor to convert to raster data
      return this.processor.getRasterDataFromGeoTIFFArrayBuffer(data, customNoData, bands);
    });
  }

  getDataFromExternalGeotiff(url: string, customNoData?: number, bands?: string[]): Promise<RasterData> {
    return this.http.get(url, {
      responseType: "arraybuffer"
    }).toPromise().then((data: ArrayBuffer) => {
      //send data buffer to data processor to convert to raster data
      return this.processor.getRasterDataFromGeoTIFFArrayBuffer(data, customNoData, bands);
    });
  }


}




