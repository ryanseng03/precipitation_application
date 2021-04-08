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
      //scrolling up
      if(scrollDelta < 0) {
        let divsBetween = this.betweenDivs();
        if(divsBetween) {
          this.goToNav(divsBetween.upper);
        }
      }
      //scrolling down
      else if(scrollDelta > 0) {
        let divsBetween = this.betweenDivs();
        if(divsBetween) {
          this.goToNav(divsBetween.lower);
        }
      }
    }, this.scrollTimeout);

  }

  //check if view container between component divs
  betweenDivs(): DivsBetween {
    let between: DivsBetween = null;
    let containerElement: HTMLElement = this.viewContainer.nativeElement;
    let containerUpper = containerElement.scrollTop;
    let containerLower = containerUpper + containerElement.clientHeight;
    let upper = 0;
    //length -1 because don't have to do last element (has to be inside last element if none in others)
    for(let i = 0; i < this.navInfo.length - 1; i++) {
      let data = this.navInfo[i];
      let element = data.element;
      //is the container within this element, stradling lower boundary, or outside
      let alignment: ElementAlignment = "none";
      let height = element.clientHeight;
      let lower = upper + height;
      //if container upper bound is above element lower bound then there's some overlap (top bound handled in previous iters)
      if(containerUpper <= lower) {
        console.log(i, containerLower, lower);
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
        break;
      }
      //stradling lower boundary, set between and break
      else if(alignment == "over") {
        between = {
          upper: data,
          lower: this.navInfo[i + 1]
        }
        break;
      }
      //otherwise no overlap, keep going
      //set top of next div
      upper = lower;
    }
    return between;
  }

}

type ElementAlignment = "within" | "over" | "none";

interface DivsBetween {
  upper: NavData,
  lower: NavData
}

interface NavData {
  label: string,
  element: HTMLElement,
}
