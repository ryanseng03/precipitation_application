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
      // let Header = Control.extend({
        
      //   onAdd: function () {
      //     let control = DomUtil.get("header-control");
      //     return control;
      //   }
      // });
      // let header = new Header({position: "topleft"}).addTo(map);
      // console.log(header);
      // console.log(header.getPosition());
      let control = DomUtil.get("header-control");
      let mapContainer = map.getContainer();
      console.log(mapContainer);
      let controlContainer = mapContainer.getElementsByClassName("leaflet-control-container");
      console.log(controlContainer[0]);
      controlContainer[0].appendChild(control);
      //map.getContainer().appendChild(control);
    }
  }

  //content input

  constructor() { }

  ngOnInit() {
  }

}
