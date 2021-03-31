import { Component, OnInit, Input } from '@angular/core';
import {Dataset, FillType, Timestep} from "../../../models/dataset";
import Moment from "moment";
import {EventParamRegistrarService} from "../../../services/inputManager/event-param-registrar.service";
import { MapComponent } from '../../map/map.component';

@Component({
  selector: 'app-dataset-info',
  templateUrl: './dataset-info.component.html',
  styleUrls: ['./dataset-info.component.scss']
})
export class DatasetInfoComponent implements OnInit {

  @Input() map: MapComponent;

  dataset: Dataset = {
    startDate: Moment("1920-01-01"),
    endDate: Moment(),
    timestep: "monthly",
    fill: "partial",
    type: "rainfall"
  };

  datasetStr: string;

  constructor(private paramRegistrar: EventParamRegistrarService) {
    this.datasetStr = this.genDSStr();

    // paramRegistrar.createParameterHook(EventParamRegistrarService.GLOBAL_HANDLE_TAGS.dataset, (dataset: Dataset) => {
    //   this.dataset = dataset;
    //   console.log(dataset);
    //   this.datasetStr = this.genDSStr();
    // });
  }


  ngOnInit() {
  }

  genDSStr(): string {
    //console.log(this.dataset.endDate.format("MMM DD, YYYY"));
    let timestep = this.capFirst(this.dataset.timestep);
    let type = this.capFirst(this.dataset.type);
    let fill = this.fillStr(this.dataset.fill);
    let start = this.startStr(this.dataset.startDate, this.dataset.timestep);
    let end = this.endStr(this.dataset.endDate, this.dataset.timestep);

    return `${timestep} ${fill} ${type}, ${start} - ${end}`;
  }

  capFirst(str: string): string {
    return `${str[0].toUpperCase()}${str.substr(1)}`
  }

  startStr(date: Moment.Moment, timestep: Timestep): string {
    let dateStr: string = this.getDateStr(date, timestep);
    return dateStr;
  }

  endStr(date: Moment.Moment, timestep: string): string {
    let dateStr: string;
    let unit: Moment.unitOfTime.Diff = timestep == "monthly" ? "month" : "day";
    if(Moment().diff(date, unit) < 1) {
      dateStr = "Present";
    }
    else {
      dateStr = this.getDateStr(date, timestep);
    }
    return dateStr;
  }

  getDateStr(date: Moment.Moment, timestep: string): string {
    let dateStr: string
    switch(timestep) {
      case "monthly": {
        dateStr = date.format("MMM YYYY");
        break;
      }
      case "daily": {
        dateStr = date.format("MMM DD, YYYY");
        break;
      }
      default: {
        throw new Error("Invalid timestep type.");
      }
    }
    return dateStr;
  }

  fillStr(fill: FillType): string {
    let s: string;
    switch(fill) {
      case "full": {
        s = "Filled"
        break;
      }
      case "none": {
        s = "Unfilled"
        break;
      }
      case "partial": {
        s = "Partial Filled"
        break;
      }
      default: {
        throw new Error("Invalid fill type");
      }
    }
    return s;
  }
}
