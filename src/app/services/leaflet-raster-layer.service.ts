import { Injectable } from '@angular/core';
import * as L from "leaflet";
import { RasterData } from "./geotiff-data-loader.service"
import { DataRetreiverService, DecoupledCoords } from "./data-retreiver.service";
import { ColorScale } from '../classes/color-scale';

export let R: any = L;

@Injectable({
  providedIn: 'root'
})
export class LeafletRasterLayerService {
  //if rendered tiles should be limited to a relatively small set, no reason to add overhead on tiles that contain no data
  private emptyTileCache: Set<string> = new Set<string>();

  constructor(private dataRetreiver: DataRetreiverService) {
    let __this = this;

    //add options, no value cache bool (can store cache here), coloring, geotiffdata

    R.GridLayer.RasterLayer = L.GridLayer.extend({
      initialize: function(options: RasterOptions) {
        if(options.cacheEmpty == undefined) {
          options.cacheEmpty = false;
        }
        L.Util.setOptions(this, options);
      },

      clearEmptyTileCache: () => {
        this.emptyTileCache.clear();
      },

      createTile: function(coords) {

        let coordString = JSON.stringify(coords);

        let tile: HTMLCanvasElement = <HTMLCanvasElement>L.DomUtil.create('canvas', 'leaflet-tile');
    
        if(!this.options.cacheEmpty || !__this.emptyTileCache.has(coordString)) {
        

          let ctx = tile.getContext("2d");
          let tileSize = this.getTileSize();
          //console.log(tileSize);
          tile.width = tileSize.x;
          tile.height = tileSize.y;
          //console.log(tile);
          let imgData = ctx.getImageData(0, 0, tileSize.x, tileSize.y);
         


          //get the coordinates of the tile corner, tile coords times scale
          let xMin = coords.x * tileSize.x;
          let yMin = coords.y * tileSize.y;
          let xMax = xMin + tileSize.x;
          let yMax = yMin + tileSize.y;

          let x = xMin;
          let y = yMin;
          let colorOff = 0;

          
          //can these be decoupled and mapped? (get single lat and long for each point along tile and combine)
          //might not work properly due to curvature (straights might have changing "parallel" as map curves), though this is how it's done in covjson datalayer package
          //see if nested unprojects work sufficiently
          let hasValue = false;
          for(y = yMin; y < yMax; y++) {
            
            for(x = xMin; x < xMax; x++) { 
              
              let latlng = this._map.unproject([x, y], coords.z);
              let color = __this.dataRetreiver.geoPosToColor(latlng, this.options.colorScale)
              if(color != undefined) {
                hasValue = true;
                imgData.data[colorOff] = color.r;
                imgData.data[colorOff + 1] = color.g;
                imgData.data[colorOff + 2] = color.b;
                imgData.data[colorOff + 3] = color.a;
              }
              colorOff += 4;
            }
            
          }

          //if caching empty tiles and tile had no values in it, add to empty tile cache
          if(this.options.cacheEmpty && !hasValue) {
            __this.emptyTileCache.add(coordString);
          }
          ctx.putImageData(imgData, 0, 0);
        }
        return tile;
      }
    });
    
    R.gridLayer.RasterLayer = function(options: RasterOptions) {
      return new R.GridLayer.RasterLayer(options);
    };

    

    console.log(R);
  }
}

export interface RasterOptions {
  cacheEmpty?: boolean;
  colorScale: ColorScale;
}
