import { Component, OnInit, ViewChild, ElementRef, Input } from '@angular/core';
import * as L from "leaflet";
import "leaflet-spin";
import * as chroma from "chroma-js";
import { ColorScale } from "../../models/colorScale";
import { ColorGeneratorService } from "../../services/rasterLayerGeneration/color-generator.service";
import { DataRetreiverService } from "../../services/util/data-retreiver.service";
import { R, RasterOptions, LeafletRasterLayerService } from "../../services/rasterLayerGeneration/leaflet-raster-layer.service";
import { EventParamRegistrarService, LoadingData, ParameterHook } from "../../services/inputManager/event-param-registrar.service"
import "leaflet-groupedlayercontrol";
import { RasterData } from 'src/app/models/RasterData.js';
import { SiteInfo } from 'src/app/models/SiteMetadata.js';
import "leaflet.markercluster";
import {DataManagerService} from "../../services/dataManager/data-manager.service";
import { RoseControlOptions } from '../leaflet-controls/leaflet-compass-rose/leaflet-compass-rose.component';
import Moment from 'moment';
import { LeafletLayerControlExtensionComponent } from '../leaflet-controls/leaflet-layer-control-extension/leaflet-layer-control-extension.component';
// import { LeafletImageExportComponent } from "../leaflet-controls/leaflet-image-export/leaflet-image-export.component";
import { AssetManagerService } from 'src/app/services/util/asset-manager.service';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss']
})
export class MapComponent implements OnInit {

  @Input() imageContainer: ElementRef;

  @ViewChild("mapElement") mapElement: ElementRef;
  @ViewChild("layerController") layerController: LeafletLayerControlExtensionComponent;

  readonly extents: {[county: string]: L.LatLngBoundsExpression} = {
    ka: [ [ 21.819, -159.816 ], [ 22.269, -159.25125 ] ],
    oa: [ [ 21.18, -158.322 ], [ 21.7425, -157.602 ] ],
    ma: [ [ 20.343, -157.35 ], [ 21.32175, -155.92575 ] ],
    bi: [ [ 18.849, -156.243 ], [ 20.334, -154.668 ] ],
    st: [ [ 18.849, -159.816 ], [ 22.269, -154.668 ] ],
    bounds: [ [14.050369038588524, -167.60742187500003], [26.522031143884014, -144.47021484375003] ]
  };
  //private R: any = L;

  imageHiddenControls = ["leaflet-control-zoom", "leaflet-control-layers", "leaflet-control-export"];

  markerInfo: RainfallStationMarkerInfo;

  colorScheme: ColorScale;

  roseOptions: RoseControlOptions;
  // markerClusterLayer: any;

  options: L.MapOptions;
  // private drawnItems: L.FeatureGroup;
  // private drawOptions: any;
  map: L.Map;
  private baseLayers: any;
  active: ActiveData;
  private dataLayers: {
    [band: string]: any
  };


  private selectedMarker: L.CircleMarker;



