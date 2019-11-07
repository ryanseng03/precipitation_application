import { Injectable } from '@angular/core';
import { UtilityService } from "./utility.service";
import {LatLng, latLng} from "leaflet";
import {DataManagerService} from "./data-manager.service"
import { ColorScale, Color } from '../classes/color-scale';
import { GeoJSON, Feature } from "geojson";

@Injectable({
  providedIn: 'root'
})
export class DataRetreiverService {

  constructor(private util: UtilityService, private dataManager: DataManagerService) {}

  tileXYToFlat(x: number, y: number, tileSize: L.Point): number {
    return y * tileSize.x + x;
  }

  flattenGridCoords(coords: DecoupledCoords): number {
    return this.dataManager.getRasterData().nCols * coords.y + coords.x
  }
  

  decoupleGridIndex(index: number): DecoupledCoords {
    let data = this.dataManager.getRasterData();
    return {
      x: index % data.nCols,
      y: Math.floor(index / data.nCols)
    }
  }

  offsetPosByLL(pos: LatLng): LatLng {
    let data = this.dataManager.getRasterData();
    //console.log(pos);
    return new LatLng(pos.lat - data.yllCorner, pos.lng - data.xllCorner);
  }

  
  //need to ensure in grid range, 
  geoPosToGridCoords = (pos: LatLng): DecoupledCoords => {
    let data = this.dataManager.getRasterData();
    let offset = this.offsetPosByLL(pos);
    let coords = null;
    //values at boundaries, round down to nearest cellsize to get cell coord
    //round to prevent floating point errors
    let x = Math.round(this.util.roundToInterval(offset.lng, data.cellXSize, "down") / data.cellXSize);
    //check if in grid range, if not return null (otherwise will provide erroneous results when flattened)
    if(x >= 0 && x < data.nCols) {
      //round to prevent floating point errors
      let y = Math.round(data.nRows - this.util.roundToInterval(offset.lat, data.cellYSize, "down") / data.cellYSize);
      if(y >= 0 && y < data.nRows) {
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


  geoPosToGridIndex(pos: LatLng): number | null {
    let index = null;
    let coords = this.geoPosToGridCoords(pos);
    if(coords != null) {
      index = this.flattenGridCoords(coords);
    }             
    return index;
  }

  geoPosToGridValue(pos: LatLng): number {
    let data = this.dataManager.getRasterData();
    let index = this.geoPosToGridIndex(pos)
    return data.values[0][index];
  }

  geoPosToColor(pos: LatLng, colorScale: ColorScale): Color {
    return colorScale.getColor(this.geoPosToGridValue(pos));
  }

  
  getCellBoundsFromGeoPos(pos: LatLng): LatLng[] {
    let gridCell = this.geoPosToGridCoords(pos);
    //let cellLL = ;
    let data = this.dataManager.getRasterData();
    let xOff = data.cellXSize;
    let yOff = data.cellYSize;
    //long -> x, lat -> y
    //ensure counterclockwise order, start lower left
    //latlng is latitude first
    let ll = new LatLng(pos.lat - yOff, pos.lng - xOff);
    let lr = new LatLng(pos.lat - yOff, pos.lng + xOff);
    let ur = new LatLng(pos.lat + yOff, pos.lng + xOff);
    let ul = new LatLng(pos.lat + yOff, pos.lng - xOff);

    return [ll, lr, ur, ul];
  }
  
  //geojson uses long, lat
  //geojson counterclockwise
  getGeoJSONCellFromGeoPos(pos: LatLng): any {
    let bounds = this.getCellBoundsFromGeoPos(pos);
    let geojson = {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [[]]
      }
    }
    let i: number;
    for(i = 0; i < bounds.length; i++) {
      geojson.geometry.coordinates[0].push([bounds[i].lng, bounds[i].lat]);
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

  geoBBoxToGridBBox(bbox: BBox): GridBBox {
    let keys = Object.keys(bbox);
    let i: number;
    for(i = 0; i < keys.length; i++) {
      
    }
  }

  getInternalCellsFromGeoJSON() {

  }

  getInternalValuesFromGeoJSON() {

  }

  getInternalCellAreaFromGeoJSON() {

  }

  getAverageRainfallFromGeoJSON() {

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