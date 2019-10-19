import { Component, OnInit } from '@angular/core';
import * as L from "leaflet";
import  "../../../../node_modules/leaflet-canvaslayer-field/dist/leaflet.canvaslayer.field.js";
import {ParameterStoreService, ParameterHook} from "../../services/parameter-store.service";
import * as chroma from "chroma-js";
import { HttpClient } from '@angular/common/http';
import {saveAs} from "file-saver";
import * as geotiff from "geotiff";


let R: any = L;



@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss']
})
export class MapComponent implements OnInit {
  
  //private R: any = L;

  private options: L.MapOptions
  private drawnItems: L.FeatureGroup;
  private drawOptions: any;
  private map: L.Map;
  private baseLayers: any;

  constructor(private http: HttpClient, private paramService: ParameterStoreService) {
    console.log(navigator.hardwareConcurrency || 4);
    this.baseLayers = {
      Satellite: L.tileLayer("http://www.google.com/maps/vt?lyrs=y@189&gl=en&x={x}&y={y}&z={z}", {
        maxZoom: 20,
        minZoom: 6
      }),
      Street: L.tileLayer('https://www.google.com/maps/vt?lyrs=m@221097413,traffic&x={x}&y={y}&z={z}', {
        maxZoom: 20,
        minZoom: 6
      })
    };

    this.options = {
      layers: [this.baseLayers.Satellite],
      zoom: 6,
      center: L.latLng(20.5, -157.917480),
      attributionControl: false
    };

    this.drawnItems = new L.FeatureGroup;

    this.drawOptions = {
      position: 'topleft',
      draw: {
         polyline: false,
         circle: false,
         marker: false,
         circlemarker: false
      },
      edit: {
        featureGroup: this.drawnItems
      }
    };

    
  }



