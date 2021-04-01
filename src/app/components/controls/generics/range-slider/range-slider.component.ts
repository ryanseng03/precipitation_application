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

  sliderControlData: TwoSidedSlider;
  @Input() set range(range: [number, number]) {
    this._range = range;
    if(this.sliderControlData) {
      this.sliderControlData.setRange(range);
    }
  };
  @Input() intervals: number = 0;
  // @Input() width: number = 500;
  @Input() control: FormControl;


  intervalsWidth: number;
  expandPX: number;

  inputControls: {
    left: FormControl,
    right: FormControl
  };




  constructor(private util: UtilityService) {
    // this.lower = new Subject<number>();
    // this.upper = new Subject<number>();
  }

  ngOnInit() {
    this.expandPX = 4;
    let sliderWidth = 6;
    let trackLockOffset = 2;
    let trackWidth = 100;

    let sliderControlData = new TwoSidedSlider(this.sliderL.nativeElement, this.sliderR.nativeElement, sliderWidth, trackWidth, trackLockOffset, this._range);
    this.sliderControlData = sliderControlData;

    let leftVal = sliderControlData.getValue("left");
    let rightVal = sliderControlData.getValue("right");

    //form controls should be linked!!!!

    this.inputControls = {
      left: new FormControl(leftVal),
      right: new FormControl(rightVal)
    };

    //value observers
    let lObs = sliderControlData.getValueObservable("left");
    let rObs = sliderControlData.getValueObservable("right");

    
    let userInput = true;
    //when slider changes value update input controls
    lObs.subscribe((value: number) => {
      //not user input, don't run validation/slider update in input control listener
      userInput = false;
      this.inputControls.left.setValue(value);
    });
    rObs.subscribe((value: number) => {
      //not user input, don't run validation/slider update in input control listener
      userInput = false;
      this.inputControls.right.setValue(value);
    });


    let lastValidL = leftVal;
    
    this.inputControls.left.valueChanges.subscribe((value: string) => {
      //only run for user input
      if(userInput) {
        let numval = Number.parseFloat(value);
        //if cant parse to a number set to the last valid value that was set
        if(Number.isNaN(numval)) {
          numval = lastValidL;
        }

        //set last valid value for reversion on invalid input
        lastValidL = numval;

        //make sure no rebound when setting value
        userInput = false;

        //update slider to new value (will also update this control to post validation value)
        sliderControlData.updateSlider("left", "val", numval);
      }
      else {
        userInput = true;
      }
    });

    let lastValidR = rightVal;
    this.inputControls.right.valueChanges.subscribe((value: any) => {
      //only run for user input
      if(userInput) {
        let numval = Number.parseFloat(value);
        //if cant parse to a number set to the last valid value that was set
        if(Number.isNaN(numval)) {
          numval = lastValidR;
        }

        //set last valid value for reversion on invalid input
        lastValidR = numval;

        //make sure no rebound when setting value
        userInput = false;

        //update slider to new value (will also update this control to post validation value)
        sliderControlData.updateSlider("right", "val", numval);
      }
      else {
        userInput = true;
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

    //initialize sliders
    this.updateSlider("left", "val", min);
    this.updateSlider("right", "val", max);
  }

  getValue(side: "left" | "right"): number {
    let value = this.data[side].control.value;
    return value;
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
