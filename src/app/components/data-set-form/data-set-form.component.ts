import { Component, OnInit, AfterContentInit, AfterViewInit, NgZone, ChangeDetectionStrategy } from '@angular/core';
import {Timestep} from "../controls/data-set-interval-selector/data-set-interval-selector.component";
import Moment from "moment";
import "moment-timezone";
import {EventParamRegistrarService} from "../../services/inputManager/event-param-registrar.service";
import {Dataset, SetType, FillType} from "../../models/dataset";
import { FormControl } from '@angular/forms';
import {DateChangeInfo} from "../controls/date-focus/date-focus.component";
import { VisDateSelectService } from 'src/app/services/controlHelpers/vis-date-select.service';

@Component({
  selector: 'app-data-set-form',
  templateUrl: './data-set-form.component.html',
  styleUrls: ['./data-set-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DataSetFormComponent implements OnInit, AfterViewInit {


  // @Input() lower: Moment.Moment;
  // @Input() upper: Moment.Moment;
  // @Input() timestep: string;
  // @Input() initDate: Moment.Moment;
  // @Output() date

 


  private static readonly GLOBAL_MAX = Moment();
  //set global min to january first year 0 (null/undefined works but seems to break change detection for some reason)
  private static readonly GLOBAL_MIN = Moment("0000-01-01T00:00:00.000Z").tz("utc");
  private static readonly DEFAULT_TIMESTEP = "daily";

  // dataset: Dataset = {
  //   startDate: null,
  //   endDate: null,
  //   timestep: null,
  //   fill: null,
  //   type: null
  // };

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



  //choices should come from external object
  //date from indicator if NRT or updated if possible
  dataset = {
    datatype: {
      label: "Rainfall",
      value: "rainfall",
      control: new FormControl("rainfall")
    },
    timestep: {
      label: "Monthly",
      value: "monthly",
      control: new FormControl("monthly")
    },
    dateRange: {
      low: {
        label: null,
        value: Moment("1990-12")
      },
      high: {
        label: null,
        value: Moment("2019-12")
      }
    },
    advanced: {
      control: new FormControl(false),
      tier: {
        label: "Tier 0",
        value: 0,
        control: new FormControl(0)
      }
    },
    raster: null,
    station: {
      fill: {
        label: "Partial Fill",
        value: "partial",
        control: new FormControl("partial")
      }
    }
  }



  constructor(private paramRegistrar: EventParamRegistrarService, private dateSelector: VisDateSelectService) {
    //remember change format day/month
    this.dataset.dateRange.low.label = this.dataset.dateRange.low.value.format("MMMM YYYY");
    this.dataset.dateRange.high.label = this.dataset.dateRange.high.value.format("MMMM YYYY");
    
    // this.min = this.dataRange.min;
    // this.max = this.dataRange.max
    // this.timestep = "monthly";
    // this.validParts = {
    //   min: false,
    //   max: false,
    //   timeGranularity: false,
    //   setType: false,
    //   fill: false
    // };
    // this.valid = false;
    this.valid = true;

    this.updateDataSet();
  }

  ngOnInit() {
  }

  ngAfterViewInit() {
    this.updateDataSet();
  }

  setDate(changeInfo: DateChangeInfo) {
    //console.log(changeInfo.date.format("YYYY MM"));
    this.dateSelector.setDate(changeInfo.date, changeInfo.magnitude);
  }

  // setMin(date: Moment.Moment) {
  //   if(date) {
  //     this.min = date;
  //     this.validParts.min = true;
  //   }
  //   else {
  //     this.min = this.dataRange.min;
  //     this.validParts.min = false;
  //   }
  //   this.dataset.startDate = this.min;
  //   this.validate();
  // }

  // setMax(date: Moment.Moment) {
  //   if(date) {
  //     this.max = date;
  //     this.validParts.max = true;
  //   }
  //   else {
  //     this.max = this.dataRange.max;
  //     this.validParts.max = false;
  //   }
  //   this.dataset.endDate = this.max;
  //   this.validate();
  // }

  // setTimestep(timestep: Timestep) {
  //   if(timestep != null) {
  //     this.timestep = timestep;
  //     this.validParts.timeGranularity = true;
  //   }
  //   else {
  //     this.timestep = DataSetFormComponent.DEFAULT_TIMESTEP;
  //     this.validParts.timeGranularity = false;
  //   }
  //   this.dataset.timestep = this.timestep;
  //   this.validate();
  // }


  // setType(type: string) {
  //   if(type != null) {
  //     this.validParts.setType = true;
  //   }
  //   else {
  //     this.validParts.setType = false;
  //   }
  //   if(type == null) {
  //     this.dataset.type = null
  //   }
  //   //this stuff is sketchy at best, should refactor form and types to align
  //   else if(type.includes("rainfall")) {
  //     this.dataset.type = "rainfall";
  //   }
  //   else {
  //     this.dataset.type = "temperature";
  //   }
  //   this.validate();
  // }

  // setFill(fill: string) {
  //   if(fill != null) {
  //     this.validParts.fill = true;
  //   }
  //   else {
  //     this.validParts.fill = false;
  //   }
  //   if(fill == null) {
  //     this.dataset.fill = null
  //   }
  //   //this stuff is sketchy at best, should refactor form and types to align
  //   else if(fill.includes("partial")) {
  //     this.dataset.fill = "partial";
  //   }
  //   else if(fill.includes("filled")) {
  //     this.dataset.fill = "full";
  //   }
  //   else {
  //     this.dataset.fill = "none";
  //   };
  //   this.validate();
  // }


  // setDateRange(range: [Moment.Moment, Moment.Moment]) {
  //   if(range != null) {
  //     this.dataRange.min = range[0];
  //     this.dataRange.max = range[1];
  //   }
  //   else {
  //     this.dataRange.min = DataSetFormComponent.GLOBAL_MIN;
  //     this.dataRange.max = DataSetFormComponent.GLOBAL_MAX;
  //   }

  // }

  // validate() {
  //   let valid = true;
  //   for(let item in this.validParts) {
  //     valid = valid && this.validParts[item];
  //   }
  //   this.valid = valid;

  //   return valid;
  // }

  updateDataSet() {
    let dscp: Dataset = {
      startDate: this.dataset.dateRange.low.value,
      endDate: this.dataset.dateRange.high.value,
      timestep: this.dataset.timestep.control.value,
      fill: this.dataset.station.fill.control.value,
      type: this.dataset.datatype.control.value
    }
    this.paramRegistrar.pushDataset(dscp);
  }
}