  onMapReady(map: L.Map) {
    this.map = map;
    this.drawnItems.addTo(map);

    

    

    // let filterNodata = (value: number) => {
    //   return value != -3.3999999521443642e+38;
    // };

    // let colorScale = chroma.scale(['red','yellow','green','blue','purple','indigo']).domain([0, 750]);
    // //let colorScale = chroma.scale(['white', 'black']).domain([0, 750]);
    // let freeze = false;
    // let testColorCache: any = {};
    // let colorFunct = (value: number) => {
      
    //   // if(!freeze) {
    //   //   console.log(Object.keys(testColorCache).length);
    //   //   freeze = true;
    //   //   setTimeout(() => {
    //   //     freeze = false;
    //   //   }, 10);
    //   // }
      
    //   // let color = testColorCache[value];
    //   // if(color == undefined) {
        
    //   //   color = colorScale(value).toString();
    //   //   testColorCache[value] = color;
    //   // }

    //   return colorScale(value).toString();
    // }

    //!!
    //arrow functions lexically bind this (bind to original context)
    //have to use "function()" syntax if new context

 
    

    this.http.get("/assets/test.tif", {
      responseType: "arraybuffer"
    }).toPromise().then((data: any) => {
      this.getDataFromGeotiff(data, -3.3999999521443642e+38).then((geotiffData: GeoTIFFData) => {
        console.log(geotiffData);
        let colorScale = chroma.scale(['red','yellow','green','blue','purple','indigo']).domain([0, 750]);
        
        let getColor = (value) => {
          let color = colorScale(value);
          return {
            r: color._rgb[0],
            g: color._rgb[1],
            b: color._rgb[2],
            a: color._rgb[3] * 255
          };
        }

        let timer = Date.now();
        let colors = this.getGeotiffColors(geotiffData, getColor);
        console.log(`Color retrieval took ${Date.now() - timer}ms`);

        //rendered tiles should be limited so should remain relatively small, no reason to add overhead on tiles that contain no data
        let noValueCache: Set<string> = new Set<string>();

        R.GridLayer.DebugCoords = L.GridLayer.extend({
          createTile: function(coords) {

            let coordString = JSON.stringify(coords);

            //console.log(coords);
            
            
            //console.log(getColor(700)._rgb[1]);
    
            //console.log(this);
            let tile: HTMLCanvasElement = <HTMLCanvasElement>L.DomUtil.create('canvas', 'leaflet-tile');
        
            if(!noValueCache.has(coordString)) {
            

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

              let flattenGridCoords = (coords: DecoupledCoords): number => {
                return geotiffData.nCols * coords.y + coords.x
              }

              let roundToInterval = (value: number, interval: number, direction: "up" | "down" | "nearest" = "nearest"): number => {
                let sign = Math.sign(value);
                let abs = Math.abs(value);
                let roundingFunct: (value: number) => number;
                switch(direction) {
                  case "down": {
                    roundingFunct = Math.floor;
                    break;
                  }
                  case "up": {
                    roundingFunct = Math.ceil;
                    break;
                  }
                  case "nearest": {
                    roundingFunct = Math.round;
                    break;
                  }
                }
                return roundingFunct(abs / interval) * interval * sign;
              }

              let decoupleGridIndex = (index: number): DecoupledCoords => {
                return {
                  x: index % geotiffData.nCols,
                  y: Math.floor(index / geotiffData.nCols)
                }
              }

              let offsetPosByLL = (pos: L.LatLng): L.LatLng => {
                //console.log(pos);
                return new L.LatLng(pos.lat - geotiffData.yllCorner, pos.lng - geotiffData.xllCorner);
              }

              //console.log(geotiffData.yllCorner, geotiffData.xllCorner);

              //need to ensure in grid range, otherwise will provide erroneous results when flattened
              let geoPosToGridCoords = (pos: L.LatLng): DecoupledCoords => {
                let offset = offsetPosByLL(pos);
                let coords = null;
                //values at boundaries, round down to nearest cellsize to get cell coord
                //round to prevent floating point errors
                let x = Math.round(roundToInterval(offset.lng, geotiffData.cellXSize, "down") / geotiffData.cellXSize);
                //check if in grid range, if not return null
                if(x >= 0 && x < geotiffData.nCols) {
                  //round to prevent floating point errors
                  let y = Math.round(geotiffData.nRows - roundToInterval(offset.lat, geotiffData.cellYSize, "down") / geotiffData.cellYSize);
                  if(y >= 0 && y < geotiffData.nRows) {
                    coords = {
                      x: x,
                      y: y
                    };
                  }
                }
                
                return coords;
              }

              let geoPosToGridIndex = (pos: L.LatLng): number | null => {
                let index = null;
                let coords = geoPosToGridCoords(pos);
                if(coords != null) {
                  index = flattenGridCoords(coords);
                }             
                return index;
              }

              


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
                  let gridIndex = geoPosToGridIndex(latlng);
                  let color = colors[gridIndex];
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
        
        R.gridLayer.debugCoords = function(opts) {
          return new R.GridLayer.DebugCoords(opts);
        };
        
        map.addLayer( R.gridLayer.debugCoords() );
      });
    });

    
      
    //     console.log(data);
    //     let s = R.ScalarField.fromGeoTIFF(data);
    //     let mlayer = R.canvasLayer.scalarField(s, {
    //       inFilter: filterNodata,
    //       //interpolation does not run a check on filterNodata
    //       //when drawing on the canvas (L.CanvasLayer.ScalarField.js) _prepareImageIn runs either interpolatedValueAt or valueAt in Field.js
    //       //interpolatedValueAt does not check filterNodata, could modify but uses minified source, look into this later
    //       interpolate: false,
    //       color: colorFunct
    //     }).addTo(map);
    //     map.fitBounds(mlayer.getBounds());

    //     L.control.layers(this.baseLayers, {Raster: mlayer}).addTo(map);



// console.log(mlayer.onDrawLayer);
// setTimeout(() => {
//   mlayer.onDrawLayer = null;
// }, 1000);

        //console.log(s.grid);

        // setTimeout(() => {
        //   let i: number;
        //   let j: number;
        //   for(i = 0; i < s.grid.length; i++) {
        //     for(j = 0; j < s.grid[i].length; j++) {
        //       s.grid[i][j] = -3.3999999521443642e+38;
        //     }
        //   }
        //   console.log(s);
        //   console.log(mlayer);
        //   console.log(mlayer._canvas.getContext('2d'));


        //   // const blob = new Blob([data], { type: 'image/tiff' });
          
        //   // saveAs(blob, "test.tif");
          
        //   // const url= window.URL.createObjectURL(blob);
        //   // window.open(url);

        // }, 1000);
      
    // });
   
  }

  getGeotiffColors(geotiffData: GeoTIFFData, colorFunct: (number) => Color): {[index: number]: Color} {
    let colors: {[index: number]: Color} = {};
    let indices = Object.keys(geotiffData.values[0]);
    let i: number;
    console.log(indices.length);
    for(i = 0; i < indices.length; i++) {
      let index = indices[i];
      colors[index] = colorFunct(geotiffData.values[0][index]);
    }
    return colors;
  }

  // fromGeoTIFF(data, bandIndex = 0) {
  //   console.log(this.multipleFromGeoTIFF(data, [bandIndex])[0]);
  // }

  //need custom no data for now since geotiffs appear to have rounding error
  getDataFromGeotiff(data, customNoData?, bands?) {
    return geotiff.fromArrayBuffer(data).then((tiff: geotiff.GeoTIFF) => {
      //console.log(tiff);
      return tiff.getImage().then((image: geotiff.GeoTIFFImage) => {
        console.log(image);
        //are tiepoints indexed by cooresponding band?
        //assume just at index 0 like example for now, maybe ask matt
        let tiepoint = image.getTiePoints()[0];
        console.log(image.getTiePoints());
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

          let geotiffData: GeoTIFFData = {
            nCols: image.getWidth(),
            nRows: image.getHeight(),
            xllCorner: tiepoint.x,
            yllCorner: tiepoint.y - image.getHeight() * yScale,
            cellXSize: xScale,
            cellYSize: yScale,
            values: {}
          };

          //package data
          let i: number;
          console.log(bands);
          for(i = 0; i < bands.length; i++) {
            let band = bands[i];
            let raster = rasters[band]; // left-right and top-down order
            let values: {[index: number]: number} = {};
            
            let j: number;
            for(j = 0; j < raster.length; j++) {
              let value = raster[j];
              if(value != noData && value != customNoData) {
                values[j] = value;
              }
            }

            geotiffData.values[band] = values;
            
          }
          return geotiffData;
        });
      });
      
    });
  }

  ngOnInit() {

  }

  
}

interface DecoupledCoords {
  x: number,
  y: number
}

interface GeoTIFFData {
  nCols: number,
  nRows: number,
  xllCorner: number,
  yllCorner: number,
  cellXSize: number,
  cellYSize: number,
  values: {[band: number]: {[index: number]: number}}
}

interface Color {
  r: number,
  g: number,
  b: number,
  a: number
}
