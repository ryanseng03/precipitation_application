import { Component, OnInit } from '@angular/core';
import * as L from "leaflet";
import  "../../../../node_modules/leaflet-canvaslayer-field/dist/leaflet.canvaslayer.field.js"
import {ParameterStoreService, ParameterHook} from "../../services/parameter-store.service"

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss']
})
export class MapComponent implements OnInit {

  private options: L.MapOptions
  private drawnItems: L.FeatureGroup;
  private drawOptions: any;
  private map: L.Map;

  constructor(private paramService: ParameterStoreService) {
    this.options = {
      layers: [
        //tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '...' })
        L.tileLayer('http://www.google.com/maps/vt?lyrs=y@189&gl=en&x={x}&y={y}&z={z}', { maxZoom: 18, attribution: '...' })
      ],
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
    //console.log(aa);
    console.log(L.ScalarField);
  }

  ngOnInit() {

  }

  
}
