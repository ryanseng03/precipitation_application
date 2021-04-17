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

  //debounce scroll after go to nav, no reason to do computations
  scrollDebounce: boolean = false;
  goToNav(nav: NavData) {
    let component = nav.element;
    let top = component.offsetTop;
    let containerElement: HTMLElement = this.viewContainer.nativeElement;

    this.scrollDebounce = true;
    containerElement.scroll({
      //add one to top to avoid weird partial pixel errors in chrome for some displays
      top: top + 1,
      left: 0,
      behavior: "smooth"
    });

    //set active nav ref
    this.activeTileRef = nav;
  }

  // [ngStyle]="{'padding-right': getScrollBarWidth(viewContainer)}"
  containerScroll(e: Event): void {
    let containerElement: HTMLElement = this.viewContainer.nativeElement;
    let lastScrollLocal = this.lastScrollPos;
    this.lastScrollPos = containerElement.scrollTop;
    clearTimeout(this.scrollTimeoutHandle);
    this.scrollTimeoutHandle = setTimeout(() => {
      if(!this.scrollDebounce) {
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
      }
      else {
        this.scrollDebounce = false;
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
      //offsetHeight includes everything
      let height = element.offsetHeight;
      let lower = upper + height;
      //if container upper bound is above element lower bound then there's some overlap (top bound handled in previous iters)
      if(containerUpper < lower) {
        console.log(i, containerUpper, containerLower, upper, lower);
        //if lower bound of container is in element lower bound then container is within element
        if(containerLower <= lower) {
          inContainer = {
            focus: data
          };
          break;
        }
        //otherwise stradles boundary
        else {
          inContainer = {
            between: {
              upper: data,
              lower: this.navInfo[i + 1]
            }
          }
          break;
        }
      }
      //otherwise no overlap, keep going
      //set top of next div
      upper = lower;
    }
    return inContainer;
  }

}

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
