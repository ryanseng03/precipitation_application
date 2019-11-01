import { Component, OnInit, ViewChild, Output } from '@angular/core';
import { Subject } from "rxjs";

@Component({
  selector: 'app-range-slider',
  templateUrl: './range-slider.component.html',
  styleUrls: ['./range-slider.component.scss']
})
export class RangeSliderComponent implements OnInit {

  @ViewChild("sliderR") sliderR;
  @ViewChild("sliderL") sliderL;
  @ViewChild("track") track;
  @Output() values: Subject<number>[] = [];

  trackWidth: number;
  intervals = 0;
  intervalsWidth: number;
  leftRange: [number, number];
  expandPX = 4;

  constructor() { }

  ngOnInit() {

    console.log(this.track.nativeElement.offsetWidth);
    this.trackWidth = this.track.nativeElement.offsetWidth;
    if(this.intervals > 0) {
      this.intervalsWidth = this.trackWidth / this.intervals;
    }
    this.leftRange = [this.sliderR.nativeElement.offsetLeft, this.sliderR.nativeElement.offsetLeft + this.trackWidth];

    let getMovFunct = (mouseInit: MouseEvent) => {
      let initPos = this.sliderR.nativeElement.offsetLeft;
      return (e: MouseEvent) => {
        //console.log(e);
        e.stopPropagation();
        e.preventDefault();
        let deltaX = e.clientX - mouseInit.clientX;
        if(this.intervals > 0) {
          deltaX = this.roundToInterval(deltaX, this.intervalsWidth);
        }
        
        let newSliderPos = Math.round(initPos + deltaX);
        //lock to range
        if(newSliderPos < this.leftRange[0]) {
          newSliderPos = this.leftRange[0];
        }
        else if(newSliderPos > this.leftRange[1]) {
          newSliderPos = this.leftRange[1];
        }
        //console.log(newSliderPos);
        this.sliderR.nativeElement.style.left = newSliderPos + "px";
      }
    }
    
    
    this.sliderR.nativeElement.addEventListener("mousedown", (e: MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      this.sliderR.nativeElement.style.width = this.sliderR.nativeElement.offsetWidth + this.expandPX + "px";
      this.sliderR.nativeElement.style.height = this.sliderR.nativeElement.offsetHeight + this.expandPX + "px";
      this.sliderR.nativeElement.style.top = this.sliderR.nativeElement.offsetTop - this.expandPX / 2 + "px";
      let transDefault = this.sliderR.nativeElement.style.transform;
      this.sliderR.nativeElement.style.transform = "translateX(-" + this.expandPX / 2 + "px)";
      let cursorDefault = document.body.style.cursor;
      document.body.style.cursor = "grabbing";
      let movFunct = getMovFunct(e);
      window.addEventListener("mousemove", movFunct);

      let mupFunct = () => {
        this.sliderR.nativeElement.style.width = this.sliderR.nativeElement.offsetWidth - this.expandPX + "px";
        this.sliderR.nativeElement.style.height = this.sliderR.nativeElement.offsetHeight - this.expandPX + "px";
        this.sliderR.nativeElement.style.top = this.sliderR.nativeElement.offsetTop + this.expandPX / 2 + "px";
        this.sliderR.nativeElement.style.transform = transDefault;
        document.body.style.cursor = cursorDefault;
        window.removeEventListener("mousemove", movFunct);
        window.removeEventListener("mouseup", mupFunct);
      }

      window.addEventListener("mouseup", mupFunct);
    });

    
  }


  roundToInterval = (value: number, interval: number, direction: "up" | "down" | "nearest" = "nearest"): number => {
    let sign = Math.sign(value);
    let abs = Math.abs(value);
    let roundingFunct: (value: number) => number;
    switch(direction) {
      case "down": {
        roundingFunct = Math.floor;
        break;
      }
      case "up": {
        roundingFunct = Math.ceil;
        break;
      }
      case "nearest": {
        roundingFunct = Math.round;
        break;
      }
    }
    return roundingFunct(abs / interval) * interval * sign;
  }
}
