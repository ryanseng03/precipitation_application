import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';

@Component({
  selector: 'app-view-container',
  templateUrl: './view-container.component.html',
  styleUrls: ['./view-container.component.scss']
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
  navOrder:HTMLElement[];

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
    this.navOrder = [this.formComponent.nativeElement, this.tableComponent.nativeElement, this.timeSeriesComponent.nativeElement];

  }

  goToComponent(component: HTMLElement) {
    console.log(component);
    let top = component.offsetTop;
    console.log(top);
    let containerElement: HTMLElement = this.viewContainer.nativeElement; 
    containerElement.scroll({
      top: top,
      left: 0,
      behavior: "smooth"
    });
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
          this.goToComponent(divsBetween.upper);
        }
      }
      //scrolling down
      else if(scrollDelta > 0) {
        let divsBetween = this.betweenDivs();
        if(divsBetween) {
          this.goToComponent(divsBetween.lower);
        }
      }
      console.log(containerElement.scrollTop);
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
    for(let i = 0; i < this.navOrder.length - 1; i++) {
      let element = this.navOrder[i];
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
          upper: element,
          lower: this.navOrder[i + 1]
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
  upper: HTMLElement,
  lower: HTMLElement
}