  constructor(private dataManager: DataManagerService, private paramService: EventParamRegistrarService, private dataRetreiver: DataRetreiverService, private colors: ColorGeneratorService, private rasterLayerService: LeafletRasterLayerService, private assetService: AssetManagerService) {
    let roseImage = "/arrows/nautical.svg";
    let roseURL = assetService.getAssetURL(roseImage);
    this.roseOptions = {
      image: roseURL,
      position: "bottomleft"
    }


    this.baseLayers = {
      "Satellite (Google)": L.tileLayer("http://www.google.com/maps/vt?lyrs=y@189&gl=en&x={x}&y={y}&z={z}", {
        maxZoom: 20
      }),
      "Street (Google)": L.tileLayer('https://www.google.com/maps/vt?lyrs=m@221097413,traffic&x={x}&y={y}&z={z}', {
        maxZoom: 20
      }),
      "World Imagery (ESRI)": L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 19,
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
      }),
      "USGS Topo (USGS)": L.tileLayer('https://basemap.nationalmap.gov/arcgis/rest/services/USGSTopo/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 16,
        attribution: 'Tiles courtesy of the <a href="https://usgs.gov/">U.S. Geological Survey</a>'
      }),
      "Shaded Relief (ESRI)": L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Shaded_Relief/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 13,
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri'
      })
    };
    this.dataLayers = {};

    this.options = {
      layers: this.baseLayers["Satellite (Google)"],
      zoom: 7,
      center: L.latLng(20.559, -157.242),
      attributionControl: false,
      minZoom: 6,
      maxBounds: this.extents.bounds
    };

    delete (L.Icon.Default.prototype as any)._getIconUrl;

    L.Icon.Default.mergeOptions({
      iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
      iconUrl: require('leaflet/dist/images/marker-icon.png'),
      shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
    });


    paramService.createParameterHook(EventParamRegistrarService.EVENT_TAGS.loading, (data: LoadingData) => {
      if(data && data.tag == "vis") {
        this.setLoad(data.loading);
      }
    })
  }


  invalidateSize() {
    this.map.invalidateSize();
  }

  focusedBoundary = null
  focusSpatialExtent(extent: string) {
    this.clearExtent();
    let bounds: L.LatLngBoundsExpression = this.extents[extent];
    this.map.flyToBounds(bounds);
    let boundary = L.rectangle(bounds, {weight: 2, fillOpacity: 0});
    boundary.addTo(this.map);
    this.focusedBoundary = boundary;
  }

  clearExtent() {
    if(this.focusedBoundary != null) {
      this.map.removeLayer(this.focusedBoundary);
    }
  }

  //apparently you can't get opacity from the layer???
  //0.75 default opacity
  opacity: number = 0.75;
  setOpacity(opacity: number) {
    let layer: L.GridLayer = this.dataLayers[this.active.band];
    if(layer) {
      this.opacity = opacity;
      layer.setOpacity(opacity);
    }
  }

  getOpacity(): number {
    return this.opacity;
  }

  layerReady(): boolean {
    return this.dataLayers[this.active.band] != undefined;
  }

  //use to prevent race conditions for xml loaded schemes
  colorSchemeType: string;
  setColorScheme(colorScheme: ColorScale) {
    console.log(colorScheme);
    let layer: any = this.dataLayers[this.active.band];
    if(layer) {
      layer.setColorScale(colorScheme);
      this.colorScheme = colorScheme;
      //update marker colors
      for(let marker of this.markerInfo.markers) {
        let color = colorScheme.getColor(marker.metadata.value);
        let hex = chroma([color.r, color.g, color.b]).hex();
        marker.marker.setStyle({
          fillColor: hex
        });
      }

    }

  }

  private loading: number = 0;
  //spin seems to already have an internal counter, neat
  setLoad(load: boolean) {
    if(load) {
      (<any>this.map).spin(true, {color: "white", length: 20});
      this.loading++;
    }
    else {
      (<any>this.map).spin(false);
      this.loading--;
    }
  }

  isLoading(): boolean {
    return this.loading > 0;
  }

  onMapReady(map: L.Map) {

    this.active = {
      data: {
        stations: null,
        raster: null,
        date: null
      },
      band: "0",
    };




    this.initMarkerInfo();


    L.DomUtil.addClass(map.getContainer(), 'pointer-cursor')
    L.control.scale({
      position: 'bottomleft',
      maxWidth: 200
    }).addTo(map);



    this.map = map;

    //!!
    //arrow functions lexically bind this (bind to original context)
    //have to use "function()" syntax if new context


    let colorScale: ColorScale = this.colors.getViridisColorScale();
    this.colorScheme = colorScale;

    this.map.on("zoomend", () => {
      let bounds: L.LatLngBounds = map.getBounds();
      this.paramService.pushMapBounds(bounds);
      this.updateMarkers();
    });

    this.map.on("moveend", () => {
      let bounds: L.LatLngBounds = map.getBounds();
      this.paramService.pushMapBounds(bounds);
    });


    //want filtered, should anything be done with the unfiltered stations? gray them out or just exclude them? can always change
    this.paramService.createParameterHook(EventParamRegistrarService.EVENT_TAGS.filteredStations, (stations: SiteInfo[]) => {
      if(stations) {
        console.log(stations);
        this.active.data.stations = stations;
        this.constructMarkerLayerPopulateMarkerData(stations);
      }
    });

    this.layerController.addLayers(this.baseLayers);

    let rasterHook = this.paramService.createParameterHook(EventParamRegistrarService.EVENT_TAGS.raster, (raster: RasterData) => {
      if(raster) {
        this.active.data.raster = raster;
        let bands = raster.getBands();
        let header = raster.getHeader();
        for(let band in bands) {
          let rasterOptions: RasterOptions = {
            cacheEmpty: true,
            colorScale: this.colorScheme,
            data: {
              header: header,
              values: bands[band]
            }
          };
          let rasterLayer = R.gridLayer.RasterLayer(rasterOptions);
          //layerGroups.Types[this.layerLabelMap.getLabel(band)] = rasterLayer;
          this.dataLayers[band] = rasterLayer;
          rasterLayer.setOpacity(this.opacity);
        }
        //add rainfall layer to map as default
        map.addLayer(this.dataLayers["0"]);
  
        //for now at least only one layer, make sure to replace if multiple
        this.layerController.addOverlay(this.dataLayers["0"], "Data Map");
  
        //install hover handler (requires raster to be set to work)
        let hoverTag = this.paramService.registerMapHover(map);
        this.paramService.createParameterHook(hoverTag, this.hoverPopupHandler(1000));
  
        //uninstall current hook and replace with update hook that updates raster
        rasterHook.uninstall();
        rasterHook = this.paramService.createParameterHook(EventParamRegistrarService.EVENT_TAGS.raster, (raster: RasterData) => {
          if(raster) {
            this.active.data.raster = raster;
            bands = raster.getBands();
            //set layer data
            for(let band in bands) {
              let values = bands[band];
              this.dataLayers[band].setData(values);
            }
          }
        });
      }
    });

    this.paramService.createParameterHook(EventParamRegistrarService.EVENT_TAGS.selectedStation, (station: SiteInfo) => {
      if(station) {
        let marker: L.CircleMarker = this.markerInfo.markerMap.get(station);

        //stationMarkers.zoomToShowLayer(marker, () => {
        if(this.selectedMarker !== undefined && this.selectedMarker.isPopupOpen()) {
          this.selectedMarker.closePopup();
        }
        this.map.panTo(station.location, {animate: true});
        //console.log(map.panTo);
        this.selectedMarker = marker;
        //popup sometimes still closes when moving mouse for some reason, but this helps some
        //moveend isn't always triggered when finished, so use this as a fallback
        setTimeout(() => {
          if(marker.isPopupOpen && this.selectedMarker === marker) {
            marker.openPopup();
          }
        }, 300);
        //use as callback to animation end, otherwise movement bugs the popup and it immediately closes
        //think something about it already moving interferes with the popup repositioning
        map.once("moveend", () => {
          if(marker.isPopupOpen && this.selectedMarker === marker) {
            marker.openPopup();
          }

        })
      }

    });

    map.on("layeradd", (addData: any) => {
      let layer = addData.layer;
      if(layer.options && layer.options.maxZoom) {
        map.setMaxZoom(layer.options.maxZoom);
      }
    });
  }


  hoverPopupHandler(timeout: number) {
    let popupData: PopupData = {
      popupTimer: null,
      highlightedCell: null,
      popup: null
    };

    return (position: L.LatLng) => {
      if(popupData.highlightedCell != null) {
        this.map.removeLayer(popupData.highlightedCell);
        popupData.highlightedCell = null;
      }
      //close current hover popup if exists
      if(popupData.popup != null) {
        this.map.closePopup(popupData.popup);
        popupData.popup = null;
      }

      clearTimeout(popupData.popupTimer);
      popupData.popupTimer = setTimeout(() => {
        //if position is null mouse moved out of map
        if(position == null) {
          return;
        }

        let header = this.active.data.raster.getHeader();
        let data = this.active.data.raster.getBands()[this.active.band];
        // console.log(this.active);
        // console.log(data);

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
          popupData.popup = L.popup({ autoPan: false })
          .setLatLng(position);
          let content = `${Math.round(value * 100) / 100}mm<br>${Math.round((value / 25.4) * 100) / 100}in<br>`;
          popupData.popup.setContent(content);
          popupData.popup.openOn(this.map);
        }
      }, timeout);
    }

  }


  ngOnInit() {

  }

  getHeaderDate(): string {
    let formattedDate = "";
    if(this.active.data.date) {
      formattedDate = this.active.data.date.format("MMMM YYYY");
    }
    return formattedDate;
  }


  initMarkerInfo() {
    this.markerInfo = {
      markers: [],
      layer: null,
      pivotZoom: 10,
      weightToMinRadiusFactor: 0.4,
      minRadiusAtPivot: 0,
      markerMap: new Map<SiteInfo, L.CircleMarker>()
    }
  }

  constructMarkerLayerPopulateMarkerData(stations: SiteInfo[]): void {
    let markers: RainfallStationMarker[] = [];
    this.markerInfo.markerMap.clear();

    let markerLayer = L.layerGroup();
    let minRadiusAtPivot = Number.POSITIVE_INFINITY;
    stations.forEach((station: SiteInfo) => {
      let radius = this.getMarkerRadiusAtPivot(station);
      if(radius < minRadiusAtPivot) {
        minRadiusAtPivot = radius;
      }
      let fill = this.colorScheme.getColor(station.value);
      let hexFill = chroma([fill.r, fill.g, fill.b]).hex();
      let marker = L.circleMarker(station.location, {
        opacity: 1,
        fillOpacity: 1,
        color: "black",
        fillColor: hexFill
      });

      let stationDetails = this.getMarkerPopupText(station);
      marker.bindPopup(stationDetails, { autoPan: false, autoClose: false});
      marker.on("click", () => {
        this.paramService.pushSelectedStation(station);
      });
      this.markerInfo.markerMap.set(station, marker);
      //console.log(stationDetails);
      markerLayer.addLayer(marker);
      let stationMarker: RainfallStationMarker = {
        marker: marker,
        metadata: {
          pivotRadius: radius,
          value: station.value
        }
      }
      markers.push(stationMarker);
    });
    this.markerInfo.minRadiusAtPivot = minRadiusAtPivot;

    this.markerInfo.markers = markers;

    //adjust markers
    this.updateMarkers();

    if(this.markerInfo.layer) {
      this.map.removeLayer(this.markerInfo.layer);
      this.layerController.removeLayer(this.markerInfo.layer);
    }
    this.markerInfo.layer = markerLayer;

    this.layerController.addOverlay(markerLayer, "Data Stations");
    this.map.addLayer(markerLayer);
  }

  getMarkerPopupText(station: SiteInfo): string {
    let stationDetails: string = "Name: " + station.name
    + "<br> SKN: " + station.skn
    + "<br> Lat: " + station.lat + ", Lng: " + station.lng
    + `<br> Value: ${Math.round(station.value * 100) / 100}mm`
    + `, ${Math.round((station.value / 25.4) * 100) / 100}in`;
    return stationDetails;
  }

  updateMarkers(): void {
    let zoom = this.map.getZoom();
    // console.log(zoom);
    let markers = this.markerInfo.markers;
    if(zoom < this.markerInfo.pivotZoom) {
      let weight = this.getWeightScaledRadius();
      for(let marker of markers) {
        this.setScaledMarkerRadius(marker);
        marker.marker.setStyle({weight: weight});
      }
    }
    else {
      let weight = this.getWeightStaticRadius();
      for(let marker of markers) {
        this.setStaticMarkerRadius(marker);
        marker.marker.setStyle({weight: weight});
      }
    }
  }

  getWeightStaticRadius(): number {
    let radius = this.getStaticRadius(this.markerInfo.minRadiusAtPivot);
    let weight = this.markerInfo.weightToMinRadiusFactor * radius;
    return weight;
  }
  getWeightScaledRadius(): number {
    let radius = this.getScaledRadius(this.markerInfo.minRadiusAtPivot);
    let weight = this.markerInfo.weightToMinRadiusFactor * radius;
    return weight;
  }

  getMarkerRadiusAtPivot(station: SiteInfo): number {
    let min = 5;
    let max = 30;
    let radius = min + station.value / 50;
    radius = Math.min(radius, max);
    return radius;
  }

  setStaticMarkerRadius(marker: RainfallStationMarker) {
    let zoom = this.map.getZoom();
    let scale = this.map.getZoomScale(this.markerInfo.pivotZoom, zoom);
    let radiusAtPivot = marker.metadata.pivotRadius;
    let radius = this.getStaticRadius(radiusAtPivot);
    marker.marker.setRadius(radius);
  }
  getStaticRadius(radiusAtPivot: number) {
    let zoom = this.map.getZoom();
    let scale = this.map.getZoomScale(this.markerInfo.pivotZoom, zoom);
    let scaledRadius = radiusAtPivot * scale;
    let radius = 0;
    //note this is diferent from marker info var with same name
    let minRadiusAtPivot = 0.1
    if(scaledRadius < minRadiusAtPivot) {
      radius = minRadiusAtPivot / scale;
    }
    else {
      radius = radiusAtPivot;
    }
    return radius;
  }

  setScaledMarkerRadius(marker: RainfallStationMarker): void {
    let radius = this.getScaledRadius(marker.metadata.pivotRadius);
    //console.log(radius);
    marker.marker.setRadius(radius);
  }
  getScaledRadius(radiusAtPivot: number): number {
    let scale = this.map.getZoomScale(this.map.getZoom(), this.markerInfo.pivotZoom);
    //console.log(scale);
    let radius = radiusAtPivot * scale;
    return radius;
  }

  //for now just set boundaries on size at pivot, have radius not change if above pivot zoom

  //should make this global, will look better if consistent
  setMarkerWeight(marker: RainfallStationMarker): void {
    //set weight to 5% of radius
    let weight = marker.marker.getRadius() * this.markerInfo.weightToMinRadiusFactor;
    let max = 2;
    weight = Math.min(weight, max);
    marker.marker.setStyle({weight: 1});
  }
}

//weight 5% radius?
interface RainfallStationMarkerInfo {
  markers: RainfallStationMarker[],
  layer: L.LayerGroup,
  pivotZoom: number,
  weightToMinRadiusFactor: number,
  minRadiusAtPivot: number,
  markerMap: Map<SiteInfo, L.CircleMarker>
}

interface RainfallStationMarker {
  marker: L.CircleMarker,
  metadata: MarkerMetadata
}

//scale everything from pivot radius to prevent rounding issues and reduce complexity
interface MarkerMetadata {
  pivotRadius: number,
  value: number
}

interface ActiveData {
  data: DataPack,
  band: string
}

interface DataPack {
  stations: SiteInfo[],
  raster: RasterData,
  date: Moment.Moment
}

interface PopupData {
  popupTimer: any,
  highlightedCell: L.Layer,
  popup: L.Popup
}





