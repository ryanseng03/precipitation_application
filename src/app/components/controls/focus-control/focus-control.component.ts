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

  constructor(private paramService: EventParamRegistrarService) {
    paramService.createParameterHook(EventParamRegistrarService.EVENT_TAGS.dataset, (dataset: VisDatasetItem) => {
      if(dataset) {
        //if same focus manager used between sets won't trigger update since not changing focusManager, so re-push last focus data to trigger updates
        if(dataset.focusManager == this.focusManager) {
          this.paramService.pushFocusData(this.lastFocus);
        }
        else {
          this.focusManager = dataset.focusManager;
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
    }
    else {
      this.selection = <FormValue>focus;
    }
    let focusData = this.focusManager.getFocusData(focus);
    this.lastFocus = focusData;
    this.paramService.pushFocusData(focusData);
  }

}
