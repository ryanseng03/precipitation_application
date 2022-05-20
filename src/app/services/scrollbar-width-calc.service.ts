import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ScrollbarWidthCalcService {

  private scrollbarWidth: number;

  constructor() {
    var scrollDiv = document.createElement("div");
    scrollDiv.setAttribute("style", "overflow:scroll");

    document.body.appendChild(scrollDiv);

    //calculate the scrollbar width
    let scrollbarWidth: number = scrollDiv.offsetWidth - scrollDiv.clientWidth;
    this.scrollbarWidth = scrollbarWidth;

    //delete
    document.body.removeChild(scrollDiv);
  }

  getScrollbarWidth(): number {
    return this.scrollbarWidth;
  }
}
