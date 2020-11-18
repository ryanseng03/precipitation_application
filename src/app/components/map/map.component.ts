import { Component, OnInit, ViewChild, ElementRef, OnChanges, Input } from '@angular/core';
import * as L from "leaflet";
import "leaflet-spin";
import * as chroma from "chroma-js";
import {saveAs} from "file-saver";
import * as geotiff from "geotiff";
import { Color, ColorScale } from "../../models/colorScale";
import { ColorGeneratorService } from "../../services/rasterLayerGeneration/color-generator.service";
import { DataRetreiverService } from "../../services/utility/data-retreiver.service";
import { R, RasterOptions, LeafletRasterLayerService } from "../../services/rasterLayerGeneration/leaflet-raster-layer.service";
import { EventParamRegistrarService, ParameterHook } from "../../services/inputManager/event-param-registrar.service"
import "leaflet-groupedlayercontrol";
import { BandData, IndexedValues, RasterHeader, RasterData } from 'src/app/models/RasterData.js';
import { SiteMetadata, SiteInfo } from 'src/app/models/SiteMetadata.js';
import "leaflet.markercluster";
import {first, min} from "rxjs/operators";
import {DataManagerService} from "../../services/dataManager/data-manager.service";

//type workaround, c contains plugin controls, typed as any so won't give error due to type constraints not being in leaflet typedef
let C: any = L.control;

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss']
})
export class MapComponent implements OnInit {

  @ViewChild("map") mapElement: ElementRef;

  readonly extents: {[county: string]: L.LatLngBoundsExpression} = {
    ka: [ [ 21.819, -159.816 ], [ 22.269, -159.25125 ] ],
    oa: [ [ 21.18, -158.322 ], [ 21.7425, -157.602 ] ],
    ma: [ [ 20.343, -157.35 ], [ 21.32175, -155.92575 ] ],
    bi: [ [ 18.849, -156.243 ], [ 20.334, -154.668 ] ],
    st: [ [ 18.849, -159.816 ], [ 22.269, -154.668 ] ],
    bounds: [ [14.050369038588524, -167.60742187500003], [26.522031143884014, -144.47021484375003] ]
  };
  //private R: any = L;

  markerInfo: RainfallStationMarkerInfo;
  // markerClusterLayer: any;

  options: L.MapOptions
  // private drawnItems: L.FeatureGroup;
  // private drawOptions: any;
  private map: L.Map;
  private baseLayers: any;
  private active: ActiveData;
  private dataLayers: {
    [band: string]: any
  };

  private layerLabelMap: TwoWayLabelMap;

  private selectedMarker: L.CircleMarker;



  constructor(private dataManager: DataManagerService, private paramService: EventParamRegistrarService, private dataRetreiver: DataRetreiverService, private colors: ColorGeneratorService, private rasterLayerService: LeafletRasterLayerService) {
    dataManager.setMap(this);
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
      layers: this.baseLayers.Satellite,
      zoom: 7,
      center: L.latLng(20.5, -157.917480),
      attributionControl: false,
      // zoomSnap: 0.01,
      // wheelPxPerZoomLevel: 200,
      minZoom: 6,
      maxZoom: 18,
      maxBounds: this.extents.bounds
    };

    // this.drawnItems = new L.FeatureGroup;

    // this.drawOptions = {
    //   position: 'topleft',
    //   draw: {
    //      polyline: false,
    //      circle: false,
    //      marker: false,
    //      circlemarker: false
    //   },
    //   edit: {
    //     featureGroup: this.drawnItems
    //   }
    // };

    // L.Icon.Default.mergeOptions({
    //   iconRetinaUrl: "/assets/marker-icon-2x.png",
    //   iconUrl: "/assets/marker-icon.png",
    //   shadowUrl: "/assets/marker-shadow.png"
    // });

