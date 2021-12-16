import { Component, OnInit, AfterViewInit, ChangeDetectionStrategy } from '@angular/core';
import Moment from "moment";
import {EventParamRegistrarService} from "../../services/inputManager/event-param-registrar.service";
import { FormControl } from '@angular/forms';
import { VisDateSelectService } from 'src/app/services/controlHelpers/vis-date-select.service';
import { DateManagerService } from 'src/app/services/dateManager/date-manager.service';
import { Period } from 'src/app/models/types';

@Component({
  selector: 'app-data-set-form',
  templateUrl: './data-set-form.component.html',
  styleUrls: ['./data-set-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DataSetFormComponent implements OnInit, AfterViewInit {

  valid: boolean;
  validParts: {
    min: boolean,
    max: boolean,
    timeGranularity: boolean,
    setType: boolean,
    fill: boolean
  };

  dateData: {
    start: string,
    end: string
  } = null;

  min: Moment.Moment;
  max: Moment.Moment;
  timestep: string;

  //choices should come from external object
  //date from indicator if NRT or updated if possible
  dataset = {
    datatype: {
      label: "Rainfall",
      value: "rainfall",
      control: new FormControl("rainfall")
    },
    period: {
      label: "Monthly",
      value: "month",
      control: new FormControl("month")
    },
    advanced: {
      control: new FormControl(false),
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



  constructor(private paramService: EventParamRegistrarService, private dateSelector: VisDateSelectService, dateManager: DateManagerService) {

    paramService.createParameterHook(EventParamRegistrarService.EVENT_TAGS.dateRange, (dateRange: any) => {
      if(dateRange) {
        let start = dateManager.dateToString(dateRange.start, <Period>this.dataset.period.value, true);
        let end = dateManager.dateToString(dateRange.end, <Period>this.dataset.period.value, true);
        this.dateData = {
          start,
          end
        };
      }
    });


    this.valid = true;

    this.dataset.datatype.control.valueChanges.subscribe((value: string) => {
      console.log(value);
      //TEMP
      switch(value) {
        case "rainfall": {
          this.dataset.period.label = "Monthly";
          this.dataset.period.value = "month";
          this.dataset.period.control.setValue("month");

          this.dataset.station.fill.label = "Partial Fill";
          this.dataset.station.fill.value = "partal";
          this.dataset.station.fill.control.setValue("partial");
        }
        case "temperature": {
          this.dataset.period.label = "Daily";
          this.dataset.period.value = "day";
          this.dataset.period.control.setValue("day");

          this.dataset.station.fill.label = "Unfilled";
          this.dataset.station.fill.value = "unfilled";
          this.dataset.station.fill.control.setValue("unfilled");
        }
      }
    });

  }

  ngOnInit() {
  }

  ngAfterViewInit() {
    this.updateDataSet();
  }





  updateDataSet() {
    let dscp: any = {
      period: this.dataset.period.control.value,
      fill: this.dataset.station.fill.control.value,
      datatype: this.dataset.datatype.control.value
    }
    this.paramService.pushDataset(dscp);
  }
}
