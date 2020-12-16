import { Component, OnInit, AfterContentInit, AfterViewInit, NgZone, ChangeDetectionStrategy } from '@angular/core';
import {Timestep} from "../controls/data-set-interval-selector/data-set-interval-selector.component";
import Moment from "moment";
import "moment-timezone";
import {EventParamRegistrarService} from "../../services/inputManager/event-param-registrar.service";
import {Dataset, SetType, FillType} from "../../models/dataset";

@Component({
  selector: 'app-data-set-form',
  templateUrl: './data-set-form.component.html',
  styleUrls: ['./data-set-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DataSetFormComponent implements OnInit, AfterViewInit {


  //!!!SHOULD MAKE ALL TIME ZONES HST


  private static readonly GLOBAL_MAX = Moment();
  //set global min to january first year 0 (null/undefined works but seems to break change detection for some reason)
  private static readonly GLOBAL_MIN = Moment("0000-01-01T00:00:00.000Z").tz("utc");
  private static readonly DEFAULT_TIMESTEP = "daily";

  dataset: Dataset = {
    startDate: null,
    endDate: null,
    timestep: null,
    fill: null,
    type: null
  };

  valid: boolean;
  validParts: {
    min: boolean,
    max: boolean,
    timeGranularity: boolean,
    setType: boolean,
    fill: boolean
  };

  dataRange = {
    min: DataSetFormComponent.GLOBAL_MIN,
    max: DataSetFormComponent.GLOBAL_MAX
  };
  //how to deal with time zones? should it all be HST? local? UTC?
  //this does affect what day it is, for now use utc, probably should change
  //should probably store as UTC, provide as local
  min: Moment.Moment;
  max: Moment.Moment;
  timestep: Timestep;

  defaultLow: Moment.Moment = Moment("1990-12-01");
  defaultHigh: Moment.Moment = Moment("2019-12-01");

  constructor(private paramRegistrar: EventParamRegistrarService) {
    this.min = this.dataRange.min;
    this.max = this.dataRange.max
    this.timestep = "monthly";
    this.validParts = {
      min: false,
      max: false,
      timeGranularity: false,
      setType: false,
      fill: false
    };
    this.valid = false;
  }

  ngOnInit() {
  }

  ngAfterViewInit() {
    this.updateDataSet();
  }


  setMin(date: Moment.Moment) {
    if(date) {
      this.min = date;
      this.validParts.min = true;
    }
    else {
      this.min = this.dataRange.min;
      this.validParts.min = false;
    }
    this.dataset.startDate = this.min;
    this.validate();
  }

  setMax(date: Moment.Moment) {
    if(date) {
      this.max = date;
      this.validParts.max = true;
    }
    else {
      this.max = this.dataRange.max;
      this.validParts.max = false;
    }
    this.dataset.endDate = this.max;
    this.validate();
  }

  setTimestep(timestep: Timestep) {
    if(timestep != null) {
      this.timestep = timestep;
      this.validParts.timeGranularity = true;
    }
    else {
      this.timestep = DataSetFormComponent.DEFAULT_TIMESTEP;
      this.validParts.timeGranularity = false;
    }
    this.dataset.timestep = this.timestep;
    this.validate();
  }


  setType(type: string) {
    if(type != null) {
      this.validParts.setType = true;
    }
    else {
      this.validParts.setType = false;
    }
    if(type == null) {
      this.dataset.type = null
    }
    //this stuff is sketchy at best, should refactor form and types to align
    else if(type.includes("rainfall")) {
      this.dataset.type = "rainfall";
    }
    else {
      this.dataset.type = "temperature";
    }
    this.validate();
  }

  setFill(fill: string) {
    if(fill != null) {
      this.validParts.fill = true;
    }
    else {
      this.validParts.fill = false;
    }
    if(fill == null) {
      this.dataset.fill = null
    }
    //this stuff is sketchy at best, should refactor form and types to align
    else if(fill.includes("partial")) {
      this.dataset.fill = "partial";
    }
    else if(fill.includes("filled")) {
      this.dataset.fill = "full";
    }
    else {
      this.dataset.fill = "none";
    };
    this.validate();
  }


  setDateRange(range: [Moment.Moment, Moment.Moment]) {
    if(range != null) {
      this.dataRange.min = range[0];
      this.dataRange.max = range[1];
    }
    else {
      this.dataRange.min = DataSetFormComponent.GLOBAL_MIN;
      this.dataRange.max = DataSetFormComponent.GLOBAL_MAX;
    }

  }

  validate() {
    let valid = true;
    for(let item in this.validParts) {
      valid = valid && this.validParts[item];
    }
    this.valid = valid;

    return valid;
  }

  updateDataSet() {
    let dscp: Dataset = {
      startDate: this.dataset.startDate,
      endDate: this.dataset.endDate,
      timestep: this.dataset.timestep,
      fill: this.dataset.fill,
      type: this.dataset.type
    }
    this.paramRegistrar.pushDataset(dscp);
  }
}
