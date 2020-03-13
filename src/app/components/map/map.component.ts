import { Component, OnInit } from '@angular/core';
import * as L from "leaflet";
import  "../../../../node_modules/leaflet-canvaslayer-field/dist/leaflet.canvaslayer.field.js";
import {ParameterStoreService, ParameterHook} from "../../services/inputManager/parameter-store.service";
import * as chroma from "chroma-js";
import {saveAs} from "file-saver";
import * as geotiff from "geotiff";
import { Color, ColorScale } from "../../models/colorScale";
import { ColorGeneratorService } from "../../services/rasterLayerGeneration/color-generator.service";
import { DataRetreiverService } from "../../services/utility/data-retreiver.service";
import { R, RasterOptions, LeafletRasterLayerService } from "../../services/rasterLayerGeneration/leaflet-raster-layer.service";
import { DataManagerService, FocusedData, DataType } from "../../services/dataManager/data-manager.service";
import { EventParamRegistrarService } from "../../services/inputManager/event-param-registrar.service"
import "leaflet-groupedlayercontrol";
import { BandData, IndexedValues, RasterHeader, RasterData } from 'src/app/models/RasterData.js';
import { SiteMetadata, SiteInfo } from 'src/app/models/SiteMetadata.js';
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
  private active: {
    focused: FocusedData,
    band: string
  };
  private dataLayers: {
    [band: string]: any
  };

  private layerLabelMap: TwoWayLabelMap;

  constructor(private eventRegistrar: EventParamRegistrarService, private dataRetreiver: DataRetreiverService, private paramService: ParameterStoreService, private colors: ColorGeneratorService, private dataManager: DataManagerService, private rasterLayerService: LeafletRasterLayerService) {
    this.baseLayers = {
      Satellite: L.tileLayer("http://www.google.com/maps/vt?lyrs=y@189&gl=en&x={x}&y={y}&z={z}"),
      Street: L.tileLayer('https://www.google.com/maps/vt?lyrs=m@221097413,traffic&x={x}&y={y}&z={z}')
    };
    this.dataLayers = {};
    this.layerLabelMap = new TwoWayLabelMap({
      "rainfall": "Rainfall",
      "anomaly": "Anomaly",
      "se_rainfall": "Rainfall Standard Error",
      "se_anomaly": "Anomaly Standard Error"
    });

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


    //let colorScale: ColorScale = this.colors.getDefaultMonochromaticRainfallColorScale();
    let colorScale: ColorScale = this.colors.getDefaultRainbowRainfallColorScale();

    this.dataManager.getFocusedDataListener().pipe(first()).toPromise().then((data: FocusedData) => {
      
      let layerGroups = {
        Types: {}
      }
      let bands = data.data.raster.getBands();
      let header = data.data.raster.getHeader();
      for(let band in bands) {
        let rasterOptions: RasterOptions = {
          cacheEmpty: true,
          colorScale: colorScale,
          data: {
            header: header,
            values: bands[band]
          }
        };
        let rasterLayer = R.gridLayer.RasterLayer(rasterOptions);
        layerGroups.Types[this.layerLabelMap.getLabel(band)] = rasterLayer;
        this.dataLayers[band] = rasterLayer;
      }

      map.addLayer(this.dataLayers["rainfall"]);

      
    
      this.active = {
        focused: data,
        band: "rainfall"
      };

      

      let layerGroupControlOptions = {
        exclusiveGroups: ["Types"],
        groupCheckboxes: true
      };

      let lc = C.groupedLayers(this.baseLayers, layerGroups, layerGroupControlOptions);
      lc.addTo(map);

      this.addPopupOnHover(1000);

      let clusterOptions = {
        //chunkedLoading: true
      };

      let sites = data.data.sites;

      let siteMarkers = R.markerClusterGroup(clusterOptions);
      let markers = [];
      sites.forEach((site: SiteInfo) => {

        // //troubleshooting markers not appearing
        // if(site.location.lat < this.options.maxBounds[0][0] || site.location.lat > this.options.maxBounds[1][0]
        // || site.location.lng < this.options.maxBounds[0][1] || site.location.lng > this.options.maxBounds[1][1]) {
        //   console.log("OOB!", site.location.lat, site.location.lng);
        // }

        let siteDetails: string = "Name: " + site.name
        + "<br> Network: " + site.network
        + "<br> Lat: " + site.location.lat + ", Lng: " + site.location.lng
        //cheating here for now, should get actual site value
        + "<br> Value: " + site.value;
        let marker = L.marker(site.location).bindPopup(siteDetails);
        //console.log(siteDetails);
        markers.push(marker);
      });
      //console.log(markers);
      siteMarkers.addLayers(markers);
      //console.log(siteMarkers);
      map.addLayer(siteMarkers);
      //console.log(sites);

      //after first go only set data
      this.dataManager.getFocusedDataListener().subscribe((data: FocusedData) => {
        //need to make sure it has all the expected bands otherwise print error and ignore data
        let bandData: BandData = data.data.raster.getBands();
        let bands = Object.keys(bandData);
        if(bands.length != Object.keys(this.dataLayers).length) {
          console.error("Bands don't match");
          return;
        }
        for(let band in bands) {
          let indexedData: IndexedValues = bandData[band];
          this.dataLayers[band].setData(indexedData);
        }
        this.active.focused = data;

      });
    });

    this.setBaseLayerHandlers();

    
  }

  setBaseLayerHandlers() {
    this.map.on('overlayadd', (e: L.LayersControlEvent) => {
      //set layer to type any
      //let layer: any = e.layer;
      this.active.band = e.name;
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
        let raster: RasterData = this.active.focused.data.raster;
        let band = this.active.band;
        let header = raster.getHeader();
        let data: Map<number, number> = raster.getBands([band])[band];
        let geojson = this.dataRetreiver.getGeoJSONCellFromGeoPos(header, data, position);
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
  
          let value = this.dataRetreiver.geoPosToGridValue(header, data, position);
  
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

class TwoWayLabelMap {
  nameToLabelMap: any;
  labelToNameMap: any;

  constructor(nameToLabelMap: {[name: string]: string}) {
    this.labelToNameMap = {};
    let keys = Object.keys(nameToLabelMap);
    for(let key in keys) {
      let label = nameToLabelMap[key];
      this.labelToNameMap[label] = name;
    }
    this.nameToLabelMap = nameToLabelMap;
  }

  getLabel(name: string) {
    return this.nameToLabelMap[name];
  }

  getName(label: string) {
    return this.labelToNameMap[label];
  }
}