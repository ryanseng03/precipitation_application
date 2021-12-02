import { Component, OnInit, Input, ElementRef, ViewChild } from '@angular/core';
import {Map as LMap, Control, DomUtil, ControlPosition} from 'leaflet';
import * as rasterizeHTML from 'rasterizehtml';

@Component({
  selector: 'app-leaflet-image-export',
  templateUrl: './leaflet-image-export.component.html',
  styleUrls: ['./leaflet-image-export.component.scss']
})
export class LeafletImageExportComponent implements OnInit {
  @ViewChild("exportControl") exportControl: ElementRef;

  @Input() position: ControlPosition = "topleft";
  @Input() set map(map: LMap) {
    if(map) {
      let ExportControl = Control.extend({
        onAdd: function () {
          let control = DomUtil.get("export-control");
          return control;
        }
      });
      new ExportControl({position: this.position}).addTo(map);
    }
  }
  @Input() imageContainer: ElementRef;
  @Input() hiddenControls: string[] = [];

  constructor() {
  }

  ngOnInit() {

  }

  exportImage() {
    let canvas = document.createElement("canvas");
    let containerEl: HTMLElement = this.imageContainer.nativeElement;
    let mapBounds: DOMRect = containerEl.getBoundingClientRect();

    canvas.width = document.body.clientWidth;
    canvas.height = document.body.clientHeight;
    let ctx = canvas.getContext("2d");
    ctx.rect(mapBounds.x, mapBounds.y, mapBounds.width, mapBounds.height);
    ctx.clip();
    let defaultDisplays = new Map<HTMLElement, string>();
    rasterizeHTML.drawDocument(document, canvas).then(() => {
      let link = document.createElement("a");
      link.download = "HCDP_map.png";
      link.href = canvas.toDataURL("image/png");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      for(let data of defaultDisplays.entries()) {
        data[0].style.display = data[1];
      }
    });


    for(let className of this.hiddenControls) {
      for(let element of <any>document.getElementsByClassName(className)) {
        defaultDisplays.set(element, element.style.display);
        element.style.display = "none";
      }
    }


  }

}
