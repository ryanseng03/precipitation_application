import { Component, OnInit } from '@angular/core';
import * as L from "leaflet";
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
  // private drawnItems: L.FeatureGroup;
  // private drawOptions: any;
  private map: L.Map;
  private baseLayers: any;
  private active: ActiveData;
  private dataLayers: {
    [band: string]: any
  };

  private layerLabelMap: TwoWayLabelMap;

  private selectedMarker: L.Marker;

  constructor(private paramService: EventParamRegistrarService, private dataRetreiver: DataRetreiverService, private colors: ColorGeneratorService, private rasterLayerService: LeafletRasterLayerService) {
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

    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "assets/marker-icon-2x.png",
      iconUrl: "assets/marker-icon.png",
      shadowUrl: "assets/marker-shadow.png"
    });

    //don't want popup to be force closed when another one appears
    // L.Map.prototype.openPopup = function(popup) {
    //   this._popup = popup;

    //   return this.addLayer(popup).fire('popupopen', {
    //     popup: this._popup
    //   });
    // }


  }



  onMapReady(map: L.Map) {

    L.DomUtil.addClass(map.getContainer(), 'pointer-cursor')



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
      band: "rainfall"
    };


    let layerGroups = {
      Types: {}
    }

    let clusterOptions = {
      //chunkedLoading: true
    };


    let markerMap: Map<SiteInfo, L.Marker> = new Map<SiteInfo, L.Marker>();
    let siteMarkers = R.markerClusterGroup(clusterOptions);
    //generate parameter hooks to update visualizations

    //want filtered, should anything be done with the unfiltered sites? gray them out or just exclude them? can always change
    let siteHook: ParameterHook = this.paramService.createParameterHook(EventParamRegistrarService.GLOBAL_HANDLE_TAGS.filteredSites, (sites: SiteInfo[]) => {
      this.active.data.sites = sites;


      let markers = [];

      let markerLayer = L.layerGroup();
      sites.forEach((site: SiteInfo) => {
        // //troubleshooting markers not appearing
        // if(site.location.lat < this.options.maxBounds[0][0] || site.location.lat > this.options.maxBounds[1][0]
        // || site.location.lng < this.options.maxBounds[0][1] || site.location.lng > this.options.maxBounds[1][1]) {
        //   console.log("OOB!", site.location.lat, site.location.lng);
        // }
        //let polyMarker = L.circle([site.location.lat, site.location.lng], {radius: (site.value + 1) * 1000});
        //polyMarkerLayer.addLayer(polyMarker);

        let siteDetails: string = "Name: " + site.name
        + "<br> Network: " + site.network
        + "<br> Lat: " + site.lat + ", Lng: " + site.lng
        //cheating here for now, should get actual site value
        + "<br> Value: " + site.value;
        //console.log(site.location);
        let marker = L.marker(site.location);
        //console.log(marker);
        //console.log(siteDetails);
        marker.bindPopup(siteDetails, { autoPan: false, autoClose: false});
        marker.on("click", () => {
          this.paramService.pushSiteSelect(site);
        });
        markerMap.set(site, marker);
        //console.log(siteDetails);
        markerLayer.addLayer(marker);
        markers.push(marker);

      });


      //console.log(markers);
      siteMarkers.addLayers(markers);
      //console.log(siteMarkers);
      map.addLayer(siteMarkers);
      //console.log(sites);
      //map.addLayer(markerLayer);
    });



    let rasterHook = this.paramService.createParameterHook(EventParamRegistrarService.GLOBAL_HANDLE_TAGS.raster, (raster: RasterData) => {
      this.active.data.raster = raster;
      let bands = raster.getBands();
      let header = raster.getHeader();
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
      //add rainfall layer to map as default
      map.addLayer(this.dataLayers["rainfall"]);

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
      let marker: L.Marker = markerMap.get(site);

      siteMarkers.zoomToShowLayer(marker, () => {
        if(this.selectedMarker !== undefined && this.selectedMarker.isPopupOpen()) {
          this.selectedMarker.closePopup();
        }
        this.map.panTo(site.location, {animate: true});
        console.log(map.panTo);
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
      });


    });

    let dateHook = this.paramService.createParameterHook(EventParamRegistrarService.GLOBAL_HANDLE_TAGS.date, (date: string) => {
      this.active.data.date = date;
    });



    let layerGroupControlOptions = {
      exclusiveGroups: ["Types"],
      groupCheckboxes: true
    };

    let lc = C.groupedLayers(this.baseLayers, layerGroups, layerGroupControlOptions);
    lc.addTo(map);


    this.setBaseLayerHandlers();


  }

  setBaseLayerHandlers() {
    this.map.on('overlayadd', (e: L.LayersControlEvent) => {
      //set layer to type any
      //let layer: any = e.layer;
      this.active.band = e.name;
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
          popupData.popup.setContent("Value: " + value);
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
