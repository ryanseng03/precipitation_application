/// <reference lib="webworker" />

import * as geotiff from "geotiff";

addEventListener("message", async ({ data }) => {
  let { buffer, customNoData, bands, id } = data;
  try {
    let tiff: geotiff.GeoTIFF = await geotiff.fromArrayBuffer(buffer);
    let image: geotiff.GeoTIFFImage = await tiff.getImage();
    //are tiepoints indexed by cooresponding band?
    //assume just at index 0 like example for now, maybe ask matt
    let tiepoint = image.getTiePoints()[0];
    let fileDirectory = image.getFileDirectory();
    let rasters = await image.readRasters();
    //get scales from file directory
    let [xScale, yScale] = fileDirectory.ModelPixelScale;
  
    //if unspecified or empty assume all bands
    if(bands == undefined || bands.length == 0) {
      bands = Array.from(rasters.keys());
    }
  
    let noData = Number.parseFloat(fileDirectory.GDAL_NODATA);
  
    let header = {
      nCols: image.getWidth(),
      nRows: image.getHeight(),
      xllCorner: tiepoint.x,
      yllCorner: tiepoint.y - image.getHeight() * yScale,
      cellXSize: xScale,
      cellYSize: yScale,
    }
    let bandData = {};
    //package data
    let i: number;
    for(i = 0; i < bands.length; i++) {
      let band = bands[i];
      let raster = rasters[band];
      if(raster == undefined) {
        throw new Error("Could not find band: " + band);
      }
      let values = [];
      let j: number;
      for(j = 0; j < raster.length; j++) {
        let value = raster[j];
        //the nodata values are all kinds of messed up, these need to be fixed
        if(value != noData && value != customNoData && !isNaN(value)) {
          let valuePair = [j, value];
          values.push(valuePair);
        }
      }
      bandData[i] = values;
    }
    postMessage({
      id,
      header,
      bandData
    });
  }
  catch(e) {
    console.error(`Error processing geotiff: ${e}`);
    postMessage({
      id,
      header: null,
      bandData: null
    });
  }
});
