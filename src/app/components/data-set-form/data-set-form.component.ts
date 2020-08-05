import { Component, OnInit, AfterContentInit, AfterViewInit, NgZone } from '@angular/core';
import {Timestep} from "../controls/data-set-interval-selector/data-set-interval-selector.component";
import Moment from "moment";
import "moment-timezone";

@Component({
  selector: 'app-data-set-form',
  templateUrl: './data-set-form.component.html',
  styleUrls: ['./data-set-form.component.scss']
})
export class DataSetFormComponent implements OnInit {
  //local tz for current date set (UTC for hardcoded dates)


  //!!!SHOULD MAKE ALL DB TIME ZONES HST NORMALIZED TO UTC, THEN MAKE ALL DATES IN APP UTC BACKEND, LOCAL FOR USER (TAKE OUT Z AND REMOVE TIMEZONE SPEC)


  private static readonly GLOBAL_MAX = Moment();
  //set global min to january first year 0 (null/undefined works but seems to break change detection for some reason)
  private static readonly GLOBAL_MIN = Moment("0000-01-01T00:00:00.000Z").tz("utc");
  private static readonly DEFAULT_TIMESTEP = "daily";


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
  timestep: string;

  constructor() {
    this.min = this.dataRange.min;
    this.max = this.dataRange.max
    this.timestep ="monthly";
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


  setMin(date: Moment.Moment) {
    if(date) {
      this.min = date;
      this.validParts.min = true;
    }
    else {
      this.min = this.dataRange.min;
      this.validParts.min = false;
    }
    this.min = date ? date : this.dataRange.min;
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
    this.max = date ? date : this.dataRange.max;
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
    this.validate();
  }


  setType(type: string) {
    if(type != null) {
      this.validParts.setType = true;
    }
    else {
      this.validParts.setType = false;
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

  }
}
