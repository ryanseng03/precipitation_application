import { Injectable } from '@angular/core';
import * as L from "leaflet";
import { RasterData } from "./geotiff-data-loader.service"

let R: any = L;

@Injectable({
  providedIn: 'root'
})
export class LeafletRasterLayerService {
  // private dataLayer

  // constructor() {
  //   this.dataLayer = L.GridLayer.extend({

  //     initialize: function(data: RasterData, options) {
  //       this.data = data;
  //       L.setOptions(this, options);
  //     },

  //     createTile: function(coords) {
  
  //       let coordString = JSON.stringify(coords);
  
  //       //console.log(coords);
        
        
  //       //console.log(getColor(700)._rgb[1]);
  
  //       //console.log(this);
  //       let tile: HTMLCanvasElement = <HTMLCanvasElement>L.DomUtil.create('canvas', 'leaflet-tile');
    
  //       if(!noValueCache.has(coordString)) {
        
  
  //         let ctx = tile.getContext("2d");
  //         let tileSize = this.getTileSize();
  //         //console.log(tileSize);
  //         tile.width = tileSize.x;
  //         tile.height = tileSize.y;
  //         //console.log(tile);
  //         let imgData = ctx.getImageData(0, 0, tileSize.x, tileSize.y);
  //         //console.log(imgData.data.length);
  //         // console.log(coords);
  //         // console.log(this._map);
          
  //         let tileXYToFlat = (x: number, y: number) => {
  //           return y * tileSize.x + x;
  //         }
          
        
  //         // let geoRange = {
  //         //   x: {
  //         //     min: geotiffData.xllCorner,
  //         //     max: geotiffData.y
  //         //   }
  //         // }
  
  //         let flattenGridCoords = (coords: DecoupledCoords): number => {
  //           return geotiffData.nCols * coords.y + coords.x
  //         }
  
  //         let roundToInterval = (value: number, interval: number, direction: "up" | "down" | "nearest" = "nearest"): number => {
  //           let sign = Math.sign(value);
  //           let abs = Math.abs(value);
  //           let roundingFunct: (value: number) => number;
  //           switch(direction) {
  //             case "down": {
  //               roundingFunct = Math.floor;
  //               break;
  //             }
  //             case "up": {
  //               roundingFunct = Math.ceil;
  //               break;
  //             }
  //             case "nearest": {
  //               roundingFunct = Math.round;
  //               break;
  //             }
  //           }
  //           return roundingFunct(abs / interval) * interval * sign;
  //         }
  
  //         let decoupleGridIndex = (index: number): DecoupledCoords => {
  //           return {
  //             x: index % geotiffData.nCols,
  //             y: Math.floor(index / geotiffData.nCols)
  //           }
  //         }
  
  //         let offsetPosByLL = (pos: L.LatLng): L.LatLng => {
  //           //console.log(pos);
  //           return new L.LatLng(pos.lat - geotiffData.yllCorner, pos.lng - geotiffData.xllCorner);
  //         }
  
  //         //console.log(geotiffData.yllCorner, geotiffData.xllCorner);
  
  //         //need to ensure in grid range, otherwise will provide erroneous results when flattened
  //         let geoPosToGridCoords = (pos: L.LatLng): DecoupledCoords => {
  //           let offset = offsetPosByLL(pos);
  //           let coords = null;
  //           //values at boundaries, round down to nearest cellsize to get cell coord
  //           //round to prevent floating point errors
  //           let x = Math.round(roundToInterval(offset.lng, geotiffData.cellXSize, "down") / geotiffData.cellXSize);
  //           //check if in grid range, if not return null
  //           if(x >= 0 && x < geotiffData.nCols) {
  //             //round to prevent floating point errors
  //             let y = Math.round(geotiffData.nRows - roundToInterval(offset.lat, geotiffData.cellYSize, "down") / geotiffData.cellYSize);
  //             if(y >= 0 && y < geotiffData.nRows) {
  //               coords = {
  //                 x: x,
  //                 y: y
  //               };
  //             }
  //           }
            
  //           return coords;
  //         }
  
  //         let geoPosToGridIndex = (pos: L.LatLng): number | null => {
  //           let index = null;
  //           let coords = geoPosToGridCoords(pos);
  //           if(coords != null) {
  //             index = flattenGridCoords(coords);
  //           }             
  //           return index;
  //         }
  
          
  
  
  //         //get the coordinates of the tile corner, tile coords times scale
  //         let xMin = coords.x * tileSize.x;
  //         let yMin = coords.y * tileSize.y;
  //         let xMax = xMin + tileSize.x;
  //         let yMax = yMin + tileSize.y;
  
  //         // let xOff: number;
  //         // let yOff: number;
  
  //         let x = xMin;
  //         let y = yMin;
  //         let colorOff = 0;
  //         //let yColorOff = 0;
  //         // let xGeo = geotiffData.xllCorner;
  //         // let yGeo = geotiffData.yllCorner;
  
  //         //let latlng = this._map.unproject([x, y], coords.z);
  //         //console.log(latlng);
  //         //let gridIndex = geoPosToGridIndex(latlng);
  //         //console.log(gridIndex);
  //         // if(gridIndex != null) {
  //         //   tile.innerHTML = [coords.x, coords.y, coords.z].join(', ');
  //         //   tile.style.outline = '1px solid red';
  //         // }
  
          
  //         //can these be decoupled and mapped? (get single lat and long for each point along tile and combine)
  //         //might not work properly due to curvature (straights might have changing "parallel" as map curves), though this is how it's done in covjson datalayer package
  //         //see if nested unprojects work sufficiently
  //         let hasValue = false;
  //         for(y = yMin; y < yMax; y++) {
  //           //x = xMin;
  //           //xGeo = geotiffData.xllCorner;
            
  //           for(x = xMin; x < xMax; x++) {
              
              
  //             let latlng = this._map.unproject([x, y], coords.z);
  //             //let tileIndex = tileXYToFlat(xOff, yOff);
  //             let gridIndex = geoPosToGridIndex(latlng);
  //             let color = colors[gridIndex];
  //             if(color != undefined) {
  //               hasValue = true;
  //               //console.log(color);
  //               imgData.data[colorOff] = color.r;
  //               imgData.data[colorOff + 1] = color.g;
  //               imgData.data[colorOff + 2] = color.b;
  //               imgData.data[colorOff + 3] = color.a;
  //             }
  //             //let color = getColor(700);
  
  //             //x++;
  //             //xGeo += geotiffData.cellXSize;
  //             colorOff += 4;
  //           }
  
  //           //yGeo += geotiffData.cellYSize;
            
  //         }
  
  //         if(!hasValue) {
  //           //console.log();
  //           noValueCache.add(coordString);
  //         }
  //         // console.log(xOff, yOff);
  //         // console.log(this._map.unproject([coords.x, coords.y], coords.z));
  //         ctx.putImageData(imgData, 0, 0);
  //       }
  //       return tile;
  //     }
  //   });
  // }

  // L.layer() {

  // }

  
  
  // R.gridLayer.debugCoords = function(opts) {
  //   return new R.GridLayer.DebugCoords(opts);
  // };
}
