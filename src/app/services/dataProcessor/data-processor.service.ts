import { Injectable } from '@angular/core';
import { SiteMetadata, SiteValue } from "../../models/SiteMetadata";
import {RasterData, RasterHeader, BandData, IndexedValues, UpdateFlags, UpdateStatus} from "../../models/RasterData";
import {LatLng, latLng} from "leaflet";
import * as geotiff from "geotiff";

@Injectable({
  providedIn: 'root'
})
export class DataProcessorService {

  constructor() { }

  //need custom no data for now since geotiffs appear to have rounding error
  getRasterDataFromGeoTIFFArrayBuffer(data: ArrayBuffer, customNoData?, bands?): Promise<RasterData> {
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

  processMetadataDoc(doc: any): SiteMetadata {
    let meta: SiteMetadata = null;
    //validate properties not undefined
    let props = {
      skn: doc.skn,
      name: doc.name,
      observer: doc.observer,
      network: doc.network,
      island: doc.island,
      //elevation in meters
      elevation: doc.elevation_m,
      lat: doc.lat,
      lng: doc.lng,
      nceiID: doc.ncei_id,
      nwsID: doc.nws_id,
      scanID: doc.scan_id,
      smartNodeRfID: doc.smart_node_rf_id
    }
    if(this.verifyAssignedPropertiesNotUndefined(props)) {
      try {
        meta = new SiteMetadata(props, "NA");
      }
      catch(e) {
        console.error(e);
      }
    }

    return meta;
  }

  processValueDocs(doc: any): SiteValue {
    let value: SiteValue = null;
    //catch type error if doc.$date undefined
    try {
      //round value to 2 digits
      let props = {
        date: doc.date,
        type: doc.datatype,
        value: Math.round(doc.value * 100) / 100,
        skn: doc.skn
      }

      //validate properties not undefined
      if(this.verifyAssignedPropertiesNotUndefined(props)) {
        value = new SiteValue(props);
      }
    }
    catch(e) { console.error(e);}

    return value;
  }



  private verifyAssignedPropertiesNotUndefined(o: Object): boolean {
    let keys = Object.keys(o);
    let validate = true;
    for(let i = 0; i < keys.length; i++) {
      let key = keys[i];
      if(o[key] === undefined) {
        validate = false;
        break;
      }
    }

    return validate;
  }
}
