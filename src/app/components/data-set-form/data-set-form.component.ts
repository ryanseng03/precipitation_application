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
  datasets = {
    rainfall: {
      label: "Rainfall",
      value: "rainfall",
      description: "Rainfall data (1990 - present)"
    },
    legacy_rainfall: {
      label: "Legacy Rainfall",
      value: "legacy_rainfall",
      description: "Legacy rainfall data based on older methods of production (1920 - 2012)"
    },
    tmin: {
      label: "Maximum Temperature",
      value: "tmax",
      description: "Temperature data aggregated to its maximum value over the time period."
    },
    tmax: {
      label: "Minimum Temperature",
      value: "tmin",
      description: "Temperature data aggregated to its minimum value over the time period."
    },
    tmean: {
      label: "Mean Temperature",
      value: "tmean",
      description: "Temperature data aggregated to its mean value over the time period."
    }
  };

  selectorDescriptions = {
    dataset: "Select the type of data you would like to download. Hover over an option for a description of the data set.",
    period: "The periodicity of data collection. For example, monthly data will be collected and aggregated for each month.",
    dates: "The date range data for this dataset are available for (inclusive at both ends)",
  }

  ranges: any;

  periodAvailability = {
    rainfall: ["day", "month"],
    legacy_rainfall: ["month"],
    tmin: ["day", "month"],
    tmax: ["day", "month"],
    tmean: ["day", "month"]
  };

  datasetDetails = {
    rainfall: {
      day: {
        unit: "mm",
        dataRange: [0, 20],
        rangeAbsolute: [true, false],
        stationData: true,
        rasterData: false
      },
      month: {
        unit: "mm",
        dataRange: [0, 650],
        rangeAbsolute: [true, false],
        stationData: true,
        rasterData: true
      }
    },
    legacy_rainfall: {
      month: {
        unit: "mm",
        dataRange: [0, 650],
        rangeAbsolute: [true, false],
        stationData: false,
        rasterData: true
      }
    },
    tmin: {
      day: {
        unit: "C",
        dataRange: [-10, 35],
        rangeAbsolute: [false, false],
        stationData: true,
        rasterData: true
      },
      month: {
        unit: "C",
        dataRange: [-10, 35],
        rangeAbsolute: [false, false],
        stationData: true,
        rasterData: true
      }
    },
    tmax: {
      day: {
        unit: "C",
        dataRange: [-10, 35],
        rangeAbsolute: [false, false],
        stationData: true,
        rasterData: true
      },
      month: {
        unit: "C",
        dataRange: [-10, 35],
        rangeAbsolute: [false, false],
        stationData: true,
        rasterData: true
      }
    },
    tmean: {
      day: {
        unit: "C",
        dataRange: [-10, 35],
        rangeAbsolute: [false, false],
        stationData: true,
        rasterData: true
      },
      month: {
        unit: "C",
        dataRange: [-10, 35],
        rangeAbsolute: [false, false],
        stationData: true,
        rasterData: true
      }
    }
  };

  fillAvailability = {
    rainfall: {
      day: ["partial", "raw"],
      month: ["partial"]
    },
    legacy_rainfall: {
      month: []
    },
    tmin: {
      day: ["raw"],
      month: ["raw"]
    },
    tmax: {
      day: ["raw"],
      month: ["raw"]
    },
    tmean: {
      day: ["raw"],
      month: ["raw"]
    }
  };

  fills = {
    label: "Data Fill",
    values: {
      partial: {
        label: "Partial Filled",
        value: "partial",
        description: "This data has undergone QA/QC and is partially filled using statistical techniques to estimate some missing values."
      },
      raw: {
        label: "Unfilled",
        value: "raw",
        description: "Station data including only values provided by stations before going through QA/QC."
      }
    },
    description: "The type of processing the station data goes through."
  };

  periods = {
    label: "Time Period",
    values: {
      day: {
        label: "Daily",
        value: "day",
        description: "Data measured at a daily time scale."
      },
      month: {
        label: "Monthly",
        value: "month",
        description: "Data measured at a monthly time scale."
      }
    },
    description: "The time period each data point is measured over."
  }

  valid: boolean;
  validParts: {
    min: boolean,
    max: boolean,
    timeGranularity: boolean,
    setType: boolean,
    fill: boolean
  };


  controls = {
    dataset: new FormControl("rainfall"),
    period: new FormControl("month"),
    fill: new FormControl("partial")
  }

  constructor(private paramService: EventParamRegistrarService, private dateSelector: VisDateSelectService, private dateManager: DateManagerService) {
    this.ranges = dateManager.getDatasetRanges();
    this.controls.dataset.valueChanges.subscribe(() => {
      this.setValidPeriod();
      this.setValidFill();
    });
    this.controls.period.valueChanges.subscribe(() => {
      this.setValidFill();
    });
  }

  ngOnInit() {
  }

  ngAfterViewInit() {
    this.updateDataset();
  }

  getFillData() {
    let dataset = this.controls.dataset.value;
    let period = this.controls.period.value;
    let fills = this.fillAvailability[dataset][period];
    let fillData = [];
    for(let fill of fills) {
      fillData.push(this.fills.values[fill]);
    }
    return fillData;
  }

  getDatasetData(): any[] {
    return Object.values(this.datasets);
  }

  setValidPeriod() {
    let dataset = this.controls.dataset.value;
    let period = this.controls.period.value;
    if(this.ranges[dataset][period] === undefined) {
      let firstValidPeriod = this.periodAvailability[dataset][0];
      this.controls.period.setValue(firstValidPeriod);
    }
  }

  setValidFill() {
    let dataset = this.controls.dataset.value;
    let period = this.controls.period.value;
    let fill = this.controls.fill.value;
    let validFills: string[] = this.fillAvailability[dataset][period];
    if(!validFills.includes(fill)) {
      let firstValidFill = validFills[0];
      this.controls.fill.setValue(firstValidFill);
    }
  }

  getDateRangeLabel(): string {
    let dataset = this.controls.dataset.value;
    let period = this.controls.period.value;
    let range = this.ranges[dataset][period];
    let dateString = `${this.dateManager.dateToString(range[0], period, true)} - ${this.dateManager.dateToString(range[1], period, true)}`;
    return dateString;
  }

  getDataStationsAvailable(): boolean {
    let dataset = this.controls.dataset.value;
    let period = this.controls.period.value;
    return this.datasetDetails[dataset][period].stationData;
  }

  updateDataset() {
    let dataset = this.controls.dataset.value;
    let period = this.controls.period.value;
    let details = this.datasetDetails[dataset][period];
    let label =  `${this.periods.values[period].label} ${this.datasets[dataset].label}`;
    let data = Object.assign({}, details);
    data.label = label;
    data.dataset = dataset;
    data.period = period;
    data.dateRange = this.ranges[dataset][period];
    if(data.stationData) {
      let fill = this.controls.fill.value;
      data.fill = fill;
    }
    this.paramService.pushDataset(data);
  }
}
