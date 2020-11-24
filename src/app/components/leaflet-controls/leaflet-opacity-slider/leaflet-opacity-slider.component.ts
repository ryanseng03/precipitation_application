import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import {Map, Control, DomUtil, DomEvent, Layer} from 'leaflet';
import { MatSliderChange } from '@angular/material/slider';
import {Subject, Observable} from "rxjs";
import { FormControl } from '@angular/forms';

@Component({
  selector: 'app-leaflet-opacity-slider',
  templateUrl: './leaflet-opacity-slider.component.html',
  styleUrls: ['./leaflet-opacity-slider.component.scss']
})
export class LeafletOpacitySliderComponent implements OnInit {

  private _map: Map;
  public control: Control.Layers;
  private layers: Layer;
  public schemeControl: FormControl;
  //change to input?
  private defaultScheme: string = "mono";

  @Output() opacity: EventEmitter<number>;
  @Output() colorScheme: EventEmitter<string>;

  //should probably replace these with simple value inputs
  @Input() mapGetOpacity: () => number;
  @Input() mapLayerReady: () => boolean;
  //
  @Input() set map(map: Map) {
    if(map) {
      console.log(map);
      this._map = map;
      let LayerControl = <any>Control.Layers.extend({
        onAdd: function() {
          this._initLayout();
          this._addOpacitySlider();
          this._addColorSchemeSelector();
          this._update();
          return this._container;
        },
        _addOpacitySlider: function() {
          let controlContainer = this._addContainer();
          let control = DomUtil.get("opacity-control");
          controlContainer.appendChild(control);
          DomEvent.disableClickPropagation(controlContainer);
        },
        _addColorSchemeSelector: function() {
          let controlContainer = this._addContainer();
          let control = DomUtil.get("color-control");
          controlContainer.appendChild(control);
          DomEvent.disableClickPropagation(controlContainer);
          //reopen control on click after close (selectors new context causes the control to close, need timeout 0 to delegate to after control closure)
          DomEvent.addListener(control, "click", () => {
          //note setimmediate is non-standard and is not defined naturally
          setTimeout(() => {
            this.expand();
          }, 0);
            
          });
        },
        _addContainer: function() {
          let elements = this._container.getElementsByClassName('leaflet-control-layers-list');  
          let controlContainer = DomUtil.create("div", "", elements[0]);
          return controlContainer;
        }
      });
      this.control = new LayerControl(this.layers).addTo(map);
    }
   
  }
  get map(): Map {
    return this._map
  }
  
  constructor() {
    this.opacity = new EventEmitter<number>();
    this.colorScheme = new EventEmitter<string>();
    this.schemeControl = new FormControl(this.defaultScheme);
  }

  ngOnInit() {
    this.schemeControl.valueChanges.subscribe((scheme: string) => {
      this.colorScheme.emit(scheme);
    });
  }

  ngOnDestroy() {
    this._map.removeControl(this.control);
  }

  setOpacity(event: MatSliderChange): void {
    this.opacity.emit(event.value);
  }

  getOpacity(): number {
    return this.mapGetOpacity();
  }

  layerReady(): boolean {
    return this.mapLayerReady();
  }

  addLayers(layers: Layer) {
    this.layers = layers;
    
  }

  addOverlay(overlay: Layer, name: string) {
    this.control.addOverlay(overlay, name);
  }

  removeLayer(layer: Layer) {
    this.control.removeLayer(layer);
  }

  setColorScheme() {

  }

}