    // const iconRetinaUrl = '/assets/marker-icon-2x.png';
    // const iconUrl = '/assets/marker-icon.png';
    // const shadowUrl = '/assets/marker-shadow.png';
    // const iconDefault = L.icon({
    //   iconRetinaUrl,
    //   iconUrl,
    //   shadowUrl,
    //   iconSize: [25, 41],
    //   iconAnchor: [12, 41],
    //   popupAnchor: [1, -34],
    //   tooltipAnchor: [16, -28],
    //   shadowSize: [41, 41]
    // });
    // L.Marker.prototype.options.icon = iconDefault;

    //don't want popup to be force closed when another one appears
    // L.Map.prototype.openPopup = function(popup) {
    //   this._popup = popup;

    //   return this.addLayer(popup).fire('popupopen', {
    //     popup: this._popup
    //   });
    // }

    delete (L.Icon.Default.prototype as any)._getIconUrl;

    L.Icon.Default.mergeOptions({
      iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
      iconUrl: require('leaflet/dist/images/marker-icon.png'),
      shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
    });
  }

  // markerLimits = {
  //   radius: {
  //     min: 5,
  //     max: 20
  //   },
  //   zoom: 10
  // };
  // zoomPivot = 10;
  // setMarkerData() {
  //   let zoom = this.map.getZoom();
  //   let scale = this.map.getZoomScale(this.markerInfo.oldZoom, zoom);
  //   this.markerInfo.oldZoom = zoom;
  //   let limitScale = this.map.getZoomScale(zoom, this.markerLimits.zoom);
  //   let scaledRadiusMin = this.markerLimits.radius.min * limitScale;
  //   let scaledRadiusMax = this.markerLimits.radius.max * limitScale;
  //   if(zoom < this.zoomPivot) {
  //     for(let marker of this.markerInfo.markers) {
  //       marker.metadata.scaledRadius *= scale;
  //       let radius = marker.metadata.scaledRadius;
  //       marker.marker.setRadius(radius);
  //       this.markerInfo.weight *= scale;
  //       let weight = this.markerInfo.weight;
  //       marker.marker.setStyle({weight: weight});
  //     }
  //   }
  //   else {
  //     for(let marker of this.markerInfo.markers) {

  //       let radius = ;
  //       marker.metadata.scaledRadius *= scale;
  //     }
  //   }
  // }


  invalidateSize() {
    this.map.invalidateSize();
  }

  focusedBoundary = null
  focusSpatialExtent(extent: string) {
    // if(this.markerClusterLayer) {
    //   this.map.removeLayer(this.markerClusterLayer);
    // }
    this.clearExtent();
    let bounds: L.LatLngBoundsExpression = this.extents[extent];
    this.map.flyToBounds(bounds);
    let boundary = L.rectangle(bounds, {weight: 2, fillOpacity: 0});
    boundary.addTo(this.map);
    this.focusedBoundary = boundary;
    // if(this.markerClusterLayer) {
    //   this.map.addLayer(this.markerClusterLayer);
    // }
  }

  clearExtent() {
    if(this.focusedBoundary != null) {
      this.map.removeLayer(this.focusedBoundary);
    }
  }


  setOpacity(opacity: number) {
    let layer: L.GridLayer = this.dataLayers[this.active.band];
    if(layer) {
      layer.setOpacity(opacity);
    }
  }

  layerReady(): boolean {
    return this.dataLayers[this.active.band] != undefined;
  }

  rasterOptions: RasterOptions

  setColorScheme(scheme: string) {
    let layer: any = this.dataLayers[this.active.band];
    if(layer) {
      let colorScheme: ColorScale;
      switch(scheme) {
        case "mono": {
          colorScheme = this.colors.getDefaultMonochromaticRainfallColorScale();
          break;
        }
        case "rainbow": {
          colorScheme = this.colors.getDefaultRainbowRainfallColorScale();
          break;
        }
      }
      layer.setColorScale(colorScheme);
    }

  }

  //spin seems to already have an internal counter, neat
  setLoad(load: boolean) {
    if(load) {
      (<any>this.map).spin(true, {color: "white", length: 20});
    }
    else {
      (<any>this.map).spin(false);
    }
  }

  onMapReady(map: L.Map) {
    this.initMarkerInfo();

    // setInterval(() => {
    //   map.invalidateSize();
    // }, 1000);

    L.DomUtil.addClass(map.getContainer(), 'pointer-cursor')
    L.control.scale({position: 'bottomleft'}).addTo(map);



    this.map = map;

    //!!
    //arrow functions lexically bind this (bind to original context)
    //have to use "function()" syntax if new context


    let colorScale: ColorScale = this.colors.getDefaultMonochromaticRainfallColorScale();
    //let colorScale: ColorScale = this.colors.getDefaultRainbowRainfallColorScale();




    this.active = {
      data: {
        sites: null,
        raster: null,
        date: null
      },
      band: "rainfall",
    };


    // let layerGroups = {
    //   Types: {}
    // };

    // let clusterOptions = {
    //   //chunkedLoading: true
    // };
    //provides minimum radius at a specific scale
    let pivotZoom = 10;
    let minRadiusInfo = [5, 10];
    this.map.on("zoomend", () => {
      // let zoom = this.map.getZoom();
      // console.log(zoom);
      // let scale = this.map.getZoomScale(zoom, this.markerInfo.oldZoom);
      // let minRadiusScale = this.map.getZoomScale(zoom, minRadiusInfo[1]);
      // let minRadius = minRadiusScale * minRadiusInfo[0]
      // this.markerInfo.oldZoom = zoom;
      // console.log(scale);
      // this.markerInfo.weight *= scale;
      // for(let marker of this.markerInfo.markers) {
      //   let radius = marker.marker.getRadius();
      //   let weight = this.markerInfo.weight;
      //   let scaledRadius = marker.metadata.scaledRadius * scale;
      //   if(zoom < pivotZoom) {
      //     radius = Math.max(scaledRadius, minRadius);
      //   }
      //   else {
      //     let pivotScale = this.map.getZoomScale(zoom, pivotZoom)
      //     radius *= pivotScale;
      //     radius = Math.max(radius, minRadius);
      //   }
      //   marker.marker.setRadius(radius);
      //   marker.marker.setStyle({weight: weight});
      //   marker.metadata.scaledRadius = scaledRadius;
      // }
      this.updateMarkers();
    });

    //let markerMap: Map<SiteInfo, L.CircleMarker> = new Map<SiteInfo, L.CircleMarker>();
    //let siteMarkers = R.markerClusterGroup(clusterOptions);
    //this.markerClusterLayer = siteMarkers;
    //generate parameter hooks to update visualizations


    //want filtered, should anything be done with the unfiltered sites? gray them out or just exclude them? can always change
    let siteHook: ParameterHook = this.paramService.createParameterHook(EventParamRegistrarService.GLOBAL_HANDLE_TAGS.filteredSites, (sites: SiteInfo[]) => {
      this.active.data.sites = sites;

      /////!!!!>..

      this.constructMarkerLayerPopulateMarkerData(sites);
      //console.log(sites);
      //map.addLayer(markerLayer);
    });

    let lc = C.layers(this.baseLayers);
    lc.addTo(map);

    let rasterHook = this.paramService.createParameterHook(EventParamRegistrarService.GLOBAL_HANDLE_TAGS.raster, (raster: RasterData) => {

      this.active.data.raster = raster;
      let bands = raster.getBands();
      let header = raster.getHeader();
      for(let band in bands) {
        this.rasterOptions = {
          cacheEmpty: true,
          colorScale: colorScale,
          data: {
            header: header,
            values: bands[band]
          }
        };
        let rasterLayer = R.gridLayer.RasterLayer(this.rasterOptions);
        //layerGroups.Types[this.layerLabelMap.getLabel(band)] = rasterLayer;
        this.dataLayers[band] = rasterLayer;
      }
      //add rainfall layer to map as default
      map.addLayer(this.dataLayers["rainfall"]);

      //for now at least only one layer, make sure to replace if multiple
      lc.addOverlay(this.dataLayers["rainfall"], "Rainfall");

      //install hover handler (requires raster to be set to work)
      let hoverTag = this.paramService.registerMapHover(map);
      let hoverHook = this.paramService.createParameterHook(hoverTag, this.hoverPopupHandler(1000));

      //uninstall current hook and replace with update hook that updates raster
      rasterHook.uninstall();
      rasterHook = this.paramService.createParameterHook(EventParamRegistrarService.GLOBAL_HANDLE_TAGS.raster, (raster: RasterData) => {
        this.active.data.raster = raster;
        bands = raster.getBands();
        //set layer data
        for(let band in bands) {
          let values = bands[band];
          this.dataLayers[band].setData(values);
        }
      });

    });

    let selectedSiteHook = this.paramService.createParameterHook(EventParamRegistrarService.GLOBAL_HANDLE_TAGS.selectedSite, (site: SiteInfo) => {
      let marker: L.CircleMarker = this.markerInfo.markerMap.get(site);

      //siteMarkers.zoomToShowLayer(marker, () => {
      if(this.selectedMarker !== undefined && this.selectedMarker.isPopupOpen()) {
        this.selectedMarker.closePopup();
      }
      this.map.panTo(site.location, {animate: true});
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
      //});


    });

    let dateHook = this.paramService.createParameterHook(EventParamRegistrarService.GLOBAL_HANDLE_TAGS.date, (date: string) => {
      this.active.data.date = date;
    });


    // C.RemoveAll = L.Control.extend(
    //   {
    //       options:
    //       {
    //           position: 'topright',
    //       },
    //       onAdd: function (map) {
    //           var controlDiv = L.DomUtil.create('div', 'leaflet-draw-toolbar leaflet-bar');

    //           var controlUI = L.DomUtil.create('app-navbar', "", controlDiv);
    //           controlUI.title = 'Remove All Polygons';
    //           return controlDiv;
    //       }
    //   });
    //   var removeAllControl = new C.RemoveAll();
    //   map.addControl(removeAllControl);

    // let layerGroupControlOptions = {
    //   exclusiveGroups: ["Types"],
    //   groupCheckboxes: true
    // };




    this.setBaseLayerHandlers();

    map.on("baselayerchange", () => {

    });

  }



  setBaseLayerHandlers() {
    this.map.on('overlayadd', (e: L.LayersControlEvent) => {
      //set layer to type any
      //let layer: any = e.layer;
      this.active.band = e.name.toLowerCase();
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

  // setDrawingHandlers() {
  //   this.map.on(L.Draw.Event.CREATED, (e: any) => {
  //     let geojson = e.layer.toGeoJSON();
  //     console.log(geojson);
  //     //console.log(this.dataRetreiver.getGeoJSONBoundingBox(geojson));
  //   });
  // }

  ngOnInit() {

  }


  initMarkerInfo() {
    this.markerInfo = {
      markers: [],
      layer: null,
      pivotZoom: 10,
      weightToRadiusFactor: 0.05,
      markerMap: new Map<SiteInfo, L.CircleMarker>()
    }
  }

  constructMarkerLayerPopulateMarkerData(sites: SiteInfo[]): void {
    let markers: RainfallStationMarker[] = [];
    this.markerInfo.markerMap.clear();

    let markerLayer = L.layerGroup();
    sites.forEach((site: SiteInfo) => {
      // //troubleshooting markers not appearing
      // if(site.location.lat < this.options.maxBounds[0][0] || site.location.lat > this.options.maxBounds[1][0]
      // || site.location.lng < this.options.maxBounds[0][1] || site.location.lng > this.options.maxBounds[1][1]) {
      //   console.log("OOB!", site.location.lat, site.location.lng);
      // }
      //let polyMarker = L.circle([site.location.lat, site.location.lng], {radius: (site.value + 1) * 1000});
      //polyMarkerLayer.addLayer(polyMarker);
      let radius = this.getMarkerRadiusAtPivot(site);

      let marker = L.circleMarker(site.location, {radius: radius});

      let siteDetails = this.getMarkerPopupText(site);
      marker.bindPopup(siteDetails, { autoPan: false, autoClose: false});
      marker.on("click", () => {
        this.paramService.pushSiteSelect(site);
      });
      this.markerInfo.markerMap.set(site, marker);
      //console.log(siteDetails);
      markerLayer.addLayer(marker);
      let stationMarker: RainfallStationMarker = {
        marker: marker,
        metadata: {
          pivotRadius: radius
        }
      }
      this.markerInfo.markers.push(stationMarker)

    });

    //adjust markers
    this.updateMarkers();

    this.markerInfo.markers = markers;

    if(this.markerInfo.layer) {
      //siteMarkers.removeLayers(this.markers);
      this.map.removeLayer(this.markerInfo.layer);
    }
    this.markerInfo.layer = markerLayer;

    //console.log(markers);
    //siteMarkers.addLayers(markers);
    //console.log(siteMarkers);
    this.map.addLayer(markerLayer);
  }

  getMarkerPopupText(site: SiteInfo): string {
    let siteDetails: string = "Name: " + site.name
    + "<br> Network: " + site.network
    + "<br> Lat: " + site.lat + ", Lng: " + site.lng
    + `<br> Value: ${Math.round(site.value * 100) / 100}mm`
    + `, ${Math.round((site.value / 25.4) * 100) / 100}in`;
    return siteDetails;
  }

  updateMarkers(): void {
    let zoom = this.map.getZoom();
    let markers = this.markerInfo.markers;
    if(zoom < this.markerInfo.pivotZoom) {
      for(let marker of markers) {
        this.setScaledMarkerRadius(marker);
        this.setMarkerWeight(marker);
      }
    }
    else {
      for(let marker of markers) {
        this.setMarkerWeight(marker);
      }
    }
  }


  getMarkerRadiusAtPivot(site: SiteInfo): number {
    let min = 5;
    let max = 20;
    let radius = site.value / 50;
    radius = Math.max(radius, min);
    radius = Math.min(radius, max);
    return radius;
    // if(site.value > 1) {
    //   radius += Math.log(site.value) / Math.log(1.5);
    // }

  }

  setScaledMarkerRadius(marker: RainfallStationMarker): void {
    let scale = this.map.getZoomScale(this.markerInfo.pivotZoom, this.map.getZoom());
    let radius = marker.metadata.pivotRadius * scale;
    marker.marker.setRadius(radius);
  }
  //for now just set boundaries on size at pivot, have radius not change if above pivot zoom

  setMarkerWeight(marker: RainfallStationMarker): void {
    //set weight to 5% of radius
    let weight = marker.marker.getRadius() * this.markerInfo.weightToRadiusFactor;
    marker.marker.setStyle({weight: weight});
  }
}

//weight 5% radius?
interface RainfallStationMarkerInfo {
  markers: RainfallStationMarker[],
  layer: L.LayerGroup,
  pivotZoom: number,
  weightToRadiusFactor: number,
  markerMap: Map<SiteInfo, L.CircleMarker>
}

interface RainfallStationMarker {
  marker: L.CircleMarker,
  metadata: MarkerMetadata
}

//scale everything from pivot radius to prevent rounding issues and reduce complexity
interface MarkerMetadata {
  pivotRadius: number
}

interface ActiveData {
  data: DataPack,
  band: string
}

interface DataPack {
  sites: SiteInfo[],
  raster: RasterData,
  date: string,
}

interface PopupData {
  popupTimer: any,
  highlightedCell: L.Layer,
  popup: L.Popup
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
