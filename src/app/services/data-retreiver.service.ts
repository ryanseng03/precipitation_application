import { Injectable } from '@angular/core';
import { UtilityService } from "./utility.service";
import {LatLng, latLng, bounds} from "leaflet";
import {DataManagerService} from "./data-manager.service"
import { ColorScale, Color } from '../classes/color-scale';
import { GeoJSON, Feature } from "geojson";
import {RasterHeader, IndexedValues} from "../models/RasterData";

@Injectable({
  providedIn: 'root'
})
export class DataRetreiverService {


  constructor(private util: UtilityService) {

  }

  tileXYToFlat(x: number, y: number, tileSize: L.Point): number {
    return y * tileSize.x + x;
  }

  flattenGridCoords(header: RasterHeader, coords: DecoupledCoords): number {
    return header.nCols * coords.y + coords.x
  }
  

  decoupleGridIndex(header: RasterHeader, index: number): DecoupledCoords {
    return {
      x: index % header.nCols,
      y: Math.floor(index / header.nCols)
    }
  }

  offsetPosByLL(header: RasterHeader, pos: LatLng): LatLng {
    return new LatLng(pos.lat - header.yllCorner, pos.lng - header.xllCorner);
  }

  
  //need to ensure in grid range, 
  geoPosToGridCoords(header: RasterHeader, pos: LatLng): DecoupledCoords {
    let offset = this.offsetPosByLL(header, pos);
    let coords = null;
    //values at boundaries, round down to nearest cellsize to get cell coord
    //round to prevent floating point errors
    let x = Math.round(this.util.roundToInterval(offset.lng, header.cellXSize, "down") / header.cellXSize);
    //check if in grid range, if not return null (otherwise will provide erroneous results when flattened)
    if(x >= 0 && x < header.nCols) {
      //round to prevent floating point errors
      let y = Math.round(header.nRows - this.util.roundToInterval(offset.lat, header.cellYSize, "down") / header.cellYSize);
      if(y >= 0 && y < header.nRows) {
        coords = {
          x: x,
          y: y
        };
      }
    }
    
    return coords;
  }

  // geoPosToCellLL(pos: LatLng): LatLng {
  //   if(pos.)
  // }


  geoPosToGridIndex(header: RasterHeader, pos: LatLng): number | null {
    let index = null;
    let coords = this.geoPosToGridCoords(header, pos);
    if(coords != null) {
      index = this.flattenGridCoords(header, coords);
    }             
    return index;
  }

  geoPosToGridValue(header: RasterHeader, data: IndexedValues, pos: LatLng): number {
    let index = this.geoPosToGridIndex(header, pos)
    return data.get(index);
  }

  geoPosToColor(header: RasterHeader, data: IndexedValues, pos: LatLng, colorScale: ColorScale): Color {
    return colorScale.getColor(this.geoPosToGridValue(header, data, pos));
  }

  //if !getNoValue just return null if the cell is background
  getCellBoundsFromGeoPos(header: RasterHeader, data: IndexedValues, pos: LatLng, getNoValue: boolean = false): LatLng[] {
    let bounds = null;
    //just start from here instead of using geoPosToGridValue to prevent need to recompute location
    let coords = this.geoPosToGridCoords(header, pos);
    //check if bounds in grid
    if(coords != null) {
      //check if value at location if !getNoValue
      let valid = true;
      if(!getNoValue) {
        let index = this.flattenGridCoords(header, coords);
        if(data.get(index) == undefined) {
          valid = false;
        }
      }
      if(valid) {
        let xll = header.xllCorner + header.cellXSize * coords.x;
        let yll = header.yllCorner + header.cellYSize * (header.nRows - coords.y);
        //counterclockwise
        let ll = new LatLng(yll, xll);
        let lr = new LatLng(yll, xll + header.cellXSize);
        let ur = new LatLng(yll + header.cellYSize, xll + header.cellXSize);
        let ul = new LatLng(yll + header.cellYSize, xll);
        bounds = [ll, lr, ur, ul];
      }
      
    }
    return bounds;
  }
  
  //if no value at cell or out of bounds returns null
  //geojson uses long, lat
  //geojson counterclockwise
  getGeoJSONCellFromGeoPos(header: RasterHeader, data: IndexedValues, pos: LatLng, getNoValue: boolean = false): any {
    let geojson = null;
    let bounds = this.getCellBoundsFromGeoPos(header, data, pos, getNoValue);

    if(bounds != null) {
      geojson = {
        type: "Feature",
        geometry: {
          type: "Polygon",
          coordinates: [[]]
        }
      };
      let i: number;
      for(i = 0; i < bounds.length; i++) {
        geojson.geometry.coordinates[0].push([bounds[i].lng, bounds[i].lat]);
      }
      geojson.geometry.coordinates[0].push([bounds[0].lng, bounds[0].lat]);
    }

    return geojson;
  }

  getGeoJSONBBox(geojson: Feature) {
    console.log(geojson.geometry);
    //get outer ring(s) and perform basic coordinate depth validation
    //if multiple polygons/features, get bounding box of all shapes and subshapes
    //evaluate if in outer bounding box, if is evaluate if in any inner bounding boxes, parse indices in inner bounding boxes that intersected
    
  }

  getBBoxFromCoordinates(coords: number[][]) {

  }

  // geoBBoxToGridBBox(bbox: BBox): GridBBox {
  //   let keys = Object.keys(bbox);
  //   let i: number;
  //   for(i = 0; i < keys.length; i++) {

  //   }
  // }

  getInternalCellsFromGeoJSON() {

  }

  getInternalValuesFromGeoJSON() {

  }

  getInternalCellAreaFromGeoJSON() {

  }

  getAverageRainfallFromGeoJSON() {

  }

  //do we want this?
  getVolumetricRainfallFromGeoJSON() {

  }


}

export interface BBox {
  ll: LatLng,
  lr: LatLng,
  ur: LatLng,
  ul: LatLng
}

export interface GridBBox {
  ll: DecoupledCoords,
  lr: DecoupledCoords,
  ur: DecoupledCoords,
  ul: DecoupledCoords
}

export interface DecoupledCoords {
  x: number,
  y: number
}