import { setStyles } from '@angular/animations/browser/src/util';
import { Component, OnInit, Output, Input, EventEmitter, HostListener } from '@angular/core';
import * as L from "leaflet";
//import * as D from "leaflet-draw";
import { SiteMetadata } from 'src/app/models/SiteMetadata';
import { InternalPointsService } from "../../services/geospatial/internal-points.service";
import { StationFilteringService, FilteredStations, StationMetadata, Filter, FilterBase, FilterGroup } from "../../services/filters/station-filtering.service";
import { AnimationStyleMetadata } from '@angular/animations';
import { RoseControlOptions } from '../leaflet-controls/leaflet-compass-rose/leaflet-compass-rose.component';
import { AssetManagerService } from 'src/app/services/util/asset-manager.service';



//only need to check markers not already in shapes
//not true because layer could be deleted

//isnt it easier just to pass in the filter defs?

interface LayerInfo {
  type: "circle" | "rectangle" | "polygon",
  //filter: Filter
}

//marker info

//just on click check state match
//move all of the filter logic to a service


interface StationFilterInfo {
  metadata: StationMetadata,
  inFilter: boolean
}




@Component({
  selector: 'app-filter-map',
  templateUrl: './filter-map.component.html',
  styleUrls: ['./filter-map.component.scss']
})
export class FilterMapComponent implements OnInit {
  //reference marker by metadata object so when filters change can relate already created markers
  private metadataToMarker: Map<StationMetadata, StationMarker>;
  //reference info on layer by layer
  private drawnFilters: Map<L.Layer, LayerInfo>;

  private _stations: SiteMetadata[];
  roseOptions: RoseControlOptions;


  //!!!MAKE SELECT ON MAP FILTER AN ID FILTER

  @Output() filteredStations: EventEmitter<SiteMetadata[]> = new EventEmitter<SiteMetadata[]>();
  //station metadata has to have geospatial properties (lat, lng), and some sort of id, other than that can have anything or nothing
  //use standard fields for anything you need
  //update to StationMetadata and be more generic
  @Input() set stations(stations: StationMetadata[]) {
    for(let station of stations) {

    }
  }
  // @Input() set filters(filters: Filter[]) {
  //   this.applyFilters(filters);
  // }

  @Input() selectorMode = "popup";
  @Input() StationMetadataMetadata: any;
  //@Input()

  //optional value

  map: L.Map;





  leafletOptions: L.MapOptions;
  leafletDrawOptions: any;
  baseLayers: any;

  drawnItems: L.FeatureGroup = L.featureGroup();



  selectedStations: L.FeatureGroup = L.featureGroup();
  deselectedStations: L.FeatureGroup = L.featureGroup();


  //set of ids that have been toggled
  toggledStations: Set<string> = new Set<string>();
  // mapSelectFilter: filterf = (metadata: StationMetadata) => {
  //   return false;
  // }

  private filterGroup: FilterGroup<StationMetadata>;

  //should only have map select filter if state changes from state after all other filters
  //this should be the last thing to be evaluated, if it's the same remove it so it gets affected by changed to other filters again



  constructor(private ips: InternalPointsService, private filterService: StationFilteringService, private assetService: AssetManagerService) {
    let roseImage = "/arrows/nautical.svg";
    let roseURL = assetService.getAssetURL(roseImage);
    this.roseOptions = {
      image: roseURL,
      position: "bottomleft"
    }

    this.baseLayers = {
      Satellite: L.tileLayer("http://www.google.com/maps/vt?lyrs=y@189&gl=en&x={x}&y={y}&z={z}"),
      Street: L.tileLayer('https://www.google.com/maps/vt?lyrs=m@221097413,traffic&x={x}&y={y}&z={z}')
    };

    this.leafletOptions = {
      layers: this.baseLayers.Satellite,
      zoom: 7,
      center: L.latLng(20.559, -157.242),
      attributionControl: false,
      // zoomSnap: 0.01,
      // wheelPxPerZoomLevel: 200,
      minZoom: 6,
      maxZoom: 18,
      // maxBounds: this.extents.bounds
    };

    this.leafletDrawOptions = {
      position: "topleft",
      draw: {
        marker: false,
        polyline: false,
        circlemarker: false
      },
      edit: {
        featureGroup: this.drawnItems
      }
    }

    filterService.getFilteredStationsObserver().subscribe((stations: FilteredStations) => {
      //check flipped stations and remove any that
    });
  }

  ngOnInit() {
  }

