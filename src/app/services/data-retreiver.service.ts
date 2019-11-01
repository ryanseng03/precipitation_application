import { Injectable } from '@angular/core';
import { UtilityService } from "./utility.service";
import {LatLng} from "leaflet";
import {DataManagerService} from "./data-manager.service"
import { ColorScale, Color } from '../classes/color-scale';

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

  //console.log(geotiffData.yllCorner, geotiffData.xllCorner);

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
}

export interface DecoupledCoords {
  x: number,
  y: number
}