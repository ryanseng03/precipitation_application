import { Component, OnInit, ViewChild, ElementRef, Input } from '@angular/core';
import * as L from "leaflet";
import "leaflet-spin";
import { ColorScale } from "../../models/colorScale";
import { DataRetreiverService } from "../../services/util/data-retreiver.service";
import { LeafletRasterLayerService, R, RasterOptions } from "../../services/rasterLayerGeneration/leaflet-raster-layer.service";
import { EventParamRegistrarService, LoadingData, ParameterHook } from "../../services/inputManager/event-param-registrar.service"
import "leaflet-groupedlayercontrol";
import { RasterData, RasterHeader } from 'src/app/models/RasterData.js';
import { SiteInfo } from 'src/app/models/SiteMetadata.js';
import "leaflet.markercluster";
import { RoseControlOptions } from '../leaflet-controls/leaflet-compass-rose/leaflet-compass-rose.component';
import { LeafletLayerControlExtensionComponent } from '../leaflet-controls/leaflet-layer-control-extension/leaflet-layer-control-extension.component';
// import { LeafletImageExportComponent } from "../leaflet-controls/leaflet-image-export/leaflet-image-export.component";
import { AssetManagerService } from 'src/app/services/util/asset-manager.service';
import { VisDatasetItem, FocusData } from 'src/app/services/dataset-form-manager.service';
import { DataManagerService } from 'src/app/services/dataManager/data-manager.service';

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
  hoverHook: ParameterHook;


  private selectedMarker: L.CircleMarker;

  dataset: VisDatasetItem;

  private _viewType: string;

  constructor(private paramService: EventParamRegistrarService, private dataRetreiver: DataRetreiverService, private assetService: AssetManagerService, private dataManager: DataManagerService, private layerService: LeafletRasterLayerService) {
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
    });
  }


  invalidateSize() {
    if(this.map) {
      this.map.invalidateSize();
    }
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

  //use to prevent race conditions for xml loaded schemes
  colorSchemeType: string;
  setColorScheme(colorScheme: ColorScale) {
    let layer: any = this.dataLayers[this.active.band];
    this.colorScheme = colorScheme;
    if(layer) {
      layer.setColorScale(colorScheme);
      //update marker colors
      for(let marker of this.markerInfo.markers) {
        let hex = colorScheme.getColorHex(marker.value);
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
    this.map = map;

    this.active = {
      data: {
        stations: null,
        raster: null,
        focus: null
      },
      band: "0",
    };

    this.paramService.createParameterHook(EventParamRegistrarService.EVENT_TAGS.focusData, (focus: FocusData<unknown>) => {
      this.active.data.focus = focus;
    });

    this.initMarkerInfo();

    //L.DomUtil.addClass(this.mapElement.nativeElement, 'pointer-cursor');
    L.control.scale({
      position: 'bottomleft',
      maxWidth: 200
    }).addTo(this.map);

    //!!
    //arrow functions lexically bind this (bind to original context)
    //have to use "function()" syntax if new context


    let colorScale: ColorScale;
    this.colorScheme = colorScale;

    this.map.on("zoomend", () => {
      let bounds: L.LatLngBounds = this.map.getBounds();
      this.paramService.pushMapBounds(bounds);
      this.updateMarkers();
    });

    this.map.on("movestart", () => {
      this.hoverHook.uninstall();
      L.DomUtil.removeClass(this.mapElement.nativeElement, 'cursor-crosshair');
      clearTimeout(this.crosshairThrottle);
      this.crosshairThrottle = null;
      L.DomUtil.addClass(this.mapElement.nativeElement, 'cursor-grabbing');
    });
    this.map.on("moveend", () => {
      let bounds: L.LatLngBounds = this.map.getBounds();
      this.paramService.pushMapBounds(bounds);
      L.DomUtil.removeClass(this.mapElement.nativeElement, 'cursor-grabbing');
      this.hoverHook.install();
    });

    //set timeout to prevent issues with map not propogating to overlay extension
    setTimeout(() => {
      //want filtered, should anything be done with the unfiltered stations? gray them out or just exclude them? can always change
      this.paramService.createParameterHook(EventParamRegistrarService.EVENT_TAGS.filteredStations, (stations: SiteInfo[]) => {
        this.active.data.stations = stations;
        this.constructMarkerLayerPopulateMarkerData(stations);
      });
    }, 0);



    this.layerController.addLayers(this.baseLayers);

    let datasetHook = this.paramService.createParameterHook(EventParamRegistrarService.EVENT_TAGS.dataset, (dataset: VisDatasetItem) => {
      this.dataset = dataset;
    });

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
        this.map.addLayer(this.dataLayers["0"]);
        //for now at least only one layer, make sure to replace if multiple
        this.layerController.addOverlay(this.dataLayers["0"], "Data Map");

        //install hover handler (requires raster to be set to work)
        let hoverTag = this.paramService.registerMapHover(this.map);
        this.hoverHook = this.paramService.createParameterHook(hoverTag, this.hoverPopupHandler(1000));
        //uninstall current hook and replace with update hook that updates raster
        rasterHook.uninstall();
        let rasterLayerActive = true;
        rasterHook = this.paramService.createParameterHook(EventParamRegistrarService.EVENT_TAGS.raster, (raster: RasterData) => {
          //no raster for dataset, remove layers
          if(rasterLayerActive && raster === null) {
            this.map.removeLayer(this.dataLayers["0"]);
            this.layerController.removeLayer(this.dataLayers["0"]);
            rasterLayerActive = false
          }
          else if(raster !== null) {
            this.active.data.raster = raster;
            bands = raster.getBands();
            //set layer data
            for(let band in bands) {
              let values = bands[band];
              this.dataLayers[band].setData(values);
            }
            if(!rasterLayerActive) {
              //add rainfall layer to map as default
              this.map.addLayer(this.dataLayers["0"]);
              //for now at least only one layer, make sure to replace if multiple
              this.layerController.addOverlay(this.dataLayers["0"], "Data Map");
              rasterLayerActive = true;
            }
          }
        });
      }
    });


    this.paramService.createParameterHook(EventParamRegistrarService.EVENT_TAGS.selectedStation, (station: any) => {
      this.selectStation(station);
    });

    this.map.on("layeradd", (addData: any) => {
      let layer = addData.layer;
      if(layer.options && layer.options.maxZoom) {
        this.map.setMaxZoom(layer.options.maxZoom);
      }
    });

    this.invalidateSize()
  }


  selectedStation = null;
  selectStation(station: SiteInfo) {
    this.selectedStation = station;
    if(station) {
      let marker: L.CircleMarker = this.markerInfo.markerMap.get(station);
      //ignore if station doesn't exist
      if(marker) {
        //stationMarkers.zoomToShowLayer(marker, () => {
        if(this.selectedMarker !== undefined && this.selectedMarker.isPopupOpen()) {
          this.selectedMarker.closePopup();
        }
        this.map.panTo(station.location, {animate: true});
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
        this.map.once("moveend", () => {
          if(marker.isPopupOpen && this.selectedMarker === marker) {
            marker.openPopup();
          }

        });
      }
    }
  }

  crosshairThrottle = null;
  crosshairHandler(position: L.LatLng, throttle: number) {
    if(!this.crosshairThrottle) {
      this.crosshairThrottle = setTimeout(() => {
        let header = this.active.data.raster.getHeader();
        let data = this.active.data.raster.getBands()[this.active.band];
        if(this.dataRetreiver.geoPosToGridValue(header, data, position)) {
          L.DomUtil.addClass(this.mapElement.nativeElement, 'cursor-crosshair');
        }
        else {
          L.DomUtil.removeClass(this.mapElement.nativeElement, 'cursor-crosshair');
        }
        this.crosshairThrottle = null;
      }, throttle);
    }
  }

  hoverPopupHandler(timeout: number) {
    let popupData: PopupData = {
      popupTimer: null,
      highlightedCell: null,
      popup: null
    };

    return (position: L.LatLng) => {
      clearTimeout(popupData.popupTimer);
      if(popupData.highlightedCell != null) {
        this.map.removeLayer(popupData.highlightedCell);
        popupData.highlightedCell = null;
      }
      //close current hover popup if exists
      if(popupData.popup != null) {
        this.map.closePopup(popupData.popup);
        popupData.popup = null;
      }
      //if position is null mouse moved out of map
      if(position == null) {
        return;
      }
      this.crosshairHandler(position, 20);
      popupData.popupTimer = setTimeout(() => {
        let header = this.active.data.raster.getHeader();
        let data = this.active.data.raster.getBands()[this.active.band];
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

          let labels = this.getValueLabels(value);
          let valueLabel = labels.join("<br>");

          //popup cell value
          popupData.popup = L.popup({ autoPan: false })
          .setLatLng(position);
          let content = `${valueLabel}<br>`;
          popupData.popup.setContent(content);
          popupData.popup.openOn(this.map);
        }
      }, timeout);
    }

  }


  ngOnInit() {
    this.paramService.createParameterHook(EventParamRegistrarService.EVENT_TAGS.viewType, (viewType: string) => {
      this._viewType = viewType;
    });
  }

  initMarkerInfo() {
    this.markerInfo = {
      markers: [],
      layer: null,
      pivotZoom: 10,
      weightToRadiusFactor: 0.4,
      pivotRadius: 7,
      markerMap: new Map<SiteInfo, L.CircleMarker>()
    }
  }

  //why is this called three times at init?
  constructMarkerLayerPopulateMarkerData(stations: SiteInfo[]): void {
    if(this.markerInfo.layer) {
      this.map.removeLayer(this.markerInfo.layer);
      this.layerController.removeLayer(this.markerInfo.layer);
    }
    if(stations !== null) {
      let markers: RainfallStationMarker[] = [];
      this.markerInfo.markerMap.clear();
      let markerLayer = L.layerGroup();
      stations.forEach((station: SiteInfo) => {
        let hexFill = "#ffffff";
        if(this.colorScheme) {
          hexFill = this.colorScheme.getColorHex(station.value);
        }

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
        markerLayer.addLayer(marker);
        let stationMarker: RainfallStationMarker = {
          marker: marker,
          value: station.value
        }
        markers.push(stationMarker);
      });

      this.markerInfo.markers = markers;

      //adjust markers
      this.updateMarkers();


      this.markerInfo.layer = markerLayer;
      this.layerController.addOverlay(markerLayer, "Data Stations");
      this.map.addLayer(markerLayer);
    }
  }

  getMarkerPopupText(station: any): string {
    let labels = this.getCoordAndValueLabels(station);
    let valuesLabel = labels.valueLabels.join(", ");
    let stationDetails: string = "Name: " + station.name
    + "<br> Station ID: " + station[station.id_field]
    + "<br> Lat: " + labels.lat + ", Lon: " + labels.lng
    + `<br> Value: ${valuesLabel}`;
    return stationDetails;
  }

  getCoordAndValueLabels(station) {
    let lat = Math.round(station.lat * 100) / 100;
    let lng = Math.round(station.lng * 100) / 100;
    let valueLabels = this.getValueLabels(station.value);
    return {
      lat,
      lng,
      valueLabels
    };
  }

  getValueLabels(value): string[] {
     //TEMP translations
     let translations = {
      mm: {
        f: (value: number) => {
          return value / 25.4;
        },
        translationUnit: "in"
      },
      "°C": {
        f: (value: number) => {
          return (value * (9 / 5)) + 32;
        },
        translationUnit: "°F"
      }
    };

    //TEMP WORKAROUNDS
    let unit = this._viewType == "percent" ? "%" : this.dataset.unitsShort;
    let valueLabels = [];

    let roundedValue = Math.round(value * 100) / 100;
    let valueLabel = `${roundedValue.toLocaleString()}${unit}`;
    valueLabels.push(valueLabel);

    let translationData = translations[unit];
    if((unit == "mm" || !this._viewType || this._viewType == "direct") && translationData) {
      let translationValue = translationData.f(value);
      let translationUnit = translationData.translationUnit;
      let roundedTranslationValue = Math.round(translationValue * 100) / 100;
      let translatedValueLabel = `${roundedTranslationValue.toLocaleString()}${translationUnit}`;
      valueLabels.push(translatedValueLabel);
    }
    return valueLabels;
  }

  updateMarkers(): void {
    let markers = this.markerInfo.markers;
    let sizingData = this.getMarkerSizing();
    for(let marker of markers) {
      marker.marker.setStyle({weight: sizingData.weight});
      marker.marker.setRadius(sizingData.radius);
    }
  }




