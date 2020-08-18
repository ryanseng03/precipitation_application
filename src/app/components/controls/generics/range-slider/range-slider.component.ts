import { Component, OnInit, ViewChild, Output, Input, OnChanges } from '@angular/core';
import { Subject, BehaviorSubject } from "rxjs";
import { UtilityService } from "../../../../services/utility/utility.service";
import { FormControl } from '@angular/forms';


interface SliderInfo {
  getLowerBound: () => number,
  getUpperBound: () => number,
  updateValue: (pxOffset: number) => void
  formControl: FormControl
}

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

  @Output() lower: Subject<number>;
  @Output() upper: Subject<number>;

  @Input() min: number = 0;
  @Input() max: number = 100;
  @Input() intervals: number = 0;
  // @Input() width: number = 500;

  trackWidth: number;
  intervalsWidth: number;
  expandPX = 4;

  getValueFromPXOff(offset: number): number {
    let ratio = offset / this.trackWidth;
    let diff = this.max - this.min;
    let valOffset = diff * ratio;
    let value = this.min + valOffset;
    return value;
  }

  getPXOffFromValue(value: number) {
    let valOffset = value - this.min;
    let range = this.max - this.min;
    let ratio = valOffset / range;
    let pxOffset = this.trackWidth * ratio;
    return pxOffset;
  }

  constructor(private util: UtilityService) {
    this.lower = new Subject<number>();
    this.upper = new Subject<number>();
  }

  sliderOptions: {
    lower: SliderInfo
    upper: SliderInfo
  }

  ngOnInit() {

    this.trackWidth = this.track.nativeElement.offsetWidth;
    //let sliderRange = [this.sliderL.nativeElement.offsetLeft, this.sliderR.nativeElement.offsetLeft + this.trackWidth];

    this.sliderOptions = {
      lower: {
        getLowerBound: () => {
          return -5;
        },
        getUpperBound: () => {
          return this.sliderR.nativeElement.offsetLeft - 10;
        },
        updateValue: (pxOffset: number) => {
          let value = this.getValueFromPXOff(pxOffset);
          this.sliderOptions.lower.formControl.setValue(value);
          this.lower.next(this.getValueFromPXOff(pxOffset));
        },
        formControl: new FormControl(this.min, {updateOn: "blur"})
      },
      upper: {
        getLowerBound: () => {
          return this.sliderL.nativeElement.offsetLeft + 10;
        },
        getUpperBound: () => {
          return this.trackWidth - 5;
        },
        updateValue: (pxOffset: number) => {
          let value = this.getValueFromPXOff(pxOffset);
          this.sliderOptions.upper.formControl.setValue(value);
          this.upper.next(value);
        },
        formControl: new FormControl(this.max, {updateOn: "blur"})
      }
    }

    let lastValidL = this.min;
    let reboundL = false;
    this.sliderOptions.lower.formControl.valueChanges.subscribe((value: string) => {
      if(!reboundL) {
        let numval = Number.parseFloat(value);
        //if cant parse to a number set to the last valid value that was set
        if(Number.isNaN(numval)) {
          numval = lastValidL;
        }
        lastValidL = numval;
        reboundL = true;
        this.sliderOptions.lower.formControl.setValue(numval);
      }
      else { 
        reboundL = false;
      }

    });
    let lastValidR = this.max;
    this.sliderOptions.lower.formControl.valueChanges.subscribe((value: any) => {
      console.log(value);
    });
    
    this.setupSlider(this.sliderL.nativeElement, this.sliderOptions.lower);
    this.setupSlider(this.sliderR.nativeElement, this.sliderOptions.upper);
    
  }

  updateFillSeg() {
    this.segFill.nativeElement.style.left = this.sliderL.nativeElement.offsetLeft;
    this.segFill.nativeElement.style.width = this.sliderR.nativeElement.offsetLeft - this.sliderL.nativeElement.offsetLeft;
  }

  setupSlider(slider: HTMLElement, info: SliderInfo) {
    if(this.intervals > 0) {
      this.intervalsWidth = this.trackWidth / this.intervals;
    }

    let getMovFunct = (mouseInit: MouseEvent) => {
      let leftRange = [info.getLowerBound(), info.getUpperBound()];
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

        info.updateValue(newSliderPos);

        //console.log(newSliderPos);
        slider.style.left = newSliderPos + "px";
        this.updateFillSeg();
      }
    }
    
    
    slider.addEventListener("mousedown", (e: MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      // this.popup.nativeElement.classList.remove("hide");
      // this.popup.nativeElement.classList.add("show");
      slider.style.width = slider.clientWidth + this.expandPX + "px";
      slider.style.height = slider.clientHeight + this.expandPX + "px";
      slider.style.top = slider.offsetTop - this.expandPX / 2 + "px";
      let transDefault = slider.style.transform;
      slider.style.transform = "translateX(-" + this.expandPX / 2 + "px)";
      let cursorDefault = document.body.style.cursor;
      document.body.style.cursor = "grabbing";
      let movFunct = getMovFunct(e);
      window.addEventListener("mousemove", movFunct);

      let mupFunct = () => {
        // this.popup.nativeElement.classList.remove("show");
        // this.popup.nativeElement.classList.add("hide");
        
        
        slider.style.width = slider.clientWidth - this.expandPX + "px";
        console.log(slider.style.width);
        slider.style.height = slider.clientHeight - this.expandPX + "px";
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
