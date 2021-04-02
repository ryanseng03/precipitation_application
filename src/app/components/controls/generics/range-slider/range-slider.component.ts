import { Component, OnInit, ViewChild, Output, Input, OnChanges } from '@angular/core';
import { Subject, BehaviorSubject, Observable } from "rxjs";
import { UtilityService } from "../../../../services/utility/utility.service";
import { FormControl } from '@angular/forms';
import { element } from '@angular/core/src/render3';


interface SideComponents {
  control: FormControl,
  element: HTMLElement,
  lastValidValue: number
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
  @Input() control: FormControl;


  expandPX: number;

  sideData: {
    left: SideComponents,
    right: SideComponents
  };

  userInput: boolean = true;


  constructor(private util: UtilityService) {
    // this.lower = new Subject<number>();
    // this.upper = new Subject<number>();
  }

  ngOnInit() {
    this.expandPX = 4;
    let sliderWidth = 6;
    let trackLockOffset = 2;
    let trackWidth = 100;

    let min = this._range[0];
    let max = this._range[1];

    //initialize value at min and max
    let sliderControlData = new TwoSidedSlider(min, max, sliderWidth, trackWidth, trackLockOffset, this._range);
    this.sliderControlData = sliderControlData;

    this.sideData = {
      left: {
        control: new FormControl(min, {updateOn: "blur"}),
        element: this.sliderL.nativeElement,
        lastValidValue: min
      },
      right: {
        control: new FormControl(max, {updateOn: "blur"}),
        element: this.sliderR.nativeElement,
        lastValidValue: max
      }
    };




    this.setupSliderEvents("left");
    this.setupSliderEvents("right");

  }


  handleInputChange(side: SliderSide, value: string): void {
    //only run for user input
    if(this.userInput) {
      let sideData = this.sideData[side];
      let numval = Number.parseFloat(value);
      //if cant parse to a number set to the last valid value that was set
      if(Number.isNaN(numval)) {
        numval = sideData.lastValidValue;
      }

      //update slider to new value (will also update this control to post validation value)
      let data = this.sliderControlData.updateSlider(side, "val", numval);
      //set everything from the verified values (handles debounce, etc)
      this.updateFromSliderData(side, data);
    }
    //otherwise reset
    else {
      this.userInput = true;
    }
  }

  updateFromSliderData(side: SliderSide, data: SliderData) {
    //not user input, prevent bounce
    this.userInput = false;
    let sideData = this.sideData[side];
    //set last valid value to the current value from the slider data
    sideData.lastValidValue = data.value;
    sideData.control.setValue(data.value);
    sideData.element.style.left = data.left + "px";
  }

  expandSlider(element: HTMLElement) {
    element.style.width = element.clientWidth + this.expandPX + "px";
    element.style.height = element.clientHeight + this.expandPX + "px";
    element.style.top = element.offsetTop - this.expandPX / 2 + "px";
    element.style.transform = "translateX(-" + this.expandPX / 2 + "px)";
  }

  contractSlider(element: HTMLElement) {
    element.style.width = element.clientWidth - this.expandPX + "px";
    element.style.height = element.clientHeight - this.expandPX + "px";
    element.style.top = element.offsetTop + this.expandPX / 2 + "px";
    element.style.transform = "";
  }


  updateFillSeg() {
    this.segFill.nativeElement.style.left = this.sliderL.nativeElement.offsetLeft;
    this.segFill.nativeElement.style.width = this.sliderR.nativeElement.offsetLeft - this.sliderL.nativeElement.offsetLeft;
  }

  setupSliderEvents(side: SliderSide) {

    this.sideData[side].control.valueChanges.subscribe((value: any) => {
      this.handleInputChange(side, value);
    });

    let element = this.sideData[side].element;

    element.addEventListener("mousedown", (e: MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();

      this.expandSlider(element);
      document.body.style.cursor = "grabbing";

      let lastX: number;
      let movFunct = (e: MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();

        let x = e.clientX;
        let deltaX = x - lastX;
        lastX = x;
        let data = this.sliderControlData.updateSlider(side, "move", deltaX);
        this.updateFromSliderData(side, data);
      }
      window.addEventListener("mousemove", movFunct);

      let mupFunct = () => {
        this.contractSlider(element);
        document.body.style.cursor = "";
        window.removeEventListener("mousemove", movFunct);
        window.removeEventListener("mouseup", mupFunct);
      }

      window.addEventListener("mouseup", mupFunct);
    });
  }

}



type SliderSide = "left" | "right";

class TwoSidedSlider {
  private data: {
    left: Slider,
    right: Slider
  }


  constructor(leftInitValue: number, rightInitValue: number, sliderWidth: number, trackWidth: number, trackLockOffset: number, valueRange: [number, number]) {
    let leftSlider = new LeftSlider(leftInitValue, sliderWidth, trackWidth, trackLockOffset, valueRange);
    let rightSlider = new RightSlider(rightInitValue, sliderWidth, trackWidth, trackLockOffset, valueRange);
    leftSlider.setRightBound(rightSlider);
    rightSlider.setLeftBound(leftSlider);
    this.data = {
      left: leftSlider,
      right: rightSlider
    }
  }

  setRange(valueRange: [number, number]) {
    this.data.left.setRange(valueRange);
    this.data.right.setRange(valueRange);
  }

  updateSlider(side: SliderSide, op: "val" | "left" | "move", value: number): SliderData {
    let slider = this.data[side];
    let data: SliderData;
    switch(op) {
      case "val": {
        data = slider.setValue(value);
        break;
      }
      case "left": {
        data = slider.setLeft(value);
        break;
      }
      case "move": {
        data = slider.moveSlider(value);
        break;
      }
    }
    return data;
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

  constructor(initValue: number, sliderWidth: number, trackWidth: number, trackLockOffset: number, valueRange: [number, number]) {
    this.sliderWidth = sliderWidth;
    this.trackLockWidth = trackWidth - trackLockOffset;
    this.trackLockOffset = trackLockOffset;
    this.valRange = valueRange;
    this.value = initValue;
    this.updateLeft();
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

  constructor(initValue: number, sliderWidth: number, trackWidth: number, trackLockOffset: number, valueRange: [number, number]) {
    super(initValue, sliderWidth, trackWidth, trackLockOffset, valueRange);
  }

  setRightBound(rightBound: RightSlider) {
    this.rightBound = rightBound;
  }

  protected getEdgeOffset(): number {
    return -this.sliderWidth;
  }


  getUpperBound() {
    let upperBound: number;
    if(this.rightBound) {
      upperBound = this.rightBound.getLeft() - this.getEdgeOffset();
    }
    else {
      //if right boundary has not been set just use default upper bound check
      upperBound = super.getUpperBound();
    }
    return upperBound;
  }

}

class RightSlider extends Slider {
  leftBound: Slider;

  constructor(initValue: number, sliderWidth: number, trackWidth: number, trackLockOffset: number, valueRange: [number, number]) {
    super(initValue, sliderWidth, trackWidth, trackLockOffset, valueRange);
  }

  setLeftBound(leftBound: Slider) {
    this.leftBound = leftBound;
  }

  protected getEdgeOffset(): number {
    //left side is the value edge, no shift
    return 0;
  }

  getLowerBound(): number {
    let lowerBound: number;
    if(this.leftBound) {
      lowerBound = this.leftBound.getLeft() + this.getEdgeOffset();
    }
    else {
      lowerBound = super.getLowerBound();
    }
    return lowerBound;
  }

}

interface SliderData {
  value: number;
  left: number;
}