//   marker.marker.setStyle({weight: weight});
  //marker.marker.setRadius(radius);



  getMarkerSizing() {
    let radius: number;
    let zoom = this.map.getZoom();
    //scaled
    if(zoom < this.markerInfo.pivotZoom) {
      let scale = this.map.getZoomScale(this.map.getZoom(), this.markerInfo.pivotZoom);
      radius = this.markerInfo.pivotRadius * scale;
    }
    //static
    else {
      radius = this.markerInfo.pivotRadius;
    }
    let weight = radius * this.markerInfo.weightToRadiusFactor;
    return {
      radius: radius,
      weight: weight
    };
  }
}

//weight 5% radius?
interface RainfallStationMarkerInfo {
  markers: RainfallStationMarker[],
  layer: L.LayerGroup,
  pivotZoom: number,
  weightToRadiusFactor: number,
  pivotRadius: number,
  markerMap: Map<SiteInfo, L.CircleMarker>
}

interface RainfallStationMarker {
  marker: L.CircleMarker,
  value: number
}

interface ActiveData {
  data: DataPack,
  band: string
}

interface DataPack {
  stations: SiteInfo[],
  raster: RasterData,
  focus: FocusData<unknown>
}

interface PopupData {
  popupTimer: any,
  highlightedCell: L.Layer,
  popup: L.Popup
}





