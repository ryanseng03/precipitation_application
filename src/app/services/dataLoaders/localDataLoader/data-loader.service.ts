import { Injectable } from '@angular/core';
import {RasterData, RasterHeader, BandData, UpdateFlags, UpdateStatus} from "../../../models/RasterData";
import {GeotiffDataLoaderService} from "./auxillary/geotiff-data-loader.service";

@Injectable({
  providedIn: 'root'
})
export class DataLoaderService {

  constructor(private geotiffLoader: GeotiffDataLoaderService) { }

  public getInitRaster(): Promise<RasterData> {
    return this.getInitRasterDataFromFiles();
  }


  private getInitRasterDataFromFiles(): Promise<RasterData> {
    let promises = [
      this.geotiffLoader.getDataFromGeotiff("/assets/test_data/test_a.tif", -3.3999999521443642e+38),
      this.geotiffLoader.getDataFromGeotiff("/assets/test_data/test_b.tif", -3.3999999521443642e+38),
      this.geotiffLoader.getDataFromGeotiff("/assets/test_data/test_c.tif", -3.3999999521443642e+38),
      this.geotiffLoader.getDataFromGeotiff("/assets/test_data/test_d.tif", -3.3999999521443642e+38)
    ];
    return Promise.all(promises).then((geotiffData: RasterData[]) => {
      let dataMain = geotiffData[0];
      if(dataMain.renameBand("0", "rainfall").code != UpdateFlags.OK) {
        console.error("Could not rename band");
      }

      let getRenameFunct = (index: number): (name: string) => string => {
        return (name: string) => {
          //all the band names should start as "0"
          if(name != "0") {
            console.error("Unexpected band name from geoTIFF.");
          }
          let bandName: string = null;
          switch(index) {
            case 1: {
              bandName = "anomaly";
              break;
            }
            case 2: {
              bandName = "se_rainfall";
              break;
            }
            case 3: {
              bandName = "se_anomaly";
              break;
            }
            default: {
              console.error("Bad index, too many rasters.");
            }
          }
          console.log(bandName);
          return bandName;
        }
      }

      for(let i = 1; i < geotiffData.length; i++) {
        if(dataMain.combine(geotiffData[i], getRenameFunct(i)).code != UpdateFlags.OK) {
          console.error("Error combining data rasters");
        }
      }
      return dataMain;
    });
  }
}