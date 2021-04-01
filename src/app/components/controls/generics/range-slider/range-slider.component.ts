import { Component, OnInit, ViewChild, Output, Input, OnChanges } from '@angular/core';
import { Subject, BehaviorSubject, Observable } from "rxjs";
import { UtilityService } from "../../../../services/utility/utility.service";
import { FormControl } from '@angular/forms';
import { element } from '@angular/core/src/render3';


interface SliderInfo {
  getPXOffFromValue: (value: number) => number,
  getValueFromPXOff(offset: number): number,
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

  // @Output() lower: Subject<number>;
  // @Output() upper: Subject<number>;

  private _range: [number, number];

  @Input() set range(range: [number, number]) {
    this._range = range;
    //set max in class
  };
  @Input() intervals: number = 0;
  // @Input() width: number = 500;
  @Input() control: FormControl;

  trackWidth: number;
  intervalsWidth: number;
  expandPX = 4;
  sliderWidth: number;
  trackLockOffset: number;





  constructor(private util: UtilityService) {
    // this.lower = new Subject<number>();
    // this.upper = new Subject<number>();
  }

  sliderOptions: {
    lower: SliderInfo
    upper: SliderInfo
  }

  ngOnInit() {

    this.sliderWidth = 6;

    this.trackLockOffset = 2;

    //shifted 5px on each side so width for evaluative purposes is -10
    this.trackWidth = this.track.nativeElement.offsetWidth - this.trackLockOffset * 2;
    //let sliderRange = [this.sliderL.nativeElement.offsetLeft, this.sliderR.nativeElement.offsetLeft + this.trackWidth];

    this.sliderOptions = {
      lower: {
        getPXOffFromValue: (value: number): number => {
          let valOffset = value - this.min;
          let range = this.max - this.min;
          let ratio = valOffset / range;
          let pxOffset = this.trackWidth * ratio;
          //round to nearest pixel
          pxOffset = Math.round(pxOffset);
          return pxOffset;
        },
        getValueFromPXOff: (offset: number): number => {
          let ratio = offset / this.trackWidth;
          let diff = this.max - this.min;
          let valOffset = diff * ratio;
          let value = this.min + valOffset;
          //round value to two decimal places (if want something more precise they can type it)
          value = Math.round(value * 100) / 100;
          return value;
        },
        getLowerBound: () => {
          return this.trackLockOffset - this.sliderWidth;
        },
        getUpperBound: () => {
          return this.sliderR.nativeElement.offsetLeft - this.sliderWidth;
        },
        updateValue: (pxOffset: number) => {
          //adjust pixel offset by track lock offset and shift to right edge of slider
          let adjsustedPXOffset = pxOffset + 2 + this.sliderWidth;
          let value = this.getValueFromPXOff(adjsustedPXOffset);
          this.sliderOptions.lower.formControl.setValue(value);
          this.control.setValue({
            min: value,
            max: this.control.value.max
          });
          //this.lower.next(this.getValueFromPXOff(pxOffset));
        },
        formControl: new FormControl(this.control.value.min, {updateOn: "blur"})
      },
      upper: {
        getPXOffFromValue: (value: number): number => {
          let valOffset = value - this.min;
          let range = this.max - this.min;
          let ratio = valOffset / range;
          let pxOffset = this.trackWidth * ratio;
          //round to nearest pixel
          pxOffset = Math.round(pxOffset);
          return pxOffset;
        },
        getValueFromPXOff: (offset: number): number => {
          let ratio = offset / this.trackWidth;
          let diff = this.max - this.min;
          let valOffset = diff * ratio;
          let value = this.min + valOffset;
          //round value to two decimal places (if want something more precise they can type it)
          value = Math.round(value * 100) / 100;
          return value;
        },
        getLowerBound: () => {
          return this.sliderL.nativeElement.offsetLeft + this.sliderWidth;
        },
        getUpperBound: () => {
          return this.trackWidth - this.trackLockOffset;
        },
        updateValue: (pxOffset: number) => {
          //adjust pixel offset by track lock offset
          let adjsustedPXOffset = pxOffset + 2;
          let value = this.sliderOptions.upper.getValueFromPXOff(adjsustedPXOffset);
          this.sliderOptions.upper.formControl.setValue(value);
          this.control.setValue({
            min: this.control.value.min,
            max: value
          });
          //this.upper.next(value);
        },
        formControl: new FormControl(this.control.value.max, {updateOn: "blur"})
      }

    }
    let pxOffset = this.getPXOffFromValue(this.control.value.min);
    this.sliderL.nativeElement.style.left = pxOffset + "px";
    pxOffset = this.getPXOffFromValue(this.control.value.max);
    this.sliderR.nativeElement.style.left = pxOffset + "px";

    let lastValidL = this.min;
    let reboundL = false;
    this.sliderOptions.lower.formControl.valueChanges.subscribe((value: string) => {
      if(!reboundL) {
        let numval = Number.parseFloat(value);
        //if cant parse to a number set to the last valid value that was set
        if(Number.isNaN(numval)) {
          numval = lastValidL;
        }

        //left side shouldn't surpass right side
        let upper = this.sliderOptions.upper.formControl.value;
        if(numval > upper) {
          numval = upper;
        }
        //make sure not to excede lower bound
        if(numval < this.min) {
          numval = this.min;
        }
        //set last valid value for reversion on invalid input
        lastValidL = numval;
        //make sure no rebound when setting value
        reboundL = true;
        //set form value to mutated value
        this.sliderOptions.lower.formControl.setValue(numval);

        //set position of slider to match value
        let pxOffset = this.getPXOffFromValue(numval);
        this.sliderL.nativeElement.style.left = pxOffset + "px";
      }
      else {
        reboundL = false;
      }

    });
    let lastValidR = this.max;
    let reboundR = false;
    this.sliderOptions.upper.formControl.valueChanges.subscribe((value: any) => {
      if(!reboundR) {
        let numval = Number.parseFloat(value);
        //if cant parse to a number set to the last valid value that was set
        if(Number.isNaN(numval)) {
          numval = lastValidR;
        }

        //right side shouldn't be lower than left side
        let lower = this.sliderOptions.lower.formControl.value;
        if(numval < lower) {
          numval = lower;
        }
        //make sure not to exceed upper ound
        if(numval > this.max) {
          numval = this.max;
        }
        //set last valud value for reversion on invalid input
        lastValidR = numval;

        //make sure no rebound when setting value
        reboundR = true;
        //set form value to the mutated value
        this.sliderOptions.upper.formControl.setValue(numval);

        //set position of slider to match value
        let pxOffset = this.getPXOffFromValue(numval);
        this.sliderR.nativeElement.style.left = pxOffset + "px";
      }
      else {
        reboundR = false;
      }
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
        //console.log(slider.style.width);
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

interface SliderComponents {
  slider: Slider,
  control: FormControl,
  element: HTMLElement
}

class TwoSidedSlider {
  private data: {
    left: SliderComponents,
    right: SliderComponents
  }


  constructor(leftElement: HTMLElement, rightElement: HTMLElement, sliderWidth: number, trackWidth: number, trackLockOffset: number, valueRange: [number, number]) {
    let leftSlider = new LeftSlider(sliderWidth, trackWidth, trackLockOffset, valueRange);
    let rightSlider = new RightSlider(sliderWidth, trackWidth, trackLockOffset, valueRange);
    leftSlider.setRightBound(rightSlider);
    rightSlider.setLeftBound(leftSlider);
    let min = valueRange[0];
    let max = valueRange[1];
    //start covering the whole range
    let leftControl = new FormControl(min, {updateOn: "blur"});
    let rightControl = new FormControl(max, {updateOn: "blur"});
    this.data = {
      left: {
        slider: leftSlider,
        control: leftControl,
        element: leftElement
      },
      right: {
        slider: rightSlider,
        control: rightControl,
        element: rightElement
      }
    }
  }

  getValueObservable(side: "left" | "right"): Observable<number> {
    let valueObservable: Observable<number> = this.data[side].control.valueChanges;
    return valueObservable;
  }

  setRange(valueRange: [number, number]) {
    this.data.left.slider.setRange(valueRange);
    this.data.right.slider.setRange(valueRange);
  }

  updateSlider(side: "left" | "right", op: "val" | "left" | "move", value: number): void {
    let components = this.data[side];
    let data: SliderData;
    switch(op) {
      case "val": {
        data = components.slider.setValue(value);
        break;
      }
      case "left": {
        data = components.slider.setLeft(value);
        break;
      }
      case "move": {
        data = components.slider.moveSlider(value);
        break;
      }
    }
    components.control.setValue(data.value);
    components.element.style.left = data.left + "px";
  }
}

//provides computations for slider position, bounds, and values
abstract class Slider {
  protected left: number;
  protected value: number;
  protected sliderWidth: number;
  protected trackLockWidth: number
  protected trackLockOffset: number;
  protected trackWidth: number;
  protected valRange: [number, number];



  constructor(sliderWidth: number, trackWidth: number, trackLockOffset: number, valueRange: [number, number]) {
    this.sliderWidth = sliderWidth;
    this.trackLockWidth = trackWidth - trackLockOffset;
    this.trackLockOffset = trackLockOffset;
    this.valRange = valueRange;
  }

  getLeft(): number {
    return this.left;
  }

  getValue(): number {
    return this.value;
  }

  getData(): SliderData {
    return {
      value: this.value,
      left: this.left
    };
  }


  moveSlider(positionOffset: number): SliderData {
    let newLeft = this.left + positionOffset;
    //this handles all the rounding and updates and whatnot
    this.setLeft(newLeft);
    return this.getData();
  }

  //are we doing intervals?

  setLeft(offset: number): SliderData {
    let minLeft = this.getLowerBound();
    let maxLeft = this.getUpperBound();
    if(offset < minLeft) {
      this.left = minLeft;
    }
    else if(offset > maxLeft) {
      this.left = maxLeft;
    }
    else {
      this.left = offset
    }
    this.updateValue();
    return this.getData();
  }

  setValue(value: number): SliderData {
    let min = this.valRange[0];
    let max = this.valRange[1];
    if(value < min) {
      this.value = min;
    }
    else if(value > max) {
      this.value = max;
    }
    else {
      this.value = value;
    }
    this.updateLeft();
    return this.getData()
  }

  //if range changes then need to recompute value from slider positions
  setRange(valueRange: [number, number]) {
    this.valRange = valueRange;
    this.updateValue();
  }

  protected updateLeft(): number {
    let min = this.valRange[0];
    let max = this.valRange[1];
    let valOffset = this.value - min;
    let range = max - min;
    let ratio = valOffset / range;
    let pxOffset = this.trackLockWidth * ratio;
    //add the track lock offset and the edge offset
    pxOffset += this.trackLockOffset + this.getEdgeOffset();
    //round to nearest pixel
    pxOffset = Math.round(pxOffset);
    this.left = pxOffset;
    return pxOffset;
  }

  protected updateValue(): number {
    let min = this.valRange[0];
    let max = this.valRange[1];
    //need to subtract the offset to the edge to get value position
    let valueEdge = this.left - this.getEdgeOffset();
    let ratio = valueEdge / this.trackLockWidth;
    let diff = max - min;
    let valOffset = diff * ratio;
    let value = min + valOffset;
    //round value to two decimal places (if want something more precise they can type it)
    value = Math.round(value * 100) / 100;
    this.value = value;
    return value;
  }

  //default just the ends of the track
  protected getLowerBound(): number {
    return this.trackLockOffset + this.getEdgeOffset();
  }

  protected getUpperBound() {
    return this.trackWidth - this.trackLockOffset + this.getEdgeOffset();
  }

  //pixel shift from left edge of slider to position edge
  protected abstract getEdgeOffset(): number;
}

class LeftSlider extends Slider {
  //need to set this after constructor otherwise can't initialize one without the other...
  rightBound: Slider;

  constructor(sliderWidth: number, trackWidth: number, trackLockOffset: number, valueRange: [number, number]) {
    super(sliderWidth, trackWidth, trackLockOffset, valueRange);
  }

  setRightBound(rightBound: RightSlider) {
    this.rightBound = rightBound;
  }

  protected getEdgeOffset(): number {
    return -this.sliderWidth;
  }


  getUpperBound() {
    return this.rightBound.getLeft() - this.getEdgeOffset();
  }

}

class RightSlider extends Slider {
  leftBound: Slider;

  constructor(sliderWidth: number, trackWidth: number, trackLockOffset: number, valueRange: [number, number]) {
    super(sliderWidth, trackWidth, trackLockOffset, valueRange);
  }

  setLeftBound(leftBound: Slider) {
    this.leftBound = leftBound;
  }

  protected getEdgeOffset(): number {
    //left side is the value edge, no shift
    return 0;
  }

  getLowerBound(): number {
    return this.leftBound.getLeft() + this.getEdgeOffset();
  }

}

interface SliderData {
  value: number;
  left: number;
}
