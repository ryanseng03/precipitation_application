import { Component, OnInit, Input, ViewChild } from '@angular/core';
import {Map, Control, DomUtil, ControlPosition} from 'leaflet';
import { ColorScale } from 'src/app/models/colorScale';

@Component({
  selector: 'app-leaflet-color-scale',
  templateUrl: './leaflet-color-scale.component.html',
  styleUrls: ['./leaflet-color-scale.component.scss']
})
export class LeafletColorScaleComponent implements OnInit {

  @ViewChild("colors") colors;

  _map: Map;
  control: Control;
  intervals: string[];
  numIntervals: number = 4;
  colorGradient = "";

  @Input() label: string;
  @Input() rangeAbsolute: [boolean, boolean];

  private __colorScale;
  @Input() set colorScale(colorScale: ColorScale) {
    this.__colorScale = colorScale
    if(colorScale) {
      let range = colorScale.getRange();
      let parts = this.numIntervals - 1;
      let span = range[1] - range[0];
      let intervalSize = span / parts;
      let intervals: number[] = [range[0]];
      for(let i = 0; i < parts; i++) {
        let interval = intervals[i] + intervalSize;
        intervals.push(interval);
      }
      for(let i = 0; i < parts; i++) {
        //round 2 decimal points
        intervals[i] = Math.round(intervals[i]);
      }
      //reverse since populated from top to bottom
      this.intervals = intervals.reverse().map((value: number) => {
        return value.toString();
      });
      if(!this.rangeAbsolute[0]) {
        this.intervals[this.intervals.length - 1] += "-";
      }
      if(!this.rangeAbsolute[1]) {
        this.intervals[0] += "+";
      }
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

  constructor() { }

  //note that is the scale changes this won't update, maybe modify (this is static for now though)
  ngOnInit() {

  }

  getColorGradient() {
    let colors = this.__colorScale.getColorsHex().reverse();
    let colorListString = colors.join(",");
    let gradient = `linear-gradient(${colorListString})`;
    this.colorGradient = gradient;
  }



}
