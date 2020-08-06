import { Component, OnInit } from '@angular/core';
import {Dataset} from "../../../models/dataset";
import Moment from "moment";

@Component({
  selector: 'app-dataset-info',
  templateUrl: './dataset-info.component.html',
  styleUrls: ['./dataset-info.component.scss']
})
export class DatasetInfoComponent implements OnInit {

  dataset: Dataset = {
    startDate: Moment("1920-01-01"),
    endDate: Moment(),
    timestep: "monthly",
    fill: "partial",
    type: "rainfall"
  };

  constructor() { }

  ngOnInit() {
  }

}
