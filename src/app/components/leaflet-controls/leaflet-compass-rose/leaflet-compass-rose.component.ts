import { Component, OnInit, Input } from '@angular/core';
import { ControlPosition, Control, DomUtil, Map, ControlOptions } from "leaflet";

@Component({
  selector: 'app-leaflet-compass-rose',
  templateUrl: './leaflet-compass-rose.component.html',
  styleUrls: ['./leaflet-compass-rose.component.scss']
})
export class LeafletCompassRoseComponent implements OnInit {

  @Input() options: RoseControlOptions;

  @Input() set map(map: Map) {
    if(map) {
      let Rose = Control.extend({
        initialize: function(options: RoseControlOptions) {
         
          if(!options.style) {
            options.style = {};
          }
          this.options = options;
        },
        onAdd: function () {
          let control = DomUtil.get("rose-container");
          for(let style in this.options.style) {
            control.style[style] = this.options.style[style];
          }
          let img = DomUtil.get("rose");
          img.setAttribute("src", this.options.image);
          return control;
        }
      });
      new Rose(this.options).addTo(map);
    }
  }

  constructor() { }

  ngOnInit() {
  }

}

export interface RoseControlOptions extends ControlOptions {
  image: string,
  style?: any
}