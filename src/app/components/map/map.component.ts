import { Component, OnInit } from '@angular/core';
import * as L from "leaflet";
import  "../../../../node_modules/leaflet-canvaslayer-field/dist/leaflet.canvaslayer.field.js";
import {ParameterStoreService, ParameterHook} from "../../services/parameter-store.service";
import * as chroma from "chroma-js";
import {saveAs} from "file-saver";
import * as geotiff from "geotiff";
import { Color, ColorScale } from "../../classes/color-scale";
import { ColorGeneratorService } from "../../services/color-generator.service";
import { GeotiffDataLoaderService, RasterData } from "../../services/geotiff-data-loader.service";
import { DataRetreiverService } from "../../services/data-retreiver.service";
import { R, RasterOptions, LeafletRasterLayerService } from "../../services/leaflet-raster-layer.service";
import { DataManagerService } from "../../services/data-manager.service";
import { EventParamRegistrarService } from "../../services/event-param-registrar.service"



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

  constructor(private eventRegistrar: EventParamRegistrarService, private dataRetreiver: DataRetreiverService, private paramService: ParameterStoreService, private colors: ColorGeneratorService, private geotiffLoader: GeotiffDataLoaderService, private dataManager: DataManagerService, private rasterLayerService: LeafletRasterLayerService) {
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
    L.DomUtil.addClass(map.getContainer(), 'pointer-cursor');
    console.log(map.getContainer());
    this.map = map;
    this.drawnItems.addTo(map);

    //!!
    //arrow functions lexically bind this (bind to original context)
    //have to use "function()" syntax if new context


    let colorScale: ColorScale = this.colors.getDefaultRainbowRainfallColorScale();
 
    

    this.geotiffLoader.getDataFromGeotiff("/assets/test.tif", -3.3999999521443642e+38).then((geotiffData: RasterData) => {
      this.dataManager.setRasterData(geotiffData);

      let clickTag = this.eventRegistrar.registerGeoMapClick(map);
      let geojsonLayer: L.GeoJSON;
      this.paramService.createParameterHook(clickTag, (position: L.LatLng) => {
        console.log(this.dataRetreiver.geoPosToGridValue(position));
        let geojson = this.dataRetreiver.getGeoJSONCellFromGeoPos(position);
        console.log(geojson);
        if(geojsonLayer != undefined) {
          map.removeLayer(geojsonLayer);
        }
        
        geojsonLayer = new L.GeoJSON(geojson);
        map.addLayer(geojsonLayer);
      }, true);

      let options: RasterOptions = {
        cacheEmpty: true,
        colorScale: colorScale
      };
      
      let rasterLayer = R.gridLayer.RasterLayer(options);
      map.addLayer(rasterLayer);

    });

    this.addPopupOnHover(1000);
  }


  addPopupOnHover(timeout: number) {
    let popupData: PopupData = {
      popupTimer: null,
      highlightedCell: null
    };
    
    let hoverTag = this.eventRegistrar.registerMapHover(this.map);
    this.paramService.createParameterHook(hoverTag, (position: L.LatLng) => {
      if(popupData.highlightedCell != null) {
        this.map.removeLayer(popupData.highlightedCell);
        popupData.highlightedCell = null;
      }

      this.map.closePopup();
      clearTimeout(popupData.popupTimer);
      popupData.popupTimer = setTimeout(() => {
        let geojson = this.dataRetreiver.getGeoJSONCellFromGeoPos(position);
        //check if data exists at hovered point
        if(geojson != undefined) {
          popupData.highlightedCell = L.geoJSON(geojson)
          .setStyle({
            fillColor: "orange",
            weight: 3,
            opacity: 1,
            color: "orange",
            fillOpacity: 0.2
          })
          .addTo(this.map)
  
          let value = this.dataRetreiver.geoPosToGridValue(position);
  
          //popup cell value
          let popup = L.popup({ autoPan: false })
          .setLatLng(position);
          popup.setContent("Value: " + value);
          popup.openOn(this.map);
        }
      }, timeout);

    });
  }

  ngOnInit() {

  }

  
}

interface PopupData {
  popupTimer: any,
  highlightedCell: L.Layer
}