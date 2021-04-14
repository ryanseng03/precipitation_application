import { trigger, state, style, transition, animate } from '@angular/animations';
import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';

@Component({
  selector: 'app-view-container',
  templateUrl: './view-container.component.html',
  styleUrls: ['./view-container.component.scss'],
  animations: [trigger("selectColor", [
    state("selected", style({
      backgroundColor: "#175db6",
      color: "white"
  })),
    state("deselected", style({})),
    transition("selected <=> deselected", [
      animate("0.4s")
    ])
  ])]
})
export class ViewContainerComponent implements OnInit {

  @ViewChild("viewContainer") viewContainer: ElementRef;
  @ViewChild("formComponent") formComponent: ElementRef;
  @ViewChild("tableComponent") tableComponent: ElementRef;
  @ViewChild("timeSeriesComponent") timeSeriesComponent: ElementRef;


  nav2Component: {
    form: ElementRef,
    table: ElementRef,
    timeSeries: ElementRef
  };
  scrollTimeoutHandle: NodeJS.Timer;
  lastScrollPos: number;
  scrollTimeout: number = 100;
  navInfo: NavData[];
  activeTileRef: NavData;

  scrollbarWidthThrottle: NodeJS.Timer;
  scrollbarWidthPause: boolean = false;
  scrollbarWidth: string;

  constructor() {
    this.scrollTimeoutHandle = null;
  }

  ngOnInit() {
    this.nav2Component = {
      form: this.formComponent,
      table: this.tableComponent,
      timeSeries: this.timeSeriesComponent
    };
    let containerElement: HTMLElement = this.viewContainer.nativeElement;
    this.lastScrollPos = containerElement.scrollTop;
    this.navInfo = [{
      label: "Dataset",
      element: this.formComponent.nativeElement
    },
    {
      label: "Stations",
      element: this.tableComponent.nativeElement
    },
    {
      label: "Time Series",
      element: this.timeSeriesComponent.nativeElement
    }];
    this.activeTileRef = this.navInfo[0];

  }

  getScrollBarWidth(element: HTMLElement): string {
    let scrollbarWidth: string;
    //weird workaround for ExpressionChangedAfterItHasBeenCheckedError in dev (also potentially good for performance in prod for changing scrollbars)
    if(this.scrollbarWidthPause) {
      scrollbarWidth = this.scrollbarWidth;
    }
    else {
      this.scrollbarWidthPause = true;
      let throttle = 10;
      setTimeout(() => {
        this.scrollbarWidthPause = false;
      }, throttle);
      scrollbarWidth = element.offsetWidth - element.clientWidth + "px";
      this.scrollbarWidth = scrollbarWidth;
    }
    return scrollbarWidth;

  }

  goToNav(nav: NavData) {
    let component = nav.element;
    let top = component.offsetTop;
    let containerElement: HTMLElement = this.viewContainer.nativeElement;
    containerElement.scroll({
      top: top,
      left: 0,
      behavior: "smooth"
    });
    //set active nav ref
    this.activeTileRef = nav;
  }

  containerScroll(e: Event): void {
    let containerElement: HTMLElement = this.viewContainer.nativeElement;
    let lastScrollLocal = this.lastScrollPos;
    this.lastScrollPos = containerElement.scrollTop;
    clearTimeout(this.scrollTimeoutHandle);
    this.scrollTimeoutHandle = setTimeout(() => {
      let scrollDelta = this.lastScrollPos - lastScrollLocal;
      let inContainer = this.divsInContainer();
      if(inContainer.between) {
        let scrollDir = "upper";
        if(scrollDelta > 0) {
          scrollDir = "lower";
        }
        this.goToNav(inContainer.between[scrollDir]);
      }
      //set active tile to item in container if completely contained (otherwise handled by goToNav)
      else {
        this.activeTileRef = inContainer.focus;
      }
    }, this.scrollTimeout);
  }

  //check if view container between component divs
  divsInContainer(): InContainer {
    let inContainer: InContainer = {
      focus: this.navInfo[this.navInfo.length - 1]
    };
    let containerElement: HTMLElement = this.viewContainer.nativeElement;
    let containerUpper = containerElement.scrollTop;
    //client height, only stuff in view (excludes scrollbar etc)
    let containerLower = containerUpper + containerElement.clientHeight;
    let upper = 0;
    //length -1 because don't have to do last element (has to be inside last element if none in others)
    for(let i = 0; i < this.navInfo.length - 1; i++) {
      let data = this.navInfo[i];
      let element = data.element;
      //is the container within this element, stradling lower boundary, or outside
      let alignment: ElementAlignment = "none";
      //offsetHeight includes everything
      let height = element.offsetHeight;
      let lower = upper + height;
      //if container upper bound is above element lower bound then there's some overlap (top bound handled in previous iters)
      if(containerUpper < lower) {
        //if lower bound of container is in element lower bound then container is within element
        if(containerLower <= lower) {
          alignment = "within";
        }
        //otherwise stradles boundary
        else {
          alignment = "over"
        }
      }
      //fully within an element, leave as null, break and return
      if(alignment == "within") {
        inContainer = {
          focus: data
        };
        break;
      }
      //stradling lower boundary, set between and break
      else if(alignment == "over") {
        inContainer = {
          between: {
            upper: data,
            lower: this.navInfo[i + 1]
          }
        }
        break;
      }
      //otherwise no overlap, keep going
      //set top of next div
      upper = lower;
    }
    return inContainer;
  }

}

type ElementAlignment = "within" | "over" | "none";

interface InContainer {
  between?: {
    upper: NavData,
    lower: NavData
  }
  focus?: NavData
}

interface NavData {
  label: string,
  element: HTMLElement,
}
