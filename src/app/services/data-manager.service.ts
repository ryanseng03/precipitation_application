import { Injectable } from '@angular/core';
import { RasterData } from "./geotiff-data-loader.service"

@Injectable({
  providedIn: 'root'
})
export class DataManagerService {

  //use manager to mitigate issues with changing data structure
  data: DataModel;

  constructor() { }

  setRasterData(data: RasterData) {
    this.data.rasterData = data;
  }
  
  //should this have a lower granularity?
  getRasterData() {
    return this.data.rasterData;
  }
}

//update as needed
interface DataModel {
  rasterData: RasterData;
}
