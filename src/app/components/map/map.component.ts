import { Component, OnInit, ViewChild, ElementRef, Input } from '@angular/core';
import * as L from "leaflet";
import "leaflet-spin";
import { ColorScale } from "../../models/colorScale";
import { DataRetreiverService } from "../../services/util/data-retreiver.service";
import { LeafletRasterLayerService, R, RasterOptions } from "../../services/rasterLayerGeneration/leaflet-raster-layer.service";
import { EventParamRegistrarService, LoadingData, ParameterHook } from "../../services/inputManager/event-param-registrar.service"
import "leaflet-groupedlayercontrol";
import { RasterData } from 'src/app/models/RasterData.js';
import { RoseControlOptions } from '../leaflet-controls/leaflet-compass-rose/leaflet-compass-rose.component';
import { LeafletLayerControlExtensionComponent } from '../leaflet-controls/leaflet-layer-control-extension/leaflet-layer-control-extension.component';
import { AssetManagerService } from 'src/app/services/util/asset-manager.service';
import { VisDatasetItem, FocusData } from 'src/app/services/dataset-form-manager.service';
import { DataManagerService } from 'src/app/services/dataManager/data-manager.service';
import { MapLocation, Station, V_Station } from 'src/app/models/Stations';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss']
})
export class MapComponent implements OnInit {

  @Input() imageContainer: ElementRef;

  @ViewChild("mapElement", {static: false}) mapElement: ElementRef;
  @ViewChild("layerController", {static: true}) layerController: LeafletLayerControlExtensionComponent;

  readonly extents: {[county: string]: L.LatLngBoundsExpression} = {
    ka: [ [ 21.819, -159.816 ], [ 22.269, -159.25125 ] ],
    oa: [ [ 21.18, -158.322 ], [ 21.7425, -157.602 ] ],
    ma: [ [ 20.343, -157.35 ], [ 21.32175, -155.92575 ] ],
    bi: [ [ 18.849, -156.243 ], [ 20.334, -154.668 ] ],
    st: [ [ 18.849, -159.816 ], [ 22.269, -154.668 ] ],
    bounds: [ [14.050369038588524, -167.60742187500003], [26.522031143884014, -144.47021484375003] ]
  };
  //private R: any = L;

  selectedMapCell: L.Layer;
  imageHiddenControls = ["leaflet-control-zoom", "leaflet-control-layers", "leaflet-control-export"];
  markerInfo: RainfallStationMarkerInfo;
  colorScheme: ColorScale;
  roseOptions: RoseControlOptions;
  options: L.MapOptions;

  map: L.Map;
  private baseLayers: any;
  active: ActiveData;
  private dataLayers: {
    [band: string]: any
  };
  hoverHook: ParameterHook;
  private rasterLayerActive: boolean = false;
  private hoverData: HoverData = {
    popupTimer: null,
    crosshairTimer: null,
    highlightedCell: null,
    popup: null
  };

  private selectedMarker: L.CircleMarker;
  private newSelection: boolean;
  private markerPopupOpen: boolean;

