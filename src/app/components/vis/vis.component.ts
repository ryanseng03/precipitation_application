import { Component, OnInit, ViewChild, ElementRef, HostListener, AfterViewInit, Input } from '@angular/core';
import { MatSidenav } from '@angular/material/sidenav';
import { MapComponent } from '../map/map.component';

@Component({
  selector: 'app-vis',
  templateUrl: './vis.component.html',
  styleUrls: ['./vis.component.scss']
})
export class VisComponent implements OnInit, AfterViewInit {

  @Input() set visible(state: boolean) {
    if(state) {
      setTimeout(() => {
        this.checkMoveInfo();
      }, 500);
    }
  }

  @ViewChild("container") container: ElementRef;
  @ViewChild("mapContainer") mapContainer: ElementRef;
  @ViewChild("dragbar") dragbar: ElementRef;
  @ViewChild("viewNav") viewNav: MatSidenav;


  @ViewChild("map") map: MapComponent;

  @ViewChild("viewContainer") viewContainer: ElementRef;


  mapWidth: string = "calc(50% - 10px)";

  //dragState: DragState;

  view: string = "select";

  constructor() {
  }

  ngAfterViewInit() {
    // setTimeout(() => {
    //   this.checkMoveInfo();
    // }, 1000);
  }

  ngOnInit() {

    // setTimeout(() => {
    //   this.moveInfo();
    // }, 2000);
  }






  @HostListener('window:resize', ['$event'])
  checkMoveInfo() {
    this.map.invalidateSize();
    // let parent: HTMLElement;
    // if(this.viewContainer.nativeElement.offsetWidth < 500) {
    //   parent = this.p1.nativeElement;
    // }
    // else {
    //   parent = this.p2.nativeElement;
    // }
    // if(this.dsInfo.nativeElement.parentElement != parent) {
    //   this.moveChild(this.dsInfo.nativeElement, parent);
    // }
  }

  moveChild(child, parent) {
    child.parentElement.removeChild(child);
    parent.appendChild(child);
  }

  startResize(touch: boolean): boolean {

    let moveHandler = (event: MouseEvent) => {
      let dragbar: HTMLElement = this.dragbar.nativeElement;
      let mapContainer: HTMLElement = this.mapContainer.nativeElement;
      //offset to midpoint of dragbar
      let dragbarOffset = dragbar.clientWidth / 2;
      let left = mapContainer.getBoundingClientRect().left;
      let x = event.clientX - left - dragbarOffset;
      x = Math.max(0, x);
      this.mapWidth = x + "px";
      this.checkMoveInfo();

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

      this.map.invalidateSize();

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
    console.log(this.viewNav);
    this.viewNav.close();
  }

}


interface DragState {
  lastEvent: MouseEvent,
  moveHandler: (event: MouseEvent) => boolean
}
