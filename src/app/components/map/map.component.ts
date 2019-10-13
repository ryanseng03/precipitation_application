import { Component, OnInit } from '@angular/core';
import * as L from "leaflet";
import  "../../../../node_modules/leaflet-canvaslayer-field/dist/leaflet.canvaslayer.field.js"
import {ParameterStoreService, ParameterHook} from "../../services/parameter-store.service"
import * as chroma from "chroma-js"
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

    

    

    let filterNodata = (value: number) => {
      return value != -3.3999999521443642e+38;
    };

    let colorScale = chroma.scale(['red','yellow','green','blue','purple','indigo']).domain([0, 750]);
    //let colorScale = chroma.scale(['white', 'black']).domain([0, 750]);
    let freeze = false;
    let testColorCache: any = {};
    let colorFunct = (value: number) => {
      
      // if(!freeze) {
      //   console.log(Object.keys(testColorCache).length);
      //   freeze = true;
      //   setTimeout(() => {
      //     freeze = false;
      //   }, 10);
      // }
      
      // let color = testColorCache[value];
      // if(color == undefined) {
        
      //   color = colorScale(value).toString();
      //   testColorCache[value] = color;
      // }

      return colorScale(value).toString();
    }

    console.log("?");
    R.GridLayer.DebugCoords = L.GridLayer.extend({
      createTile: function (coords) {
        var tile = document.createElement('canvas');

        let ctx = tile.getContext("2d");
        ctx.getImageData

        tile.innerHTML = [coords.x, coords.y, coords.z].join(', ');
        tile.style.outline = '1px solid red';
        return tile;
      }
    });
    
    R.gridLayer.debugCoords = function(opts) {
      return new R.GridLayer.DebugCoords(opts);
    };
    
    map.addLayer( R.gridLayer.debugCoords() );

    this.http.get("/assets/test.tif", {
      responseType: "arraybuffer"
    }).toPromise().then((data: any) => {
      this.fromGeoTIFF(data);
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

fromGeoTIFF(data, bandIndex = 0) {
  console.log(this.multipleFromGeoTIFF(data, [bandIndex])[0]);
}


multipleFromGeoTIFF(data, bandIndexes) {
    //console.time('ScalarField from GeoTIFF');
console.log(geotiff);
    geotiff.fromArrayBuffer(data).then((tiff: geotiff.GeoTIFF) => {
      console.log(tiff);
      let image = tiff.getImage().then((image: geotiff.GeoTIFFImage) => {
        console.log(image);
        let rasters = image.readRasters();
        let tiepoint = image.getTiePoints()[0];
        let fileDirectory = image.getFileDirectory();
        Promise.all([rasters, tiepoint, fileDirectory]).then((details: any[]) => {
          console.log(details);
          let rasters = details[0];
          let tiepoint = details[1];
          let fileDirectory = details[2];


          let [xScale, yScale] = fileDirectory.ModelPixelScale;

          if (typeof bandIndexes === 'undefined' || bandIndexes.length === 0) {
              // bandIndexes = [...Array(rasters.length).keys()];
              bandIndexes = [rasters.keys()];
          }
    
          let scalarFields = [];
          scalarFields = bandIndexes.map(function(bandIndex) {
              let zs = rasters[bandIndex]; // left-right and top-down order
    
              if (fileDirectory.GDAL_NODATA) {
                  let noData = parseFloat(fileDirectory.GDAL_NODATA);
                  // console.log(noData);
                  let simpleZS = Array.from(zs); // to simple array, so null is allowed | TODO efficiency??
                  zs = simpleZS.map(function(z) {
                      return z === noData ? null : z;
                  });
              }
    
              let p = {
                  nCols: image.getWidth(),
                  nRows: image.getHeight(),
                  xllCorner: tiepoint.x,
                  yllCorner: tiepoint.y - image.getHeight() * yScale,
                  cellXSize: xScale,
                  cellYSize: yScale,
                  zs: zs
              };
              console.log(p);
              return p;
          });
          
        });
      });
      console.log(image);
     
    }); // geotiff.js
  

    //console.timeEnd('ScalarField from GeoTIFF');
    return [null];
}

  ngOnInit() {

  }

  
}
