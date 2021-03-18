import { setStyles } from '@angular/animations/browser/src/util';
import { Component, OnInit, Output, Input, EventEmitter } from '@angular/core';
import * as L from "leaflet";
//import * as D from "leaflet-draw";
import { SiteMetadata } from 'src/app/models/SiteMetadata';


interface StationMetadata {
  name: string,
  id: string,
  location: L.LatLng,
  add: {[prop: string]: string}
}


@Component({
  selector: 'app-filter-map',
  templateUrl: './filter-map.component.html',
  styleUrls: ['./filter-map.component.scss']
})
export class FilterMapComponent implements OnInit {

  private _stations: SiteMetadata[];

  @Output() filteredStations: EventEmitter<SiteMetadata[]> = new EventEmitter<SiteMetadata[]>();
  //station metadata has to have geospatial properties (lat, lng), and some sort of id, other than that can have anything or nothing
  //use standard fields for anything you need
  //update to StationMetadata and be more generic
  @Input() set stations(stations: {
      station: StationMetadata,
      selected: boolean
    }[]) {
    //this._stations = stations;
    //reevaluate groups
    //this.updateDrawnFilter();
    

  }
  @Input() selectorMode = "popup";
  @Input() StationMetadataMetadata: any;
  //@Input()

  //optional value

  map: L.Map;

  

  colors = {
    //default color, looks nice
    selected: "#3388ff",
    deselected: "#757575"
  }

  leafletOptions: L.MapOptions;
  leafletDrawOptions: any;
  baseLayers: any;

  drawnItems: L.FeatureGroup = L.featureGroup();



  selectedStations: L.FeatureGroup = L.featureGroup();
  deselectedStations: L.FeatureGroup = L.featureGroup();
  

  constructor() {

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
  }

  ngOnInit() {
  }

  onMapReady(map: L.Map) {
    this.map = map;
    this.drawnItems.addTo(map);
    L.control.scale({position: 'bottomleft'}).addTo(map);

    this.addPointToMap(L.latLng(20.559, -157.242), {
      test: "test",
      test2: "test"
    });
  }


  //need to have input for state of station (enabled/disabled) since can be disabled from outside
  //track state in marker data, marker data sets in selectedStationsMap, any enabled markers in map are final set

  selectedStationsMap: Map<L.Layer, {internalStations: {marker: L.CircleMarker, station: SiteMetadata}[], layerType: string}>;
  markerData: Map<L.CircleMarker, {}>

  createDrawnFilter(drawnLayer: any) {
    let layer = drawnLayer.layer;
    switch(drawnLayer.layerType) {
      case "circle": {
        let bounds: L.LatLngBounds = drawnLayer.layer.getBounds();
        console.log(bounds);
        break;
      }
      case "rectangle": {
        let bounds: L.LatLngBounds = drawnLayer.layer.getBounds();
        console.log(bounds);
        break;
      }
      case "polygon": {
        let geojson = drawnLayer.layer.toGeoJSON();
        console.log(geojson);
        break;
      }
    }
  }

  editDrawnFilter(editedLayers: any) {
    editedLayers.layers.eachLayer((layer: L.Layer) => {
      let hasLayer = this.drawnItems.hasLayer(layer);
      console.log(hasLayer);
    });
  }

  getLayer

  updateDrawnFilter(e: any) {
    console.log(e);
    console.log(e.layerType)
    this.drawnItems.eachLayer((layer: any) => {
      console.log(layer.layerType);
    });
    //console.log(this.drawnItems);
    let geojson = this.drawnItems.toGeoJSON();
    console.log(geojson);
  }

  deleteDrawnFilter(deletedLayers: any) {
    deletedLayers.layers.eachLayer((layer: L.Layer) => {
      // let hasLayer = this.drawnItems.hasLayer(layer);
      // console.log(hasLayer);
      this.selectedStationsMap.delete(layer);
    });
  }

  


  addPointToMap(location: L.LatLng, metadata: any) {
    let marker = L.circleMarker(location);
    
    //need select all, deselect all, replace exclude with invert selection
    //default everything to selecte
    let selected = true;
    

    let popup = L.DomUtil.create("div");

    let text = L.DomUtil.create("div", "filter-popup-text", popup);
    let parts = [];
    for(let item in metadata) {
      let part = `${item}: ${metadata[item]}`;
      parts.push(part);
    }
    let data = parts.join("<br>");
    text.innerHTML = data;

    L.DomUtil.create("div", "filter-popup-spacer", popup);

    let toggleSelector = L.DomUtil.create("button", "filter-toggle-selector", popup);

    let setStyle = () => {
      let color = this.colors.selected;
      if(!selected) {
        toggleSelector.innerHTML = "Add Station";
        color = this.colors.deselected;
      }
      else {
        toggleSelector.innerHTML = "Remove Station";
      }
      marker.setStyle({
        color: color,
        fillColor: color,
        fillOpacity: 0.5
      });
    }

    let toggleSelected = () => {
      //toggle select
      selected = !selected; 
      setStyle();
    }

    marker.on("click", () => {
      if(this.selectorMode == "click") {
        //immediately close popup if in click mode
        setTimeout(() => {
          marker.closePopup();
        }, 0);
        toggleSelected();
      }
    });

    L.DomEvent.addListener(toggleSelector, "click", () => {
      toggleSelected();
    });    

    setStyle();

    marker.bindPopup(popup);
    marker.addTo(this.map);
  }

}
