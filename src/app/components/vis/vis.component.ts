import { Component, OnInit, ViewChild, ElementRef, HostListener, AfterViewInit } from '@angular/core';
import { MatSidenav } from '@angular/material/sidenav';
import { MapComponent } from '../map/map.component';

@Component({
  selector: 'app-vis',
  templateUrl: './vis.component.html',
  styleUrls: ['./vis.component.scss']
})
export class VisComponent implements OnInit, AfterViewInit {

  @ViewChild("mapContainer") mapContainer: ElementRef;
  @ViewChild("dragBar") dragBar: ElementRef;
  @ViewChild("viewNav") viewNav: MatSidenav;

  @ViewChild("p1") p1: ElementRef;
  @ViewChild("p2") p2: ElementRef;
  @ViewChild("dsInfo", {read: ElementRef}) dsInfo: ElementRef;

  @ViewChild("map") map: MapComponent;

  @ViewChild("viewContainer") viewContainer: ElementRef;

  resizeBarWidth: string = "10px";
  mapWidth: string = "calc(50% - 10px)";
  viewWidth: string = "50%";

  dragState: DragState;

  view: string = "tables";

  constructor() {
    this.dragState = {
      lastEvent: null,
      moveHandler: (event: MouseEvent) => {
        let dx = event.x - this.dragState.lastEvent.x;
        this.mapWidth = this.mapContainer.nativeElement.offsetWidth + dx + "px";
        this.checkMoveInfo();
        this.dragState.lastEvent = event;

        return false;
      }
    }
  }

  ngAfterViewInit() {
    this.checkMoveInfo();
  }

  ngOnInit() {

    // setTimeout(() => {
    //   this.moveInfo();
    // }, 2000);
  }

  @HostListener('window:resize', ['$event'])
  checkMoveInfo() {
    let parent: HTMLElement;
    if(this.viewContainer.nativeElement.offsetWidth < 500) {
      parent = this.p1.nativeElement;
    }
    else {
      parent = this.p2.nativeElement;
    }
    if(this.dsInfo.nativeElement.parentElement != parent) {
      this.moveChild(this.dsInfo.nativeElement, parent);
    }
  }

  moveChild(child, parent) {
    child.parentElement.removeChild(child);
    parent.appendChild(child);
  }

  startResize(event: MouseEvent, touch: boolean): boolean {
    this.dragState.lastEvent = event;
    if(touch) {
      document.addEventListener("touchmove", this.dragState.moveHandler)
      document.addEventListener("touchend", this.stopResize(touch));
    }
    else {
      document.addEventListener("mousemove", this.dragState.moveHandler)
      document.addEventListener("mouseup", this.stopResize(touch));
    }

    //stops default and propogation, equivalent of calling preventDefault and stopPropagation
    return false;
  }

  //curry stop resize function to include dragState from component context
  stopResize(touch: boolean) {
    let dragState = this.dragState;
    let checkState = this.checkMoveInfo.bind(this);
    let map = this.map;
    return function(event: MouseEvent): boolean {
      if(touch) {
        document.removeEventListener("touchmove", dragState.moveHandler);
        document.removeEventListener("touchend", this);
      }
      else {
        document.removeEventListener("mousemove", dragState.moveHandler);
        document.removeEventListener("mouseup", this);
      }

      map.invalidateSize();
      
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