  onMapReady(map: L.Map) {
    //temporary workaround, because map is sized by parent it does not size properly initially
    setTimeout(() => {
      map.invalidateSize();
    }, 1000);
    //map.once("moveend zoomend", () => {console.log("!");map.invalidateSize()});
    this.map = map;
    this.drawnItems.addTo(map);
    L.control.scale({
      position: "bottomleft",
      maxWidth: 200
    }).addTo(map);
    //(<any>L).control.rose('rose', {position: "bottomright", icon: "nautical", iSize: "medium", opacity: 0.8}).addTo(map);

    //new T({position: "bottomleft"}).addTo(map);

    let filterObs = this.filterService.getFilteredStationsObserver();

    filterObs.subscribe((stations: FilteredStations) => {
      let handleStation = (station: StationMetadata, selected: boolean) => {
        let marker = this.metadataToMarker.get(station);
        //if havent created marker add marker
        if(!marker) {
          marker = new StationMarker(station, () => {
            //on click toggle station filter, this handler will handle toggling state in marker
            //this.filterService.stationToggle(station);
          }, this.selectorMode, selected);
          this.metadataToMarker.set(station, marker);
        }
        //set marker state
        marker.setSelect(selected);
      }

      for(let station of stations.included) {
        handleStation(station, true);
      }
      for(let station of stations.excluded) {
        handleStation(station, false);
      }
    });

  }

  @HostListener('window:resize', ['$event'])
  resizeMap() {
    this.map.invalidateSize();
  }


  //need to have input for state of station (enabled/disabled) since can be disabled from outside
  //track state in marker data, marker data sets in selectedStationsMap, any enabled markers in map are final set

  // selectedStationsMap: Map<L.Layer, {internalStations: {marker: L.CircleMarker, station: SiteMetadata}[], layerType: string}>;
  // markerData: Map<L.CircleMarker, {}>

  createDrawnFilter(drawnLayer: any) {
    let type = drawnLayer.layerType;
    let filterF = (station: StationMetadata): boolean => {
      //if for some reason the layer type is not one of the handleable cases just match everything (don't filter anything)
      let internal: boolean = true;
      switch(type) {
        case "circle": {
          let bounds: L.LatLngBounds = drawnLayer.layer.getBounds();
          internal = this.ips.pointInsideCircle(bounds, station.location);
          break;
        }
        case "rectangle": {
          let bounds: L.LatLngBounds = drawnLayer.layer.getBounds();
          internal = this.ips.pointInsideRectangle(bounds, station.location);
          break;
        }
        case "polygon": {
          let geojson = drawnLayer.layer.toGeoJSON();
          internal = this.ips.pointInsideGeojson(geojson, station.location);
          break;
        }
      }
      return internal;
    };

    // let filter = this.filterService.addFilter(filterF, "or");
    // let layer = drawnLayer.layer;
    // this.drawnFilters.set(layer, {
    //   type: type,
    //   filter: filter
    // });
  }

  //need layer type in layer info map
  editDrawnFilter(editedLayers: any) {
    //how to handle? just delete layer and readd, need to have reference to layer type
    editedLayers.layers.eachLayer((layer: L.Layer) => {
      let layerInfo = this.drawnFilters.get(layer);
     // this.filterService.removeFilter(layerInfo.filter);
      this.createDrawnFilter({
        layer: layer,
        layerType: layerInfo.type
      });
    });
  }


  deleteDrawnFilter(deletedLayers: any) {
    console.log(deletedLayers);
    deletedLayers.layers.eachLayer((layer: L.Layer) => {
      let layerInfo = this.drawnFilters.get(layer);
      //this.filterService.removeFilter(layerInfo.filter);
    });
  }

}



class StationMarker {
  selected: boolean;
  station: StationMetadata;
  selectorMode: string;
  toggleSelector: HTMLElement;

  styles = {
    //default color, looks nice
    selected: {
      color: "#3388ff",
      fillColor: "#3388ff",
      fillOpacity: 0.5
    },
    deselected: {
      color: "#757575",
      fillColor: "#757575",
      fillOpacity: 0.5
    }
  }

  marker: L.CircleMarker;

  constructor(station: StationMetadata, onClick: () => void, selectorMode: string, selected: boolean) {
    this.station = station;
    this.selectorMode = selectorMode;
    this.marker = L.circleMarker(station.location);
    this.marker.on("click", onClick);

    //create popup
    let popup = L.DomUtil.create("div");
    let text = L.DomUtil.create("div", "filter-popup-text", popup);
    let parts = [];
    for(let item in station) {
      let part = `${item}: ${station[item]}`;
      parts.push(part);
    }
    let data = parts.join("<br>");
    text.innerHTML = data;

    L.DomUtil.create("div", "filter-popup-spacer", popup);

    this.toggleSelector = L.DomUtil.create("button", "filter-toggle-selector", popup);

    this.marker.on("click", () => {
      if(selectorMode == "popup") {
        //immediately close popup if in click mode
        setTimeout(() => {
          this.marker.closePopup();
        }, 0);
        onClick();
      }
    });

    L.DomEvent.addListener(this.toggleSelector, "click", onClick);

    this.setSelect(selected);

    this.marker.bindPopup(popup);
  }


  toggle() {
    this.setSelect(!this.selected);
  }

  setSelect(selected: boolean) {
    this.selected = selected;
    this.toggleSelector.innerHTML = selected ? "Remove Station" : "Add Station";
    let style = selected ? this.styles.selected : this.styles.deselected;
    this.marker.setStyle(style)
  }

  addTo(map: L.Map) {
    this.marker.addTo(map);
  }

  removeFrom(map: L.Map) {
    this.marker.removeFrom(map);
  }
}




