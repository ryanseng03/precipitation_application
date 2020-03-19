import { Component, EventEmitter, OnInit, Output, ViewChildren, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
//import {MatSelect} from "@angular/material/select";
import {ClassModificationService} from "../../../services/controlHelpers/class-modification.service";

@Component({
  selector: 'app-data-set-interval-selector',
  templateUrl: './data-set-interval-selector.component.html',
  styleUrls: ['./data-set-interval-selector.component.scss']
})
export class DataSetIntervalSelectorComponent implements AfterViewInit {

  dataSets: DataSetInfoBuilder[];

  @ViewChild("options", {read: ElementRef}) options;

  //@Output() panelOpen = new EventEmitter();

  constructor(private classModifier: ClassModificationService) {
    this.dataSets = [];
    for(let fillType of ["filled", "partial_filled", "not_filled"]) {
      this.dataSets.push(new DataSetInfoBuilder({
        valueType: "daily",
        setType: "rainfall",
        timeRange: ["1990", "present"],
        fill: fillType
      }));
    }
    for(let fillType of ["filled", "partial_filled"]) {
      this.dataSets.push(new DataSetInfoBuilder({
        valueType: "monthly",
        setType: "rainfall",
        timeRange: ["1920", "present"],
        fill: fillType
      }));
    }

    this.dataSets.push(new DataSetInfoBuilder({
      valueType: "monthly",
      setType: "rainfall",
      timeRange: ["1990", "present"],
      fill: "not_filled"
    }));

    for(let fillType of ["filled", "not_filled"]) {
      this.dataSets.push(new DataSetInfoBuilder({
        valueType: "average",
        setType: "temperature",
        timeRange: ["1899", "present"],
        fill: fillType
      }));
    }
    for(let fillType of ["filled", "not_filled"]) {
      this.dataSets.push(new DataSetInfoBuilder({
        valueType: "maximum",
        setType: "temperature",
        timeRange: ["1899", "present"],
        fill: fillType
      }));
    }
    for(let fillType of ["filled", "not_filled"]) {
      this.dataSets.push(new DataSetInfoBuilder({
        valueType: "minimum",
        setType: "temperature",
        timeRange: ["1899", "present"],
        fill: fillType
      }));
    }
  }

  ngAfterViewInit() {
    
  }

  setAttributes() {
    //move to back of queue so dom finished setting up and doesn't get overwritten
    setTimeout(() => {
      this.classModifier.setAttributesInAncestorWithClass(this.options.nativeElement, "mat-select-panel", {
        minWidth: {
          value: "180px",
        }
      });
    }, 0);

    // setTimeout(() => {
    //   this.classModifier.setAttributesInAncestorWithClass(this.options.nativeElement, "cdk-overlay-pane", {
    //     transform: {
    //       value: "none",
    //     }
    //   });
    // }, 0);


    
  }
}

interface DataSetComponents {
  setType: string,
  valueType: string,
  fill: string,
  timeRange: [string, string]
}

class DataSetInfoBuilder {
  private _components: DataSetComponents;
  private _label: string

  constructor(components: DataSetComponents) {
    this._components = components;
    this._label = this.buildLabel();
  }

  private buildLabel(): string {
    let replacement = (noCap?: Set<string>) => {
      return (match: string, boundary: string, word: string, first: string, rest: string) => {
        let replace = match;
        if(noCap === undefined || !noCap.has(word.toLowerCase())) {
          replace = `${boundary}${first.toUpperCase()}${rest}`;
        }
        return replace;
      }
    };
    let prettifyString = (s: string, noCap?: Set<string>) => {
      let pretty = s;
      pretty = pretty.replace(/_/g, " ");
      pretty = pretty.replace(/(\b)((\w)(\w*))/g, replacement(noCap));
      console.log(pretty);
      return pretty;
    };
    return prettifyString(`${this._components.valueType} ${this._components.setType} (${this._components.timeRange[0]}-${this._components.timeRange[1]}), ${this._components.fill}`);
  }

  get label(): string {
    return this._label;
  }

  get components(): DataSetComponents {
    return JSON.parse(JSON.stringify(this._components));
  }
}