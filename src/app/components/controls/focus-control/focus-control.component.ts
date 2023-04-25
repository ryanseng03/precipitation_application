import { Component, Input, OnInit } from '@angular/core';
import { Moment } from 'moment';
import { VisDatasetItem, FocusData, FormValue, TimeseriesData } from 'src/app/services/dataset-form-manager.service';
import { EventParamRegistrarService } from 'src/app/services/inputManager/event-param-registrar.service';

@Component({
  selector: 'app-focus-control',
  templateUrl: './focus-control.component.html',
  styleUrls: ['./focus-control.component.scss']
})
export class FocusControlComponent implements OnInit {
  focusManager: TimeseriesData;
  date: Moment;
  selection: FormValue;
  lastFocus: FocusData<unknown>;
  datatype: string;



  constructor() {

  }

  ngOnInit() {
  }

  setFocus(focus: unknown) {

  }

}