  dataset: VisDatasetItem;
  selectedLocation: MapLocation;

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
    this.newSelection = true;

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
      this.suspendHover();
    });

    this.map.on("moveend", () => {
      let bounds: L.LatLngBounds = this.map.getBounds();
      this.paramService.pushMapBounds(bounds);
      this.resumeHover();
    });

    this.map.on("click", (e: L.LeafletMouseEvent) => {
      this.mapClickHandler(e.latlng);
    });

    //set timeout to prevent issues with map not propogating to overlay extension
    setTimeout(() => {
      //want filtered, should anything be done with the unfiltered stations? gray them out or just exclude them? can always change
      this.paramService.createParameterHook(EventParamRegistrarService.EVENT_TAGS.filteredStations, (stations: Station[]) => {
        if(this.selectedMarker) {
          this.markerPopupOpen = this.selectedMarker.isPopupOpen();
        }
        else {
          this.markerPopupOpen = false;
        }
        this.active.data.stations = stations;
        this.constructMarkerLayerPopulateMarkerData(stations);
        if(this.selectedLocation?.type == "station") {
          let newMarker = this.markerInfo.markerMap[(<Station>this.selectedLocation).id];
          if(newMarker) {
            this.newSelection = false;
            newMarker.fire("click");
          }
        }
      });
    }, 0);



    this.layerController.addLayers(this.baseLayers);

    this.paramService.createParameterHook(EventParamRegistrarService.EVENT_TAGS.dataset, (dataset: VisDatasetItem) => {
      this.dataset = dataset;
    });

    //install hover handler (requires raster to be set to work, start disabled)
    let hoverTag = this.paramService.registerMapHover(this.map);
    this.hoverHook = this.paramService.createParameterHook(hoverTag, this.hoverPopupHandler(1000), false);
    this.paramService.createParameterHook(EventParamRegistrarService.EVENT_TAGS.raster, (raster: RasterData) => {
      for(let band in this.dataLayers) {
        this.map.removeLayer(this.dataLayers[band]);
        this.layerController.removeLayer(this.dataLayers[band]);
      }
      this.dataLayers = {};
      this.active.data.raster = raster;

      //no raster for dataset, remove layers
      if(this.rasterLayerActive && raster === null) {
        this.rasterLayerActive = false;
        this.suspendHover();
      }
      else if(raster !== null) {
        let bands = raster.getBands();
        let header = raster.getHeader();
        //create new bands
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
          this.dataLayers[band] = rasterLayer;
          rasterLayer.setOpacity(this.opacity);
        }
        if(!this.rasterLayerActive) {
          this.rasterLayerActive = true;
          this.resumeHover();
        }
        
        let activeLayer = this.dataLayers[this.active.band];
        //assume everything has a band 0 and use as default
        if(activeLayer === undefined) {
          activeLayer = this.dataLayers["0"];
        }
        this.map.addLayer(activeLayer);
        //for now at least only one layer, make sure to replace if multiple
        this.layerController.addOverlay(activeLayer, "Data Map");

        if(this.selectedLocation?.type == "virtual_station") {
          this.newSelection = false;
          this.mapClickHandler(this.selectedLocation.location);
        }
      }
    });


    this.paramService.createParameterHook(EventParamRegistrarService.EVENT_TAGS.selectedLocation, (location: MapLocation) => {
      this.selectedLocation = location;
      this.selectLocation(location);
    });

    this.map.on("layeradd", (addData: any) => {
      let layer = addData.layer;
      if(layer.options && layer.options.maxZoom) {
        this.map.setMaxZoom(layer.options.maxZoom);
      }
    });

    this.invalidateSize()
  }

  selectLocation(location: MapLocation) {
    //only open the popup if this is a new selection or the popup was already open
    let openPopup: boolean = this.newSelection;
    if(this.selectedMapCell) {
      openPopup = openPopup || this.selectedMapCell.isPopupOpen();
      this.map.removeLayer(this.selectedMapCell);
      this.selectedMapCell = null;
    }
    else {
      openPopup = openPopup || this.markerPopupOpen;
    }
    if(location) {
      if(location.type == "station") {
        let station = <Station>location;
        this.selectStation(station, openPopup);
      }
      else if(location.type == "virtual_station") {
        let virtualStation = <V_Station>location;
        this.selectVStation(virtualStation, openPopup);
      }
      //only pan if this is a new selection (not after new raster or station set with same location)
      if(this.newSelection) {
        this.map.panTo(location.location, {animate: true});
      }
    }
    this.newSelection = true;
  }

  
  selectVStation(virtualStation: V_Station, openPopup: boolean) {
    let geojson: any = this.dataRetreiver.getGeoJSONCellFromBounds(virtualStation.cellData.cellExtent);
    if(geojson) {
      this.selectedMapCell = L.geoJSON(geojson)
      .setStyle({
        fillColor: "black",
        weight: 3,
        opacity: 1,
        color: "black",
        fillOpacity: 0.2
      })
      .bindPopup(this.getPopupText(virtualStation), { autoPan: false, autoClose: false })
      .addTo(this.map);
      if(openPopup) {
        this.selectedMapCell.openPopup();
      }
    }
  }

  selectStation(station: Station, openPopup: boolean) {
    if(this.selectedMapCell != null) {
      this.map.removeLayer(this.selectedMapCell);
      this.selectedMapCell = null;
    }

    if(station) {
      let marker: L.CircleMarker = this.markerInfo.markerMap[station.id];
      //ignore if station doesn't exist
      if(marker) {
        if(this.selectedMarker?.isPopupOpen()) {
          this.selectedMarker.closePopup();
        }
        if(openPopup) {
          //popup sometimes still closes when moving mouse for some reason, but this helps some
          //moveend isn't always triggered when finished, so use this as a fallback
          setTimeout(() => {
            if(!marker.isPopupOpen() && this.selectedMarker === marker) {
              marker.openPopup();
            }
          }, 300);
          //use as callback to animation end, otherwise movement bugs the popup and it immediately closes
          //think something about it already moving interferes with the popup repositioning
          this.map.once("moveend", () => {
            if(!marker.isPopupOpen() && this.selectedMarker === marker) {
              marker.openPopup();
            }
          });
        }
      }
      this.selectedMarker = marker;
    }
  }

  crosshairHandler(position: L.LatLng, throttle: number) {
    if(!this.hoverData.crosshairTimer) {
      this.hoverData.crosshairTimer = setTimeout(() => {
        let header = this.active.data.raster.getHeader();
        let data = this.active.data.raster.getBands()[this.active.band];
        let value = this.dataRetreiver.geoPosToGridValue(header, data, position);
        if(value !== undefined) {
          L.DomUtil.addClass(this.mapElement.nativeElement, 'cursor-crosshair');
        }
        else {
          L.DomUtil.removeClass(this.mapElement.nativeElement, 'cursor-crosshair');
        }
        this.hoverData.crosshairTimer = null;
      }, throttle);
    }
  }

  hoverPopupHandler(timeout: number) {
    return (position: L.LatLng) => {
      clearTimeout(this.hoverData.popupTimer);
      if(this.hoverData.highlightedCell != null) {
        this.map.removeLayer(this.hoverData.highlightedCell);
        this.hoverData.highlightedCell = null;
      }
      //close current hover popup if exists
      if(this.hoverData.popup != null) {
        this.map.closePopup(this.hoverData.popup);
        this.hoverData.popup = null;
      }
      //if position is null mouse moved out of map
      if(position == null) {
        return;
      }
      this.crosshairHandler(position, 20);
      this.hoverData.popupTimer = setTimeout(() => {
        let header = this.active.data.raster.getHeader();
        let data = this.active.data.raster.getBands()[this.active.band];
        let geojson = this.dataRetreiver.getGeoJSONCellFromGeoPos(header, data, position);
        //check if data exists at hovered point
        if(geojson != undefined) {
          this.hoverData.highlightedCell = L.geoJSON(geojson)
          .setStyle({
            fillColor: "orange",
            weight: 3,
            opacity: 1,
            color: "orange",
            fillOpacity: 0.2
          })
          .addTo(this.map);

          let value = this.dataRetreiver.geoPosToGridValue(header, data, position);

          let labels = this.getValueLabels(value);
          let valueLabel = labels.join("<br>");

          //popup cell value
          this.hoverData.popup = L.popup({ autoPan: false })
          .setLatLng(position);
          let content = `${valueLabel}<br>`;
          this.hoverData.popup.setContent(content);
          this.hoverData.popup.openOn(this.map);
        }
      }, timeout);
    }
  }

  mapClickHandler(position: L.LatLng) {
    if(this.active.data.raster) {
      let header = this.active.data.raster.getHeader();
      let data = this.active.data.raster.getBands()[this.active.band];
      let geojson = this.dataRetreiver.getGeoJSONCellFromGeoPos(header, data, position);
      let coords = this.dataRetreiver.geoPosToGridCoords(header, position);
      let value = this.dataRetreiver.geoPosToGridValue(header, data, position);
      let bounds = this.dataRetreiver.getCellBoundsFromGeoPos(header, data, position);
      //check if data exists at clicked point
      if(geojson !== null) {
        let dimensions = this.dataRetreiver.getBoundsWidthHeight(bounds);
        let virtualStation: V_Station = new V_Station(value, this.dataset.units, this.dataset.unitsShort, {
          row: coords.y,
          col: coords.x,
          cellWidthM: dimensions.width,
          cellHeightM: dimensions.height,
          cellWidthLng: header.cellXSize,
          cellHeightLat: header.cellYSize,
          cellExtent: bounds
        }, position);
        
        this.paramService.pushSelectedLocation(virtualStation);
      }
    }
  }


  ngOnInit() {

  }

  initMarkerInfo() {
    this.markerInfo = {
      markers: [],
      layer: null,
      pivotZoom: 10,
      weightToRadiusFactor: 0.4,
      pivotRadius: 7,
      markerMap: {}
    }
  }


  constructMarkerLayerPopulateMarkerData(stations: Station[]): void {
    if(this.markerInfo.layer) {
      this.map.removeLayer(this.markerInfo.layer);
      this.layerController.removeLayer(this.markerInfo.layer);
    }
    if(stations !== null) {
      let markers: RainfallStationMarker[] = [];
      this.markerInfo.markerMap = {};
      let markerLayer = L.layerGroup();
      stations.forEach((station: Station) => {
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

        let stationDetails = this.getPopupText(station);
        marker.bindPopup(stationDetails, { autoPan: false, autoClose: false});
        marker.on("click", () => {
          this.paramService.pushSelectedLocation(station);
        });
        this.markerInfo.markerMap[station.id] = marker;
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

  getPopupText(location: MapLocation) {
    let format = location.format;
    let labels = this.getValueLabels(location.value);
    let valuesLabel = labels.join(", ");
    let posLabel = `Lat: ${format.getFieldFormat("lat").formattedValue}, Lon: ${format.getFieldFormat("lng").formattedValue}`;
    let popupText = `${posLabel} <br> Value: ${valuesLabel}`;
    if(location.type == "station") {
      let station = <Station>location;
      let stationInfoText = `Name: ${station.metadata.getValue("name")} <br> Station ID: ${station.id} <br> `
      popupText = `<h4>Station</h4>${stationInfoText}${popupText}`;
    }
    else {
      popupText = `<h4>Virtual Station</h4>${popupText}`;
    }
    return popupText;
  }

  //move this to station format data
  getValueLabels(value: number): string[] {
     //TEMP translations
     let translations = {
      mm: {
        f: (value: number) => {
          return value / 25.4;
        },
        translationUnit: "in"
      },
      in: {
        f: (value: number) => {
          return value * 25.4;
        },
        translationUnit: "mm"
      },
      "°C": {
        f: (value: number) => {
          return (value * (9 / 5)) + 32;
        },
        translationUnit: "°F"
      },
      "°F": {
        f: (value: number) => {
          return (value - 32) * (5 / 9);
        },
        translationUnit: "°C"
      }
    };

    //TEMP WORKAROUNDS
    let unit = this.dataset.unitsShort;
    let valueLabels = [];

    let roundedValue = Math.round(value * 100) / 100;
    let valueLabel = `${roundedValue.toLocaleString()}${unit}`;
    valueLabels.push(valueLabel);

    let translationData = translations[unit];
    if(this.dataset.displayStyle == "standard" && translationData) {
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

  suspendHover() {
    //uninstall the hover hook if it exists
    if(this.hoverHook) {
      this.hoverHook.uninstall();
    }
    //remove the crosshair pointer class
    L.DomUtil.removeClass(this.mapElement.nativeElement, 'cursor-crosshair');
    //clear the hover timeouts and reset to null
    clearTimeout(this.hoverData.crosshairTimer);
    this.hoverData.crosshairTimer = null;
    clearTimeout(this.hoverData.popupTimer);
    this.hoverData.popupTimer = null;
  }

  resumeHover() {
    //if the raster layer is active then install the hover hook, otherwise do nothing
    if(this.rasterLayerActive) {
      this.hoverHook.install();
    }
  }
}

//weight 5% radius?
interface RainfallStationMarkerInfo {
  markers: RainfallStationMarker[],
  layer: L.LayerGroup,
  pivotZoom: number,
  weightToRadiusFactor: number,
  pivotRadius: number,
  markerMap: {[stationID: string]: L.CircleMarker}
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
  stations: Station[],
  raster: RasterData,
  focus: FocusData<unknown>
}

interface HoverData {
  crosshairTimer: NodeJS.Timeout,
  popupTimer: NodeJS.Timeout,
  highlightedCell: L.Layer,
  popup: L.Popup
}





