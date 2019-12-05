import { Component, OnInit } from '@angular/core';
import * as L from "leaflet";
import  "../../../../node_modules/leaflet-canvaslayer-field/dist/leaflet.canvaslayer.field.js";
import {ParameterStoreService, ParameterHook} from "../../services/parameter-store.service";
import * as chroma from "chroma-js";
import {saveAs} from "file-saver";
import * as geotiff from "geotiff";
import { Color, ColorScale } from "../../classes/color-scale";
import { ColorGeneratorService } from "../../services/color-generator.service";
import { GeotiffDataLoaderService } from "../../services/geotiff-data-loader.service";
import { DataRetreiverService } from "../../services/data-retreiver.service";
import { R, RasterOptions, LeafletRasterLayerService } from "../../services/leaflet-raster-layer.service";
import { DataManagerService, FocusedData, DataType } from "../../services/data-manager.service";
import { EventParamRegistrarService } from "../../services/event-param-registrar.service"
import { DataLoaderService } from 'src/app/services/data-loader.service';
import "leaflet-groupedlayercontrol";
import { BandData, IndexedValues } from 'src/app/models/RasterData.js';
import { SiteMetadata } from 'src/app/models/SiteMetadata.js';
import "leaflet.markercluster";
import {first} from "rxjs/operators";

