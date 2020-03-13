import { Component, OnInit, ViewChild, Output } from '@angular/core';
import { Subject } from "rxjs";
import { UtilityService } from "../../../../services/utility/utility.service";

@Component({
  selector: 'app-range-slider',
  templateUrl: './range-slider.component.html',
  styleUrls: ['./range-slider.component.scss']
})
export class RangeSliderComponent implements OnInit {

  @ViewChild("sliderR") sliderR;
  @ViewChild("sliderL") sliderL;
  @ViewChild("track") track;
  @ViewChild("segFill") segFill;
  @ViewChild("popup") popup;
  @ViewChild("popupText") popupText;
  @Output() values: Subject<number>[] = [];

  trackWidth: number;
  intervals = 5;
  intervalsWidth: number;
  expandPX = 4;

  constructor(private util: UtilityService) { }

  ngOnInit() {

    console.log(this.track.nativeElement.offsetWidth);

    this.trackWidth = this.track.nativeElement.offsetWidth;

    let sliderRange = [this.sliderL.nativeElement.offsetLeft, this.sliderR.nativeElement.offsetLeft + this.trackWidth];
    
    this.setupSlider(this.sliderL.nativeElement, () => {
      return sliderRange[0];
    }, () => {
      return this.sliderR.nativeElement.offsetLeft - 10;
    });
    this.setupSlider(this.sliderR.nativeElement, () => {
      return this.sliderL.nativeElement.offsetLeft + 10;
    }, () => {
      return sliderRange[1];
    });
    
  }

  updateFillSeg() {
    this.segFill.nativeElement.style.left = this.sliderL.nativeElement.offsetLeft;
    this.segFill.nativeElement.style.width = this.sliderR.nativeElement.offsetLeft - this.sliderL.nativeElement.offsetLeft;
  }

  setupSlider(slider: HTMLElement, getLowerBound: () => number, getUpperBound: () => number) {
    if(this.intervals > 0) {
      this.intervalsWidth = this.trackWidth / this.intervals;
    }

    let getMovFunct = (mouseInit: MouseEvent) => {
      let leftRange = [getLowerBound(), getUpperBound()];
      let initPos = slider.offsetLeft;
      return (e: MouseEvent) => {
        //console.log(e);
        e.stopPropagation();
        e.preventDefault();
        let deltaX = e.clientX - mouseInit.clientX;
        if(this.intervals > 0) {
          deltaX = this.util.roundToInterval(deltaX, this.intervalsWidth);
        }
        
        let newSliderPos = Math.round(initPos + deltaX);
        //lock to range
        if(newSliderPos < leftRange[0]) {
          newSliderPos = leftRange[0];
        }
        else if(newSliderPos > leftRange[1]) {
          newSliderPos = leftRange[1];
        }
        //console.log(newSliderPos);
        slider.style.left = newSliderPos + "px";
        this.updateFillSeg();
      }
    }
    
    
    slider.addEventListener("mousedown", (e: MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      this.popup.nativeElement.classList.remove("hide");
      this.popup.nativeElement.classList.add("show");
      slider.style.width = slider.offsetWidth + this.expandPX + "px";
      slider.style.height = slider.offsetHeight + this.expandPX + "px";
      slider.style.top = slider.offsetTop - this.expandPX / 2 + "px";
      let transDefault = slider.style.transform;
      slider.style.transform = "translateX(-" + this.expandPX / 2 + "px)";
      let cursorDefault = document.body.style.cursor;
      document.body.style.cursor = "grabbing";
      let movFunct = getMovFunct(e);
      window.addEventListener("mousemove", movFunct);

      let mupFunct = () => {
        this.popup.nativeElement.classList.remove("show");
        this.popup.nativeElement.classList.add("hide");
        
        
        slider.style.width = slider.offsetWidth - this.expandPX + "px";
        slider.style.height = slider.offsetHeight - this.expandPX + "px";
        slider.style.top = slider.offsetTop + this.expandPX / 2 + "px";
        slider.style.transform = transDefault;
        document.body.style.cursor = cursorDefault;
        window.removeEventListener("mousemove", movFunct);
        window.removeEventListener("mouseup", mupFunct);
      }

      window.addEventListener("mouseup", mupFunct);
    });
  }



}
