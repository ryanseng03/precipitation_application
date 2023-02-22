import { trigger, state, style, transition, animate } from '@angular/animations';
import { Component, OnInit, ViewChild, ElementRef, HostListener, Input } from '@angular/core';
import moment, { Moment } from 'moment';
import { VisDatasetItem } from 'src/app/services/dataset-form-manager.service';
import { EventParamRegistrarService } from 'src/app/services/inputManager/event-param-registrar.service';
import { ScrollbarWidthCalcService } from 'src/app/services/scrollbar-width-calc.service';

@Component({
  selector: 'app-view-container',
  templateUrl: './view-container.component.html',
  styleUrls: ['./view-container.component.scss'],
  animations: [trigger("selectColor", [
    state("selected", style({
      backgroundColor: "#175db6",
      color: "white",
      fill: "white"
  })),
    state("deselected", style({})),
    transition("selected <=> deselected", [
      animate("0.4s")
    ])
  ])]
})
export class ViewContainerComponent implements OnInit {

  @ViewChild("viewContainer", {static: true}) viewContainer: ElementRef;
  @ViewChild("formComponent", {static: true}) formComponent: ElementRef;
  @ViewChild("tableComponent", {static: false}) tableComponent: ElementRef;
  @ViewChild("timeseriesComponent", {static: false}) timeseriesComponent: ElementRef;
  @ViewChild("viewNav", {static: false}) viewNav: ElementRef;

  @ViewChild("dateControlComponent", {static: false}) dateControlComponent: ElementRef;

  //set scrollbar width the first time becomes visible
  // scrollbarSet: boolean = false;
  //just set scrollbar width once for efficiency, on macs it's fine to have the scrollbar visible while scrolling
  //also it seems like getting the scrollbar width on a mac might not work even while scrolling
  @Input() set visible(state: boolean) {
    if(state) {
      let element: HTMLElement = this.viewContainer.nativeElement;
      let scrollbarWidth: number = this.scrollWidthService.getScrollbarWidth();
      element.style.paddingRight = scrollbarWidth + "px";
    }
  }
  _width: number;
  @Input() set width(width: number) {
    //instead of using width just use the width of the view container
    let viewNavEl: HTMLElement = this.viewContainer.nativeElement;
    let navWidth = viewNavEl.clientWidth;
    //subtract 40, 20 padding on each side
    this._width = navWidth - 40;
  }

  date: Moment;

  nav2Component: {
    form: ElementRef,
    table: ElementRef,
    timeseries: ElementRef
  };
  scrollTimeoutHandle: NodeJS.Timer;
  lastScrollPos: number;
  scrollTimeout: number = 100;
  navInfo: NavData[];
  activeTileRef: NavData;

  upperBuffer: string;

  firstElement: HTMLElement;
  dateDebounce: boolean = false;

  temp_start = moment("1990-01-01");
  temp_end = moment("2022-01-01");
  temp_period = "month";

  includeStations: boolean;


  constructor(private scrollWidthService: ScrollbarWidthCalcService, private paramService: EventParamRegistrarService) {
    this.scrollTimeoutHandle = null;
    this.navInfo = [];
  }

  ngOnInit() {
    let defaultActive = {
      label: "Dataset",
      element: this.formComponent.nativeElement
    };
    this.activeTileRef = defaultActive;
    this.nav2Component = {
      form: this.formComponent,
      table: this.tableComponent,
      timeseries: this.timeseriesComponent
    };
    let containerElement: HTMLElement = this.viewContainer.nativeElement;
    this.lastScrollPos = containerElement.scrollTop;

    this.firstElement = this.formComponent.nativeElement;

    this.paramService.createParameterHook(EventParamRegistrarService.EVENT_TAGS.dataset, (dataset: VisDatasetItem) => {
      if(dataset) {
        if(dataset.includeStations) {
          this.includeStations = true;
          setTimeout(() => {
            this.navInfo = [defaultActive,
            {
              label: "Stations",
              element: this.tableComponent.nativeElement
            },
            {
              label: "Time Series",
              element: this.timeseriesComponent.nativeElement
            }];
          }, 0);
        }
        else {
          this.navInfo = [];
          this.includeStations = false;
        }
        this.activeTileRef = defaultActive;
      }
    });
  }



  //resizing the window can scroll the container div causing it to trigger on another element, so fix that

  @HostListener("window:resize", ["$event"])
  fixResizeScroll() {
    this.goToNav(this.activeTileRef);
  }



  //note removed debounce because weird offsets make it difficult to debounce where not actually scrolling, should be fine without debounce given offset to prevent boundary issues
  goToNav(nav: NavData) {
    let component = nav.element;
    let containerElement: HTMLElement = this.viewContainer.nativeElement;

    let top: number = 0;
    if(component != this.firstElement) {
      let elTop = component.offsetTop;
      //top padding - 95 (date control) - 20 (padding)
      top = elTop + 125;
    }

    containerElement.scroll({
      //add one to top to avoid weird partial pixel errors in chrome for some displays
      top: top,
      left: 0,
      behavior: "smooth"
    });

    //set active nav ref
    this.activeTileRef = nav;
  }

  // [ngStyle]="{'padding-right': getScrollBarWidth(viewContainer)}"
  containerScroll(e: Event): void {
    //only manage scroll logic if there are navs
    if(this.navInfo.length > 0) {
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




  getDateControlWidth(): string {
    let components = [this.viewContainer, this.formComponent, this.tableComponent, this.timeseriesComponent];
    let max = 0;
    for(let component of components) {
      if(component) {
        let element: HTMLElement = component.nativeElement;
        let width = element.clientWidth;
        if(width > max) {
          max = width;
        }
      }
    }
    return max + "px";
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
