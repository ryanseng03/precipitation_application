import { Component, OnInit, ViewChild, Output, Input, OnChanges } from '@angular/core';
import { Subject, BehaviorSubject, Observable } from "rxjs";
import { UtilityService } from "../../../../services/utility/utility.service";
import { FormControl } from '@angular/forms';
import { element } from '@angular/core/src/render3';
import { max } from 'rxjs/operators';


interface SideComponents {
  control: FormControl,
  element: HTMLElement,
  lastValidValue: number
}

// background-image: linear-gradient(0deg, #598dd1, #3875c2);
// background-image: linear-gradient(0deg, #3875c2, #175db6);

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

  sliderController: TwoSidedSlider;
  @Input() set range(range: [number, number]) {
    this._range = range;
    if(this.sliderController) {
      this.sliderController.setRange(range);
    }
  };
  @Input() control: FormControl;

  expandScale: number;

  sliderComponents: {
    left: SideComponents,
    right: SideComponents,
    fill: HTMLElement
  };

  userInput: boolean = true;


  constructor(private util: UtilityService) {
    // this.lower = new Subject<number>();
    // this.upper = new Subject<number>();
  }

  ngOnInit() {
    this.expandScale = 1.3;
    let sliderWidth = 8;
    let trackLockOffset = 2;
    let trackWidth = 100;

    let min = this._range[0];
    let max = this._range[1];

    //initialize value at min and max
    let sliderController = new TwoSidedSlider(min, max, sliderWidth, trackWidth, trackLockOffset, this._range);
    this.sliderController = sliderController;

    this.sliderComponents = {
      left: {
        control: new FormControl(min, {updateOn: "blur"}),
        element: this.sliderL.nativeElement,
        lastValidValue: min
      },
      right: {
        control: new FormControl(max, {updateOn: "blur"}),
        element: this.sliderR.nativeElement,
        lastValidValue: max
      },
      fill: this.segFill.nativeElement
    };

    this.sliderComponents.left.element.style.transformOrigin = "center right";
    this.sliderComponents.right.element.style.transformOrigin = "center left";

    this.updateFromSliderData("left", sliderController.getData("left"));
    this.updateFromSliderData("right", sliderController.getData("right"));

    this.setupSliderEvents("left");
    this.setupSliderEvents("right");

  }


  handleInputChange(side: SliderSide, value: string): void {
    //only run for user input
    if(this.userInput) {
      let sliderData = this.sliderComponents[side];
      let numval = Number.parseFloat(value);
      //if cant parse to a number set to the last valid value that was set
      if(Number.isNaN(numval)) {
        numval = sliderData.lastValidValue;
      }

      //update slider to new value (will also update this control to post validation value)
      let data = this.sliderController.updateSlider(side, "val", numval);
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
    let sliderData = this.sliderComponents[side];
    //set last valid value to the current value from the slider data
    sliderData.lastValidValue = data.value;
    sliderData.control.setValue(data.value);
    sliderData.element.style.left = data.left + "px";
    this.updateFillSeg();
  }

  expandSlider(element: HTMLElement) {
    element.style.transform = `scale(${this.expandScale})`;
  }

  contractSlider(element: HTMLElement) {
    element.style.transform = "";
  }


  updateFillSeg() {
    let fillData = this.sliderController.getFillSegData();
    this.sliderComponents.fill.style.left = fillData.left + "px";
    this.sliderComponents.fill.style.width = fillData.width + "px";
  }

  setupSliderEvents(side: SliderSide): void {

    this.sliderComponents[side].control.valueChanges.subscribe((value: any) => {
      this.handleInputChange(side, value);
    });

    let element = this.sliderComponents[side].element;

    let lastX: number;
    element.addEventListener("mousedown", (e: MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();

      lastX = e.clientX;

      this.expandSlider(element);
      document.body.style.cursor = "grabbing";

      
      let movFunct = (e: MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();

        let x = e.clientX;
        let deltaX = x - lastX;
        lastX = x;
        let data = this.sliderController.updateSlider(side, "move", deltaX);
        //console.log(data);
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

  getFillSegData(): FillData {
    let left = this.data.left.getValueEdge();
    let width = this.data.right.getValueEdge() - left;
    let data: FillData = {
      left: left,
      width: width
    }
    return data;
  }

  getData(side: SliderSide): SliderData {
    return this.data[side].getData();
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
    this.trackWidth = trackWidth;
    this.sliderWidth = sliderWidth;
    this.trackLockWidth = trackWidth - (trackLockOffset * 2);
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
      left: this.left,
      valueEdge: this.left + this.getEdgeOffset()
    };
  }


  moveSlider(positionOffset: number): SliderData {
    //console.log(this.left, positionOffset);
    let newLeft = this.left + positionOffset;
    //console.log(newLeft);
    //this handles all the rounding and updates and whatnot
    this.setLeft(newLeft);
    return this.getData();
  }

  //are we doing intervals?

  setLeft(offset: number): SliderData {
    let minLeft = this.getLowerBoundLeft();
    let maxLeft = this.getUpperBoundLeft();
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
    let min = this.getLowerBoundValue();
    let max = this.getUpperBoundValue();
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
    let left = this.trackLockWidth * ratio;
    //add the track lock offset and the edge offset
    left += this.trackLockOffset - this.getEdgeOffset();
    //round to nearest pixel
    left = Math.round(left);
    this.left = left;
    return left;
  }

  protected updateValue(): number {
    let valueEdge = this.getValueEdge();
    //adjust to track lock
    valueEdge -= this.trackLockOffset;
    let min = this.valRange[0];
    let max = this.valRange[1];
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
  protected getLowerBoundLeft(): number {
    return this.trackLockOffset - this.getEdgeOffset();
  }

  protected getUpperBoundLeft() {
    return this.trackWidth - this.trackLockOffset - this.getEdgeOffset();
  }

  //default just the ends of range
  protected getLowerBoundValue(): number {
    return this.valRange[0];
  }

  protected getUpperBoundValue() {
    return this.valRange[1];
  }

  getValueEdge() {
    return this.getLeft() + this.getEdgeOffset();
  }

  //pixel shift from left edge of slider to position edge
  abstract getEdgeOffset(): number;
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

  getEdgeOffset(): number {
    return this.sliderWidth;
  }


  getUpperBoundLeft(): number {
    let upperBound: number;
    if(this.rightBound) {
      upperBound = this.rightBound.getLeft() + this.rightBound.getEdgeOffset() - this.getEdgeOffset();
    }
    else {
      //if right boundary has not been set just use default upper bound check
      upperBound = super.getUpperBoundLeft();
    }
    return upperBound;
  }

  protected getUpperBoundValue(): number {
    let upperBound: number;
    if(this.rightBound) {
      upperBound = this.rightBound.getValue();
    }
    else {
      upperBound = super.getUpperBoundValue();
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

  getEdgeOffset(): number {
    //left side is the value edge, no shift
    return 0;
  }

  getLowerBoundLeft(): number {
    let lowerBound: number;
    if(this.leftBound) {
      lowerBound = this.leftBound.getLeft() + this.leftBound.getEdgeOffset() - this.getEdgeOffset();
    }
    else {
      lowerBound = super.getLowerBoundLeft();
    }
    return lowerBound;
  }

  protected getLowerBoundValue(): number {
    let lowerBound: number;
    if(this.leftBound) {
      lowerBound = this.leftBound.getValue();
    }
    else {
      lowerBound = super.getLowerBoundValue();
    }
    return lowerBound;
  }

}

interface SliderData {
  value: number,
  left: number,
  valueEdge: number
}

interface FillData {
  left: number,
  width: number
}

