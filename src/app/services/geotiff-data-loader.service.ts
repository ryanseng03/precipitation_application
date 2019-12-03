import { Injectable } from '@angular/core';
import * as geotiff from "geotiff";
import { HttpClient } from '@angular/common/http';
import {RasterData, RasterHeader, BandData, IndexedValues, UpdateFlags, UpdateStatus} from "../models/RasterData";

@Injectable({
  providedIn: 'root'
})
export class GeotiffDataLoaderService {

  constructor(private http: HttpClient) { }

  getDataFromGeotiff(url: string, customNoData?, bands?): Promise<RasterData> {
    return this.http.get(url, {
      responseType: "arraybuffer"
    }).toPromise().then((data: ArrayBuffer) => {
      return this.getDataFromArrayBuffer(data, customNoData, bands);
    });
  }

  //need custom no data for now since geotiffs appear to have rounding error
  getDataFromArrayBuffer(data: ArrayBuffer, customNoData?, bands?): Promise<RasterData> {
    return geotiff.fromArrayBuffer(data).then((tiff: geotiff.GeoTIFF) => {
      //console.log(tiff);
      return tiff.getImage().then((image: geotiff.GeoTIFFImage) => {
        //console.log(image);
        //are tiepoints indexed by cooresponding band?
        //assume just at index 0 like example for now, maybe ask matt
        let tiepoint = image.getTiePoints()[0];
        //console.log(image.getTiePoints());
        let fileDirectory = image.getFileDirectory();
        //console.log(rasters, tiepoint, fileDirectory);
        return image.readRasters().then((rasters: any) => {
          //console.log(rasters);

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
          console.log(header);
          let geotiffData: RasterData = new RasterData(header);

          //package data
          let i: number;
          //console.log(bands);
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
              if(value != noData && value != customNoData) {
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