//type workaround, c contains plugin controls, typed as any so won't give error due to type constraints not being in leaflet typedef
let C: any = L.control;

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
  private focused: FocusedData;

  constructor(private loader: DataLoaderService, private eventRegistrar: EventParamRegistrarService, private dataRetreiver: DataRetreiverService, private paramService: ParameterStoreService, private colors: ColorGeneratorService, private geotiffLoader: GeotiffDataLoaderService, private dataManager: DataManagerService, private rasterLayerService: LeafletRasterLayerService) {
    this.baseLayers = {
      Satellite: L.tileLayer("http://www.google.com/maps/vt?lyrs=y@189&gl=en&x={x}&y={y}&z={z}"),
      Street: L.tileLayer('https://www.google.com/maps/vt?lyrs=m@221097413,traffic&x={x}&y={y}&z={z}')
    };

    this.options = {
      layers: [this.baseLayers.Satellite],
      zoom: 7,
      center: L.latLng(20.5, -157.917480),
      attributionControl: false,
      // zoomSnap: 0.01,
      // wheelPxPerZoomLevel: 200,
      minZoom: 6,
      maxZoom: 20,
      maxBounds: [
        [18.302381, -160.762939],
        [22.603869, -153.973389]
      ]
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

    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "assets/marker-icon-2x.png",
      iconUrl: "assets/marker-icon.png",
      shadowUrl: "assets/marker-shadow.png"
    });

    //don't want popup to be force closed when another one appears
    L.Map.prototype.openPopup = function(popup) {
      this._popup = popup;

      return this.addLayer(popup).fire('popupopen', {
        popup: this._popup
      });
    }

    
  }



  onMapReady(map: L.Map) {
    
    L.DomUtil.addClass(map.getContainer(), 'pointer-cursor')
    this.map = map;
    this.drawnItems.addTo(map);

    //!!
    //arrow functions lexically bind this (bind to original context)
    //have to use "function()" syntax if new context


    let colorScale: ColorScale = this.colors.getDefaultMonochromaticRainfallColorScale();
    //let colorScale: ColorScale = this.colors.getDefaultRainbowRainfallColorScale();

    this.dataManager.getFocusedDataListener().pipe(first()).toPromise().then((data: FocusedData) => {
      this.focused = data;
      let layerGroups = {
        Types: {}
      }
      
      let bands: BandData = this.dataManager.getRasterData(data.date, DataManagerService.DATA_TYPES);
      for(let band in bands) {
        
        let rasterOptions: RasterOptions = {
          cacheEmpty: true,
          colorScale: colorScale,
          data: {
            header: data.header,
            values: bands[band]
          }
        };
        let rasterLayer = R.gridLayer.RasterLayer(rasterOptions);
        layerGroups.Types[band] = rasterLayer;
      }

      map.addLayer(layerGroups.Types[data.type]);

      //test redraw
      // setTimeout(() => {
      //   let test: IndexedValues = new Map<number, number>();
      //   data.data.forEach((index: number, key: number) => {
      //     test.set(key, 1);
      //   });
      //   console.log(test);

      //   layerGroups.Types[data.type].setData(data.header, test)
      // }, 1000);
    

      

      var layerGroupControlOptions = {
        exclusiveGroups: ["Types"],
        groupCheckboxes: true
      };

      // L.control.layers(baseLayers).addTo(map);
      // L.control.layers(this.baseLayers).addTo(map);
      C.groupedLayers(this.baseLayers, layerGroups, layerGroupControlOptions).addTo(map);
      //console.log(C.groupedLayers);

      // let clickTag = this.eventRegistrar.registerGeoMapClick(map);
      // let geojsonLayer: L.GeoJSON;
      // this.paramService.createParameterHook(clickTag, (position: L.LatLng) => {
      //   console.log(this.dataRetreiver.geoPosToGridValue(data.header, data.data, position));
      //   let geojson = this.dataRetreiver.getGeoJSONCellFromGeoPos(data.header, data.data, position);
      //   console.log(geojson);
      //   if(geojsonLayer != undefined) {
      //     map.removeLayer(geojsonLayer);
      //   }
        
      //   geojsonLayer = new L.GeoJSON(geojson);
      //   map.addLayer(geojsonLayer);
      // }, true);

      this.addPopupOnHover(1000);

      let sites = this.dataManager.getSiteMetadata(data.date);
      let siteMarkers = R.markerClusterGroup();
      sites.forEach((site: SiteMetadata) => {
        let value = this.dataRetreiver.geoPosToGridValue(data.header, data.data, site.location);
        let siteDetails: string = "Name: " + site.name
        + "<br> Network: " + site.network
        + "<br> Lat: " + site.location.lat + ", Lng: " + site.location.lng
        //cheating here for now, should get actual site value
        + "<br> Value: " + value;
        let marker = L.marker(site.location).bindPopup(siteDetails);
        siteMarkers.addLayer(marker);
      });
      map.addLayer(siteMarkers);
      //console.log(sites);
    });

    this.setBaseLayerHandlers();

    //after first go only set data
    this.dataManager.getFocusedDataListener().subscribe((data: FocusedData) => {
      this.focused = data;
    });
  }

  setBaseLayerHandlers() {
    this.map.on('overlayadd', (e: L.LayersControlEvent) => {
      //console.log(e);
      let type: DataType = <DataType>e.name;
      this.dataManager.setFocusedData(this.focused.date, type);
    });
  }


  addPopupOnHover(timeout: number) {
    let popupData: PopupData = {
      popupTimer: null,
      highlightedCell: null
    };
    
    let hoverTag = this.eventRegistrar.registerMapHover(this.map);
    let popup: L.Popup;
    this.paramService.createParameterHook(hoverTag, (position: L.LatLng) => {
      
      if(popupData.highlightedCell != null) {
        this.map.removeLayer(popupData.highlightedCell);
        popupData.highlightedCell = null;
      }
      //close current hover popup if exesits
      this.map.closePopup(popup);
      clearTimeout(popupData.popupTimer);
      popupData.popupTimer = setTimeout(() => {
        //if position is null mouse moved out of map
        if(position == null) {
          return;
        }
        let geojson = this.dataRetreiver.getGeoJSONCellFromGeoPos(this.focused.header, this.focused.data, position);
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
  
          let value = this.dataRetreiver.geoPosToGridValue(this.focused.header, this.focused.data, position);
  
          //popup cell value
          popup = L.popup({ autoPan: false })
          .setLatLng(position);
          popup.setContent("Value: " + value);
          popup.openOn(this.map);
        }
      }, timeout);

    });
  }

  setDrawingHandlers() {
    this.map.on(L.Draw.Event.CREATED, (e: any) => {
      let geojson = e.layer.toGeoJSON();
      console.log(geojson);
      //console.log(this.dataRetreiver.getGeoJSONBoundingBox(geojson));
    });
  }

  ngOnInit() {

  }

  
}

interface PopupData {
  popupTimer: any,
  highlightedCell: L.Layer
}