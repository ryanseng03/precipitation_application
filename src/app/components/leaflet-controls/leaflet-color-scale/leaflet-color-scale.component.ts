import { Component, OnInit, Input, ViewChild } from '@angular/core';
import {Map, Control, DomUtil, ControlPosition} from 'leaflet';
import { ColorScale } from 'src/app/models/colorScale';
import { EventParamRegistrarService } from 'src/app/services/inputManager/event-param-registrar.service';

@Component({
  selector: 'app-leaflet-color-scale',
  templateUrl: './leaflet-color-scale.component.html',
  styleUrls: ['./leaflet-color-scale.component.scss']
})
export class LeafletColorScaleComponent implements OnInit {

  @ViewChild("colors") colors;

  _map: Map;
  control: Control;
  intervalLabelsRaw: string[];
  intervalLabels: string[];
  colorGradient = "";

  private _type: string;

  @Input() intervals: number = 5;
  @Input() datatype: string = "";
  @Input() units: string = "";
  private _rangeAbsolute: [boolean, boolean];
  @Input() set rangeAbsolute(rangeAbsolute: [boolean, boolean]) {
    this._rangeAbsolute = rangeAbsolute;
    this.updateLabels();
  }

  private __colorScale;
  @Input() set colorScale(colorScale: ColorScale) {
    this.__colorScale = colorScale
    if(colorScale) {
      let range = colorScale.getRange();
      let parts = this.intervals - 1;
      let span = range[1] - range[0];
      let intervalSize = span / parts;
      //populate in reverse since drawing top down
      this.intervalLabelsRaw = [];
      let i: number;
      for(i = 0; i < parts; i++) {
        let interval = range[1] - intervalSize * i;
        //round to at most 2 decimals
        interval = Math.round(interval * 100) / 100;
        this.intervalLabelsRaw.push(interval.toLocaleString());
      }
      //add range[0] directly to avoid rounding errors
      this.intervalLabelsRaw.push(range[0].toLocaleString());
      this.updateLabels();
      this.getColorGradient();
    }
  }

  @Input() position: ControlPosition = "bottomright";
  @Input() set map(map: Map) {
    if(map) {
      this._map = map;
      let Legend = Control.extend({
        onAdd: function () {
          let control = DomUtil.get("legend");
          return control;
        }
      });
      this.control = new Legend({position: this.position}).addTo(map);
    }
  }

  constructor(private paramService: EventParamRegistrarService) {
    this.intervalLabelsRaw = [];
  }

  //note that is the scale changes this won't update, maybe modify (this is static for now though)
  ngOnInit() {
    this.paramService.createParameterHook(EventParamRegistrarService.EVENT_TAGS.viewType, (type: string) => {
      this._type = type;
    });
  }

  updateLabels() {
    let rangeAbsolute = this._type == "direct" ? this._rangeAbsolute : [false, false];
    this.intervalLabels = [...this.intervalLabelsRaw];
    if(rangeAbsolute && this.intervalLabels.length > 1) {
      if(!rangeAbsolute[0]) {
        this.intervalLabels[this.intervalLabels.length - 1] += "-";
      }
      if(!rangeAbsolute[1]) {
        this.intervalLabels[0] += "+";
      }
    }
  }

  getColorGradient() {
    let colors = this.__colorScale.getColorsHex().reverse();
    let colorListString = colors.join(",");
    let gradient = `linear-gradient(${colorListString})`;
    this.colorGradient = gradient;
  }

  getHeader() {
    let unit: string = this.units ? `(${this.units})` : "";
    let text: string = this.datatype;
    if(this._type == "percent") {
      unit = "(%)"
      text += " Change"
    }
    else if(this._type == "absolute") {
      text += " Change"
    }

    let header = `${text} ${unit}`;
    return header;
  }

}
