import { Component, OnInit, ViewChild, ElementRef, HostListener, AfterViewInit, Input } from '@angular/core';
import { MatSidenav } from '@angular/material/sidenav';
import { MapComponent } from '../map/map.component';

@Component({
  selector: 'app-vis',
  templateUrl: './vis.component.html',
  styleUrls: ['./vis.component.scss']
})
export class VisComponent implements OnInit, AfterViewInit {

  _visible: boolean;

  @Input() set visible(state: boolean) {
    this._visible = state;
    if(state) {
      //timeout so set after animation
      setTimeout(() => {
        this.checkMoveInfo();
      }, 500);

    }
  }
  //this works, but is a bit sketchy, marks as visible after nav closed and waits for animation before triggering
  //should probably have a better way of indicating component sizes like linking in to param service, fine for now though
  @Input() set navCollapsed(state: boolean) {
    if(state && this._visible) {
      //timeout so set after animation
      setTimeout(() => {
        //set static map width for sizing
        let mapElement: HTMLElement = this.mapContainerRef.nativeElement;
        this.mapWidth = `${mapElement.clientWidth}px`;
        this.checkMoveInfo();
      }, 500);
    }
  }

  @ViewChild("container") container: ElementRef;
  @ViewChild("mapContainer") mapContainerRef: ElementRef;
  @ViewChild("dragbar") dragbar: ElementRef;
  @ViewChild("viewNav") viewNav: MatSidenav;


  @ViewChild("map") map: MapComponent;

  @ViewChild("viewContainer") viewContainer: ElementRef;


  mapWidth: string = "calc(50% - 10px)";
  viewWidth: number;

  //dragState: DragState;

  view: string = "select";

  constructor() {

  }

  setViewWidth() {
    let element: HTMLElement = this.viewContainer.nativeElement;
    this.viewWidth = element.clientWidth;
  }

  ngAfterViewInit() {

  }

  ngOnInit() {
    this.setViewWidth();
  }






  @HostListener('window:resize', ['$event'])
  checkMoveInfo() {
    this.map.invalidateSize();
    this.setViewWidth();
  }

  moveChild(child, parent) {
    child.parentElement.removeChild(child);
    parent.appendChild(child);
  }

  startResize(touch: boolean): boolean {
    let moveHandler = (event: MouseEvent | TouchEvent) => {
      let clientX = touch ? (<TouchEvent>event).touches[0].clientX : (<MouseEvent>event).clientX;
      let dragbar: HTMLElement = this.dragbar.nativeElement;
      let mapContainer: HTMLElement = this.mapContainerRef.nativeElement;
      //offset to midpoint of dragbar
      let dragbarOffset = dragbar.clientWidth / 2;
      let left = mapContainer.getBoundingClientRect().left;
      let x = clientX - left - dragbarOffset;
      x = Math.max(0, x);
      this.mapWidth = x + "px";
      return false;
    }

    let stopResize = () => {
      if(touch) {
        document.removeEventListener("touchmove", moveHandler);
        document.removeEventListener("touchend", stopResize);
      }
      else {
        document.removeEventListener("mousemove", moveHandler);
        document.removeEventListener("mouseup", stopResize);
      }

      this.checkMoveInfo();

      return false;
    }

    if(touch) {
      document.addEventListener("touchmove", moveHandler)
      document.addEventListener("touchend", stopResize);
    }
    else {
      document.addEventListener("mousemove", moveHandler)
      document.addEventListener("mouseup", stopResize);
    }

    //stops default and propogation, equivalent of calling preventDefault and stopPropagation
    return false;
  }



  getMapWidth() {

  }

  viewNavClick(value: string) {
    this.view = value;
    this.viewNav.close();
  }

}


interface DragState {
  lastEvent: MouseEvent,
  moveHandler: (event: MouseEvent) => boolean
}
