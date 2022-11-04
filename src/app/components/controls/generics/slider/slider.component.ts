import { Component, OnInit, ViewChild, Output } from '@angular/core';
import { Subject } from "rxjs";

@Component({
  selector: 'app-slider',
  templateUrl: './slider.component.html',
  styleUrls: ['./slider.component.scss']
})
export class SliderComponent implements OnInit {

  @ViewChild("slider") slider;
  @ViewChild("track") track;
  @Output() values: Subject<number>[] = [];

  trackWidth: number;
  intervals = 0;
  intervalsWidth: number;
  leftRange: [number, number];
  expandPX = 4;

  constructor() { }

  ngOnInit() {
    this.trackWidth = this.track.nativeElement.offsetWidth;
    if(this.intervals > 0) {
      this.intervalsWidth = this.trackWidth / this.intervals;
    }
    this.leftRange = [this.slider.nativeElement.offsetLeft, this.slider.nativeElement.offsetLeft + this.trackWidth];

    let getMovFunct = (mouseInit: MouseEvent) => {
      let initPos = this.slider.nativeElement.offsetLeft;
      return (e: MouseEvent) => {
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
        this.slider.nativeElement.style.left = newSliderPos + "px";
      }
    }


    this.slider.nativeElement.addEventListener("mousedown", (e: MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      this.slider.nativeElement.style.width = this.slider.nativeElement.offsetWidth + this.expandPX + "px";
      this.slider.nativeElement.style.height = this.slider.nativeElement.offsetHeight + this.expandPX + "px";
      this.slider.nativeElement.style.top = this.slider.nativeElement.offsetTop - this.expandPX / 2 + "px";
      let transDefault = this.slider.nativeElement.style.transform;
      this.slider.nativeElement.style.transform = "translateX(-" + this.expandPX / 2 + "px)";
      let cursorDefault = document.body.style.cursor;
      document.body.style.cursor = "grabbing";
      let movFunct = getMovFunct(e);
      window.addEventListener("mousemove", movFunct);

      let mupFunct = () => {
        this.slider.nativeElement.style.width = this.slider.nativeElement.offsetWidth - this.expandPX + "px";
        this.slider.nativeElement.style.height = this.slider.nativeElement.offsetHeight - this.expandPX + "px";
        this.slider.nativeElement.style.top = this.slider.nativeElement.offsetTop + this.expandPX / 2 + "px";
        this.slider.nativeElement.style.transform = transDefault;
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

export interface SliderOptions {
  style: "left" | "right" | "center";
}

export interface FenceOptions {
  color: string;
}
