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
        L.Util.setOptions(this, options);
      },

      createTile: function(coords) {

        let coordString = JSON.stringify(coords);

        //console.log(coords);
        
        
        //console.log(getColor(700)._rgb[1]);

        //console.log(this);
        let tile: HTMLCanvasElement = <HTMLCanvasElement>L.DomUtil.create('canvas', 'leaflet-tile');
    
        if(!this.options.cacheEmpty || !__this.emptyTileCache.has(coordString)) {
        

          let ctx = tile.getContext("2d");
          let tileSize = this.getTileSize();
          //console.log(tileSize);
          tile.width = tileSize.x;
          tile.height = tileSize.y;
          //console.log(tile);
          let imgData = ctx.getImageData(0, 0, tileSize.x, tileSize.y);
          //console.log(imgData.data.length);
          // console.log(coords);
          // console.log(this._map);
          
          let tileXYToFlat = (x: number, y: number) => {
            return y * tileSize.x + x;
          }
          
        
          // let geoRange = {
          //   x: {
          //     min: geotiffData.xllCorner,
          //     max: geotiffData.y
          //   }
          // }

         


          //get the coordinates of the tile corner, tile coords times scale
          let xMin = coords.x * tileSize.x;
          let yMin = coords.y * tileSize.y;
          let xMax = xMin + tileSize.x;
          let yMax = yMin + tileSize.y;

          // let xOff: number;
          // let yOff: number;

          let x = xMin;
          let y = yMin;
          let colorOff = 0;
          //let yColorOff = 0;
          // let xGeo = geotiffData.xllCorner;
          // let yGeo = geotiffData.yllCorner;

          //let latlng = this._map.unproject([x, y], coords.z);
          //console.log(latlng);
          //let gridIndex = geoPosToGridIndex(latlng);
          //console.log(gridIndex);
          // if(gridIndex != null) {
          //   tile.innerHTML = [coords.x, coords.y, coords.z].join(', ');
          //   tile.style.outline = '1px solid red';
          // }

          
          //can these be decoupled and mapped? (get single lat and long for each point along tile and combine)
          //might not work properly due to curvature (straights might have changing "parallel" as map curves), though this is how it's done in covjson datalayer package
          //see if nested unprojects work sufficiently
          let hasValue = false;
          for(y = yMin; y < yMax; y++) {
            //x = xMin;
            //xGeo = geotiffData.xllCorner;
            
            for(x = xMin; x < xMax; x++) {
              
              
              let latlng = this._map.unproject([x, y], coords.z);
              //let tileIndex = tileXYToFlat(xOff, yOff);
              // let gridIndex = geoPosToGridIndex(latlng);
              // let value = geotiffData.values[0][gridIndex];
              let color = __this.dataRetreiver.geoPosToColor(this.options.colorScale, latlng)
              //let color = colorScale.getColor(value);
              if(color != undefined) {
                hasValue = true;
                //console.log(color);
                imgData.data[colorOff] = color.r;
                imgData.data[colorOff + 1] = color.g;
                imgData.data[colorOff + 2] = color.b;
                imgData.data[colorOff + 3] = color.a;
              }
              //let color = getColor(700);

              //x++;
              //xGeo += geotiffData.cellXSize;
              colorOff += 4;
            }

            //yGeo += geotiffData.cellYSize;
            
          }

          if(!hasValue) {
            //console.log();
            noValueCache.add(coordString);
          }
          // console.log(xOff, yOff);
          // console.log(this._map.unproject([coords.x, coords.y], coords.z));
          ctx.putImageData(imgData, 0, 0);
        }
        return tile;
      }
    });
    
    R.gridLayer.RasterLayer = function(options: RasterOptions) {
      return new R.GridLayer.RasterLayer(options);
    };

    R.gridLayer.RasterLayer.clearNoDataCache = () => {
      this.noValueCache.clear();
    }
  }

  getExtende
}

export interface RasterOptions {
  cacheEmpty: boolean = false;
  colorScale: ColorScale;
}
