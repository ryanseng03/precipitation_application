import { Injectable } from '@angular/core';
import {RasterData, RasterHeader, IndexedValues, UpdateFlags} from "../../models/RasterData";

import * as geotiff from "geotiff";

@Injectable({
  providedIn: 'root'
})
export class DataProcessorService {

  constructor() { }

  //need custom no data for now since geotiffs appear to have rounding error
  getRasterDataFromGeoTIFFArrayBuffer(data: ArrayBuffer, customNoData?: number, bands?: string[]): Promise<RasterData> {
    const worker = new Worker("../../workers/geotiff.worker", { type: "module" });
    worker.onmessage = ({ data }) => {
      console.log(`page got message: ${data}`);
    };
    worker.postMessage("test");
    return geotiff.fromArrayBuffer(data).then((tiff: geotiff.GeoTIFF) => {
      return tiff.getImage().then((image: geotiff.GeoTIFFImage) => {
        //are tiepoints indexed by cooresponding band?
        //assume just at index 0 like example for now, maybe ask matt
        let tiepoint = image.getTiePoints()[0];
        let fileDirectory = image.getFileDirectory();
        return image.readRasters().then((rasters: any) => {
          //get scales from file directory
          let [xScale, yScale] = fileDirectory.ModelPixelScale;

          //if unspecified or empty assume all bands
          if(bands == undefined || bands.length == 0) {
            bands = Array.from(rasters.keys());
          }

          let noData = Number.parseFloat(fileDirectory.GDAL_NODATA);

          let header: RasterHeader = {
            nCols: image.getWidth(),
            nRows: image.getHeight(),
            xllCorner: tiepoint.x,
            yllCorner: tiepoint.y - image.getHeight() * yScale,
            cellXSize: xScale,
            cellYSize: yScale,
          }

          let geotiffData: RasterData = new RasterData(header);
          //package data
          let i: number;
          for(i = 0; i < bands.length; i++) {
            let band = bands[i];
            let raster = rasters[band];
            if(raster == undefined) {
              throw new Error("Could not find band: " + band);
            }
            let values: IndexedValues = new Map<number, number>();

            let j: number;
            for(j = 0; j < raster.length; j++) {
              let value = raster[j];
              //the nodata values are all kinds of messed up, these need to be fixed
              if(value != noData && value != customNoData && !isNaN(value)) {
                values.set(j, value);
              }
            }

            let rasterStat = geotiffData.addBand(band, values);
            if(rasterStat.code != UpdateFlags.OK) {
              throw new Error("Error adding band to raster: " + band);
            }

          }
          return geotiffData;
        });
      });

    });
  }
}
