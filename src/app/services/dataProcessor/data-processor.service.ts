import { Injectable } from '@angular/core';
import {RasterData, IndexedValues, UpdateFlags} from "../../models/RasterData";

@Injectable({
  providedIn: 'root'
})
export class DataProcessorService {
  static worker = new Worker("../../workers/geotiff.worker", { type: "module" });

  private resolver: (value: RasterData | PromiseLike<RasterData>) => void;
  private workerId: number;
  private lastReceivedId: number;
  private message: {
    id: number,
    buffer: ArrayBuffer,
    customNoData?: number,
    bands?: string[]
  };

  constructor() {
    this.resolver = null;
    this.workerId = 0;
    this.lastReceivedId = 0;
    DataProcessorService.worker.onmessage = ({ data }) => {
      let { header, bandData, id } = data;
      this.lastReceivedId = id;
      //if this is the data for the last request submitted then process and resolve
      if(this.workerId == id) {
        let geotiffData: RasterData = new RasterData(header);
        for(let band in bandData) {
          let values: IndexedValues = new Map<number, number>(bandData[band]);
          let rasterStat = geotiffData.addBand(band, values);
          if(rasterStat.code != UpdateFlags.OK) {
            throw new Error("Error adding band to raster: " + band);
          }
        }
        this.resolver(geotiffData);
        this.resolver = null;
      }
      //otherwise submit latest request data to worker
      else {
        DataProcessorService.worker.postMessage(this.message);
      }
    };
  }

  //need custom no data for now since geotiffs appear to have rounding error
  getRasterDataFromGeoTIFFArrayBuffer(data: ArrayBuffer, customNoData?: number, bands?: string[]): Promise<RasterData> {
    return new Promise((resolve) => {
      if(this.resolver) {
        this.resolver(null);
      }
      this.resolver = resolve;
      let workerId = this.workerId + 1;
      this.message = {
        id: workerId,
        buffer: data,
        customNoData,
        bands
      };
      //if the last worker dispatched is the last request then immeddiately post message, otherwise push after current outbound worker returns to prevent a backup of messages
      if(this.workerId == this.lastReceivedId) {
        DataProcessorService.worker.postMessage(this.message);
      }
      this.workerId = workerId;
    });
  }
}
