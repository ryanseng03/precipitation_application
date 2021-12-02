import { Component, OnInit, Input } from '@angular/core';
import { Map, DomUtil, Control } from "leaflet";
import { Moment } from 'moment';

@Component({
  selector: 'app-header-control',
  templateUrl: './header-control.component.html',
  styleUrls: ['./header-control.component.scss']
})
export class HeaderControlComponent implements OnInit {

  @Input() dataset: string;
  @Input() date: string;

  @Input() set map(map: Map) {
    if(map) {
      let control = DomUtil.get("header-control");
      let mapContainer = map.getContainer();
      let controlContainer = mapContainer.getElementsByClassName("leaflet-control-container");
      controlContainer[0].appendChild(control);
    }
  }

  constructor() { }

  ngOnInit() {
  }

}
