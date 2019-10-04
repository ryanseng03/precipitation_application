import { Component, OnInit } from '@angular/core';
import * as L from "leaflet";
import  "../../../../node_modules/leaflet-canvaslayer-field/dist/leaflet.canvaslayer.field.js"
import {ParameterStoreService, ParameterHook} from "../../services/parameter-store.service"
import * as chroma from "chroma-js"
import { HttpClient } from '@angular/common/http';
import {saveAs} from "file-saver";


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

    let colorFunct = (value: number) => {
      return chroma.scale(['red','yellow','green','blue','purple','indigo']).domain([0, 750])(value).toString();
    }

    this.http.get("/assets/test.tif", {
      responseType: "arraybuffer"
    }).toPromise().then((data: any) => {
      
        console.log(data);
        let s = R.ScalarField.fromGeoTIFF(data);
        let mlayer = R.canvasLayer.scalarField(s, {
          inFilter: filterNodata,
          //interpolation does not run a check on filterNodata
          //when drawing on the canvas (L.CanvasLayer.ScalarField.js) _prepareImageIn runs either interpolatedValueAt or valueAt in Field.js
          //interpolatedValueAt does not check filterNodata, could modify but uses minified source, look into this later
          interpolate: true,
          color: colorFunct
        }).addTo(map);
        map.fitBounds(mlayer.getBounds());

        L.control.layers(this.baseLayers, {Raster: mlayer}).addTo(map);

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
      
    });
   
  }

  ngOnInit() {

  }

  
}
