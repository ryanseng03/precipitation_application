import { Injectable } from '@angular/core';

import { HttpClient } from '@angular/common/http';
import {RasterData, RasterHeader, BandData, IndexedValues, UpdateFlags, UpdateStatus} from "../../../models/RasterData";
import {DataProcessorService} from "../../dataProcessor/data-processor.service"

@Injectable({
  providedIn: 'root'
})
export class GeotiffDataLoaderService {

  constructor(private http: HttpClient, private processor: DataProcessorService) { }

  getDataFromGeotiff(url: string, customNoData?, bands?): Promise<RasterData> {
    return this.http.get(url, {
      responseType: "arraybuffer"
    }).toPromise().then((data: ArrayBuffer) => {
      //send data buffer to data processor to convert to raster data
      return this.processor.getRasterDataFromGeoTIFFArrayBuffer(data, customNoData, bands);
    });
  }
}


