import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { MatSidenav } from '@angular/material/sidenav';

@Component({
  selector: 'app-vis',
  templateUrl: './vis.component.html',
  styleUrls: ['./vis.component.scss']
})
export class VisComponent implements OnInit {

  @ViewChild("mapContainer") mapContainer: ElementRef;
  @ViewChild("dragBar") dragBar: ElementRef;
  @ViewChild("viewNav") viewNav: MatSidenav;

  resizeBarWidth: string = "10px";
  mapWidth: string = "calc(50% - 10px)";
  viewWidth: string = "50%";

  dragState: DragState;

  view: string = "select";

  constructor() {
    this.dragState = {
      lastEvent: null,
      moveHandler: (event: MouseEvent) => {
        let dx = event.x - this.dragState.lastEvent.x;
        this.mapWidth = this.mapContainer.nativeElement.offsetWidth + dx + "px";

        this.dragState.lastEvent = event;

        return false;
      }
    }
  }

  ngOnInit() {
  }


  startResize(event: MouseEvent): boolean {
    console.log(event);
    console.log(this.mapContainer);
    console.log(this.mapContainer.nativeElement.offsetWidth);


    this.dragState.lastEvent = event;
    document.addEventListener("mousemove", this.dragState.moveHandler)
    document.addEventListener("mouseup", this.stopResize());

    //stops default and propogation, equivalent of calling preventDefault and stopPropagation
    return false;
  }

  //curry stop resize function to include dragState from component context
  stopResize() {
    let dragState = this.dragState;
    return function(event: MouseEvent): boolean {
      document.removeEventListener("mousemove", dragState.moveHandler);
      document.removeEventListener("mouseup", this);
      dragState.lastEvent = null;

      return false;
    }
  }

  resize(event: any) {
    // console.log("drag");
  }

  getMapWidth() {

  }

  viewNavClick(value: string) {
    this.view = value;
    console.log(this.viewNav);
    this.viewNav.close();
  }

}


interface DragState {
  lastEvent: MouseEvent,
  moveHandler: (event: MouseEvent) => boolean
}
