import { Component, OnInit } from '@angular/core';
import { Moment } from 'moment';
import { VisDatasetItem, FocusData, FocusManager, FormValue, TimeSelectorData, TimeseriesData } from 'src/app/services/dataset-form-manager.service';
import { EventParamRegistrarService } from 'src/app/services/inputManager/event-param-registrar.service';

@Component({
  selector: 'app-focus-control',
  templateUrl: './focus-control.component.html',
  styleUrls: ['./focus-control.component.scss']
})
export class FocusControlComponent implements OnInit {
  focusManager: FocusManager<unknown>;
  date: Moment;
  selection: FormValue;
  lastFocus: FocusData<unknown>;
  datatype: string;

  constructor(private paramService: EventParamRegistrarService) {
    paramService.createParameterHook(EventParamRegistrarService.EVENT_TAGS.dataset, (dataset: VisDatasetItem) => {
      if(dataset) {
        this.datatype = dataset.datatype;
        this.focusManager = dataset.focusManager;
        if(this.focusManager.type == "timeseries") {
          //make sure all dataset events propogate before pushing focus
          setTimeout(() => {
            this.paramService.pushFocusData(this.lastFocus);
          }, 0);
        }
      }
    });
  }

  ngOnInit() {
  }

  castTimeseriesManager(): TimeseriesData {
    return <TimeseriesData>this.focusManager;
  }

  castSelectorManager(): TimeSelectorData {
    return <TimeSelectorData>this.focusManager;
  }

  setFocus(focus: unknown) {
    if(this.focusManager.type == "timeseries") {
      this.date = <Moment>focus;
      let focusData = this.focusManager.getFocusData(focus);
      this.lastFocus = focusData;
      this.paramService.pushFocusData(focusData);
    }
    
  }

}
