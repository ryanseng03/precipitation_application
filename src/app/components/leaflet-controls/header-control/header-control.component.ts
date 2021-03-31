import { Component, OnInit, Input } from '@angular/core';
import { Map, DomUtil, Control } from "leaflet";

@Component({
  selector: 'app-header-control',
  templateUrl: './header-control.component.html',
  styleUrls: ['./header-control.component.scss']
})
export class HeaderControlComponent implements OnInit {

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
      map.getContainer().appendChild(control);
    }
  }

  //content input

  constructor() { }

  ngOnInit() {
  }

}
