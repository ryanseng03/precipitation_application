import { Component, OnInit, Inject } from '@angular/core';
import { FormControl } from '@angular/forms';
import {MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import Moment from "moment";
import { DateManagerService } from 'src/app/services/dateManager/date-manager.service';

@Component({
  selector: 'app-export-add-item',
  templateUrl: './export-add-item.component.html',
  styleUrls: ['./export-add-item.component.scss']
})
export class ExportAddItemComponent {


  //always datatype obviously
  //just expand out properties specific to a certain type of file for simplicity
  //note should probably change dir mapping to do this too (group together different fill types), will streamline things a lot
  properties = {
    rainfall: ["production", "period", "extent"],
    temperature: ["aggregation", "period", "extent"]
  }

  selectorDescriptions = {
    dataset: "Select the type of data you would like to download. Hover over an option for a description of the data set.",
    period: "The periodicity of data collection. For example, monthly data will be collected and aggregated for each month.",
    dates: "Select the date range you are interested in. All available data files between the provided start and end dates (inclusive at both ends) will be provided.",
    files: "These are the types of data files available for the selected dataset and period. Select the files you are interested in downloading.",
    extent: "Select the spatial coverages of the file. Multiple extents may be selected where available"
  }


  datasets = {
    rainfall: {
      label: "Rainfall",
      value: "rainfall",
      description: "Rainfall data"
    },
    legacy_rainfall: {
      label: "Legacy Rainfall",
      value: "legacy_rainfall",
      description: "Legacy rainfall data based on older methods of production"
    },
    tmin: {
      label: "Minimum Temperature",
      value: "tmin",
      description: "Temperature data aggregated to its minimum value over the time period."
    },
    tmax: {
      label: "Maximum Temperature",
      value: "tmax",
      description: "Temperature data aggregated to its maximum value over the time period."
    },
    tmean: {
      label: "Mean Temperature",
      value: "tmean",
      description: "Temperature data aggregated to its mean value over the time period."
    }
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

  periodAvailability = {
    rainfall: ["day", "month"],
    legacy_rainfall: ["month"],
    tmin: ["day", "month"],
    tmax: ["day", "month"],
    tmean: ["day", "month"]
  }

  extentData = {
    label: "Spatial Extent",
    values: {
      statewide: {
        label: "Statewide",
        value: "statewide",
        description: "Data covering the entire state of Hawaiʻi."
      },
      bi: {
        label: "Hawaiʻi County",
        value: "bi",
        description: "Data covering the county of Hawaiʻi."
      },
      ka: {
        label: "Kauai County",
        value: "ka",
        description: "Data covering the county of Kauai"
      },
      mn: {
        label: "Maui County",
        value: "mn",
        description: "Data covering the county of Maui"
      },
      oa: {
        label: "Honolulu County",
        value: "oa",
        description: "Data covering the county of Honolulu"
      }
    },
    description: "The spatial extent the data covers"
  }


  ranges: any

  files = {
    rainfall: {
      day: [
        {
          label: "Station Data (Partial Filled)",
          value: "station_data_partial",
          filetype: "csv",
          extents: ["statewide", "bi", "mn", "oa", "ka"],
          default_extents: ["statewide"],
          description: "Rainfall station data. This data has undergone QA/QC and is partially filled using statistical techniques to estimate some missing values. These are the values used to generate the rainfall maps.",
          requires: []
        },
        {
          label: "Station Data (Unfilled)",
          value: "station_data_raw",
          filetype: "csv",
          extents: ["statewide", "bi", "mn", "oa", "ka"],
          default_extents: ["statewide"],
          description: "Rainfall station data including only values provided by stations before going through QA/QC.",
          requires: []
        }
      ],
      month: [
        {
          label: "Rainfall Map",
          value: "data_map",
          filetype: "tif",
          extents: ["statewide", "bi", "mn", "oa", "ka"],
          default_extents: ["statewide"],
          description: "A gridded rainfall map representing estimated rainfall values over the area of coverage.",
          requires: ["metadata"]
        },
        {
          label: "Standard Error Map",
          value: "se",
          filetype: "tif",
          extents: ["statewide", "bi", "mn", "oa", "ka"],
          default_extents: ["statewide"],
          description: "A gridded map representing the standard error values for the gridded rainfall map.",
          requires: ["metadata"]
        },
        {
          label: "Anomaly Map",
          value: "anom",
          filetype: "tif",
          extents: ["statewide", "bi", "mn", "oa", "ka"],
          default_extents: ["statewide"],
          description: "A gridded map representing the production's anomaly values.",
          requires: ["metadata"]
        },
        {
          label: "Anomaly Standard Error",
          value: "anom_se",
          filetype: "tif",
          extents: ["statewide", "bi", "mn", "oa", "ka"],
          default_extents: ["statewide"],
          description: "A gridded map representing the standard error values for the production's anomaly values.",
          requires: ["metadata"]
        },
        {
          label: "Metadata and Error Metrics",
          value: "metadata",
          filetype: "txt",
          extents: ["statewide", "bi", "mn", "oa", "ka"],
          default_extents: ["statewide"],
          description: "Gridded map product metadata and error metrics.",
          requires: []
        },
        {
          label: "Station Data (Partial Filled)",
          value: "station_data_partial",
          filetype: "csv",
          extents: ["statewide", "bi", "mn", "oa", "ka"],
          default_extents: ["statewide"],
          description: "Rainfall station data. This data has undergone QA/QC and is partially filled using statistical techniques to estimate some missing values. These are the values used to generate the rainfall maps.",
          requires: []
        }
      ]
    },
    legacy_rainfall: {
      month: [
        {
          label: "Rainfall Map",
          value: "data_map",
          filetype: "tif",
          extents: ["statewide"],
          default_extents: ["statewide"],
          description: "A gridded rainfall map representing estimated rainfall values over the area of coverage.",
          requires: []
        }
      ]
    },
    tmin: {
      day: [
        {
          label: "Minimum Temperature Map",
          value: "data_map",
          filetype: "tif",
          extents: ["statewide"],
          default_extents: ["statewide"],
          description: "A gridded temperature map representing estimated minimum temperature values over the area of coverage.",
          requires: ["metadata"]
        },
        {
          label: "Standard Error Map",
          value: "se",
          filetype: "tif",
          extents: ["statewide"],
          default_extents: ["statewide"],
          description: "A gridded map representing the standard error values for the gridded minimum temperature map.",
          requires: ["metadata"]
        },
        {
          label: "Metadata and Error Metrics",
          value: "metadata",
          filetype: "txt",
          extents: ["statewide"],
          default_extents: ["statewide"],
          description: "Gridded map product metadata and error metrics.",
          requires: []
        },
        {
          label: "Station Data (Unfilled)",
          value: "station_data_raw",
          filetype: "csv",
          extents: ["statewide"],
          default_extents: ["statewide"],
          description: "Minimum temperature station data including only values provided by stations before going through QA/QC.",
          requires: []
        }
      ],
      month: [
        {
          label: "Minimum Temperature Map",
          value: "data_map",
          filetype: "tif",
          extents: ["statewide"],
          default_extents: ["statewide"],
          description: "A gridded temperature map representing estimated minimum temperature values over the area of coverage.",
          requires: ["metadata"]
        },
        {
          label: "Standard Error Map",
          value: "se",
          filetype: "tif",
          extents: ["statewide"],
          default_extents: ["statewide"],
          description: "A gridded map representing the standard error values for the gridded minimum temperature map.",
          requires: ["metadata"]
        },
        {
          label: "Metadata and Error Metrics",
          value: "metadata",
          filetype: "txt",
          extents: ["statewide"],
          default_extents: ["statewide"],
          description: "Gridded map product metadata and error metrics.",
          requires: []
        },
        {
          label: "Station Data (Unfilled)",
          value: "station_data_raw",
          filetype: "csv",
          extents: ["statewide"],
          default_extents: ["statewide"],
          description: "Minimum temperature station data including only values provided by stations before going through QA/QC.",
          requires: []
        }
      ]
    },
    tmax: {
      day: [
        {
          label: "Maximum Temperature Map",
          value: "data_map",
          filetype: "tif",
          extents: ["statewide"],
          default_extents: ["statewide"],
          description: "A gridded temperature map representing estimated maximum temperature values over the area of coverage.",
          requires: ["metadata"]
        },
        {
          label: "Standard Error Map",
          value: "se",
          filetype: "tif",
          extents: ["statewide"],
          default_extents: ["statewide"],
          description: "A gridded map representing the standard error values for the gridded maximum temperature map.",
          requires: ["metadata"]
        },
        {
          label: "Metadata and Error Metrics",
          value: "metadata",
          filetype: "txt",
          extents: ["statewide"],
          default_extents: ["statewide"],
          description: "Gridded map product metadata and error metrics.",
          requires: []
        },
        {
          label: "Station Data (Unfilled)",
          value: "station_data_raw",
          filetype: "csv",
          extents: ["statewide"],
          default_extents: ["statewide"],
          description: "Maximum temperature station data including only values provided by stations before going through QA/QC.",
          requires: []
        }
      ],
      month: [
        {
          label: "Maximum Temperature Map",
          value: "data_map",
          filetype: "tif",
          extents: ["statewide"],
          default_extents: ["statewide"],
          description: "A gridded temperature map representing estimated maximum temperature values over the area of coverage.",
          requires: ["metadata"]
        },
        {
          label: "Standard Error Map",
          value: "se",
          filetype: "tif",
          extents: ["statewide"],
          default_extents: ["statewide"],
          description: "A gridded map representing the standard error values for the gridded maximum temperature map.",
          requires: ["metadata"]
        },
        {
          label: "Metadata and Error Metrics",
          value: "metadata",
          filetype: "txt",
          extents: ["statewide"],
          default_extents: ["statewide"],
          description: "Gridded map product metadata and error metrics.",
          requires: []
        },
        {
          label: "Station Data (Unfilled)",
          value: "station_data_raw",
          filetype: "csv",
          extents: ["statewide"],
          default_extents: ["statewide"],
          description: "Maximum temperature station data including only values provided by stations before going through QA/QC.",
          requires: []
        }
      ]
    },
    tmean: {
      day: [
        {
          label: "Mean Temperature Map",
          value: "data_map",
          filetype: "tif",
          extents: ["statewide", "bi", "mn", "oa", "ka"],
          default_extents: ["statewide"],
          description: "A gridded temperature map representing estimated mean temperature values over the area of coverage.",
          requires: ["metadata"]
        },
        {
          label: "Standard Error Map",
          value: "se",
          filetype: "tif",
          extents: ["statewide", "bi", "mn", "oa", "ka"],
          default_extents: ["statewide"],
          description: "A gridded map representing the standard error values for the gridded mean temperature map.",
          requires: ["metadata"]
        },
        {
          label: "Metadata and Error Metrics",
          value: "metadata",
          filetype: "txt",
          extents: ["statewide", "bi", "mn", "oa", "ka"],
          default_extents: ["statewide"],
          description: "Gridded map product metadata and error metrics.",
          requires: []
        }
      ],
      month: [
        {
          label: "Mean Temperature Map",
          value: "data_map",
          filetype: "tif",
          extents: ["statewide"],
          default_extents: ["statewide"],
          description: "A gridded temperature map representing estimated mean temperature values over the area of coverage.",
          requires: ["metadata"]
        },
        {
          label: "Standard Error Map",
          value: "se",
          filetype: "tif",
          extents: ["statewide"],
          default_extents: ["statewide"],
          description: "A gridded map representing the standard error values for the gridded mean temperature map.",
          requires: ["metadata"]
        },
        {
          label: "Metadata and Error Metrics",
          value: "metadata",
          filetype: "txt",
          extents: ["statewide"],
          default_extents: ["statewide"],
          description: "Gridded map product metadata and error metrics.",
          requires: []
        }
      ]
    }
  }

  // datasets = {
  //   label: "Dataset",
  //     values: ,
  //     description: "The type of data you are interested in.",
  // }

  fieldData = {
    datatype: {
      label: "Datatype",
      values: {
        rainfall: {
          label: "Rainfall",
          value: "rainfall",
          description: "Rainfall data"
        },
        temperature: {
          label: "Temperature",
          value: "temperature",
          description: "Temperature data"
        }
      },
      description: "The type of data you are interested in.",
    },

    production: {
      label: "Production",
      values: {
        new: {
          label: "New",
          value: "new",
          description: "Current data using the latest methods of production.",
        },
        legacy: {
          label: "Legacy",
          value: "legacy",
          description: "Legacy data sets based on older methods of production"
        }
      },
      description: "The production method used to generate the data.",
    },

    aggregation: {
      label: "Aggregation",
      values: {
        min: {
          label: "Minimum",
          value: "min",
          description: "Uses the minimum value of the data for the time period."
        },
        max: {
          label: "Maximum",
          value: "max",
          description: "Uses the maximum value of the data for the time period."
        },
        mean: {
          label: "Mean",
          value: "mean",
          description: "Uses the mean value of the data for the time period."
        }
      },
      description: "The aggregation used for data that falls into a range for a given time period.",
    },

    period: {
      label: "Period",
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
      description: "The time period each data point is measured over.",
    },

    extent: {
      label: "Spatial Extent",
      values: {
        statewide: {
          label: "Statewide",
          value: "statewide",
          description: "Data covering the entire state of Hawaiʻi."
        },
        bi: {
          label: "Hawaiʻi County",
          value: "bi",
          description: "Data covering the county of Hawaiʻi."
        },
        ka: {
          label: "Kauai County",
          value: "ka",
          description: "Data covering the county of Kauai"
        },
        mn: {
          label: "Maui County",
          value: "mn",
          description: "Data covering the county of Maui"
        },
        oa: {
          label: "Honolulu County",
          value: "oa",
          description: "Data covering the county of Honolulu"
        }
      },
      description: "The spatial extent the data covers"
    }
  };


  fileData = {
    rainfall: {
      data_map: {
        label: "Rainfall Map",
        properties: {
          file: "data_map"
        },
        filetype: "tif",
        description: "A gridded rainfall map representing estimated rainfall values over the area of coverage.",
        requires: ["metadata"]
      },
      se: {
        label: "Standard Error Map",
        properties: {
          file: "se"
        },
        filetype: "tif",
        description: "A gridded map representing the standard error values for the gridded rainfall map.",
        requires: ["metadata"]
      },
      anom: {
        label: "Anomaly Map",
        properties: {
          file: "anom"
        },
        filetype: "tif",
        description: "A gridded map representing the production's anomaly values.",
        requires: ["metadata"]
      },
      anom_se: {
        label: "Anomaly Standard Error",
        properties: {
          file: "anom_se"
        },
        filetype: "tif",
        description: "A gridded map representing the standard error values for the production's anomaly values.",
        requires: ["metadata"]
      },
      metadata: {
        label: "Metadata and Error Metrics",
        properties: {
          file: "metadata"
        },
        filetype: "txt",
        description: "Gridded map product metadata and error metrics.",
        requires: []
      },
      station_data_partial: {
        label: "Station Data (Partial Filled)",
        properties: {
          file: "station_data",
          fill: "partial"
        },
        filetype: "csv",
        description: "Rainfall station data. This data has undergone QA/QC and is partially filled using statistical techniques to estimate some missing values. These are the values used to generate the rainfall maps.",
        requires: []
      },
      station_data_raw: {
        label: "Station Data (Unfilled)",
        properties: {
          file: "station_data",
          fill: "raw"
        },
        filetype: "csv",
        description: "Rainfall station including only values provided by stations after going through QA/QC.",
        requires: []
      }
    },

    temperature: {
      data_map: {
        label: "Temperature Map",
        properties: {
          file: "data_map"
        },
        filetype: "tif",
        description: "A gridded temperature map representing estimated temperature values over the area of coverage.",
        requires: ["metadata"]
      },
      se: {
        label: "Standard Error Map",
        properties: {
          file: "se"
        },
        filetype: "tif",
        description: "A gridded map representing the standard error values for the gridded temperature map.",
        requires: ["metadata"]
      },
      metadata: {
        label: "Metadata and Error Metrics",
        properties: {
          file: "metadata"
        },
        filetype: "txt",
        description: "Gridded map product metadata and error metrics.",
        requires: []
      },
      station_data_partial: {
        label: "Station Data (Partial Filled)",
        properties: {
          file: "station_data",
          fill: "partial"
        },
        filetype: "csv",
        description: "Temperature station data. This data has undergone QA/QC and is partially filled using statistical techniques to estimate some missing values. These are the values used to generate the rainfall maps.",
        requires: []
      },
      station_data_raw: {
        label: "Station Data (Unfilled)",
        properties: {
          file: "station_data",
          fill: "raw"
        },
        filetype: "csv",
        description: "Temperature station including only values provided by stations after going through QA/QC.",
        requires: []
      }
    }
  };


  controls = {
    dataset: null,
    period: null,
    dates: null,
    files: {}
  }

  constructor(public dialogRef: MatDialogRef<ExportAddItemComponent>, @Inject(MAT_DIALOG_DATA) public data: any, private dateManager: DateManagerService) {
    this.ranges = dateManager.getDatasetRanges();

    let dataset = data ? data.dataset : "rainfall";
    let period = data ? data.period : "month";
    let dates = data ? data.range : null;
    let fileExtents = data ? data.files : {};

    this.controls.dataset = new FormControl(dataset);
    this.controls.period = new FormControl(period);

    this.setupForms();
    this.setupFileData(fileExtents);
    this.setupDates(dates);
  }

  getFileData(): any[] {
    return Object.values(this.controls.files);
  }

  getDatasetData(): any[] {
    return Object.values(this.datasets);
  }

  setupForms() {
    this.controls.dataset.valueChanges.subscribe((dataset: string) => {
      this.setupFileData({});
      this.setupDates(null);
    });
    this.controls.period.valueChanges.subscribe((period: string) => {
      this.setupFileData({});
      this.setupDates(null);
    });

  }

  setupDates(dates: [Moment.Moment, Moment.Moment]) {
    let dataset = this.controls.dataset.value;
    let period = this.controls.period.value;
    if(this.ranges[dataset][period]) {
      let range = this.ranges[dataset][period];
      let selected = dates;
      if(!selected) {
        selected = [range[0].clone(), range[1].clone()]
      }
      this.controls.dates = {
        range: range,
        selected: selected
      };
    }
  }

  setupFileData(fileExtents: {[file: string]: string[]}) {
    let dataset = this.controls.dataset.value;
    let period = this.controls.period.value;
    if(this.files[dataset][period]) {
      this.controls.files = {};
      let fileData = this.files[dataset][period];
      for(let item of fileData) {
        let value = item.value;
        let requires = item.requires;
        let extents = fileExtents[value];
        let selected = true;
        //not in passed file extents set default values
        if(extents === undefined) {
          extents = item.default_extents;
          selected = false;
        }
        let selectControl = new FormControl(selected);
        let extentControl = new FormControl(extents);
        let fileControl = {
          label: item.label,
          selectControl: selectControl,
          extentControl: extentControl,
          description: item.description,
          filetype: item.filetype,
          extents: item.extents,
          requiredBy: new Set()
        }
        this.controls.files[value] = fileControl;
        //if requires other items update any time value changes
        if(requires.length > 0) {
          selectControl.valueChanges.subscribe((selected: boolean) => {
            let extents = extentControl.value;
            if(selected && extents.length > 0) {
              this.addRequireRefs(value, requires);
              this.addRequiredItems(extents, requires);
            }
            else {
              this.removeRequireRefs(value, requires);
            }
          });
          extentControl.valueChanges.subscribe((extents: string[]) => {
            if(extents.length > 0) {
              this.addRequireRefs(value, requires);
              this.addRequiredItems(extents, requires);
            }
            else {
              this.removeRequireRefs(value, requires);
            }
          });
        }
        let debounce = false;
        selectControl.valueChanges.subscribe((selected: boolean) => {
          //if trying to deselect disallow if required by something (note don't need debounce since bounce select will be true)
          if(!selected) {
            let requiredBy = this.controls.files[value].requiredBy;
            if(requiredBy.size > 0) {
              selectControl.setValue(true);
            }
          }
        });
        extentControl.valueChanges.subscribe((extents: string[]) => {
          //use debounce to prevent loop since setting value
          if(!debounce) {
            //check if required by anything
            let requiredBy = this.controls.files[value].requiredBy;
            if(requiredBy.size > 0) {
              debounce = true;
              //get smallest set of valid extents based on require items and append to value to ensure theyre still there
              let extentList = extents;
              for(let item of requiredBy) {
                let requiredExtents = this.controls.files[item].extentControl.value;
                extentList = extentList.concat(requiredExtents);
              }
              //strip dupes
              extentList = Array.from(new Set(extentList));
              extentControl.setValue(extentList);
            }
          }
          else {
            debounce = false;
          }

        });
      }
    }
  }

  addRequireRefs(value: string, requires: string[]) {
    for(let item of requires) {
      this.controls.files[item].requiredBy.add(value);
    }
  }

  removeRequireRefs(value: string, requires: string[]) {
    for(let item of requires) {
      this.controls.files[item].requiredBy.delete(value);
    }
  }

  addRequiredItems(extents: string[], requires: string[]) {
      for(let item of requires) {
        let requireSelectControl = this.controls.files[item].selectControl;
        let requireExtentControl = this.controls.files[item].extentControl;
        let requireExtents = requireExtentControl.value;
        //add extents to require extents list
        requireExtents = requireExtents.concat(extents);
        //remove duplicate values
        requireExtents = Array.from(new Set(requireExtents));
        //set require values
        requireExtentControl.setValue(requireExtents);
        requireSelectControl.setValue(true);
      }
  }



  filesSelected() {
    let selected = false;
    for(let value in this.controls.files) {
      let fileData = this.controls.files[value];
      if(fileData.selectControl.value) {
        //make sure some extent is selected
        if(fileData.extentControl.value.length > 0) {
          selected = true;
          break;
        }
      }
    }
    return selected;
  }

  //return info about the export item
  cancel(): void {
    this.dialogRef.close(null);
  }

  submit() {
    let dataset = this.controls.dataset.value;
    let period = this.controls.period.value;
    let range = this.controls.dates.selected;
    let data = {
      data: {
        dataset: dataset,
        period: period,
        range: range,
        files: {}
      },
      labels: {
        dataset: `${this.periods.values[period].label} ${this.datasets[dataset].label} ${this.dateManager.dateToString(range[0], period, true)} - ${this.dateManager.dateToString(range[1], period, true)}`,
        files: []
      }
    };
    for(let file in this.controls.files) {
      let fileData = this.controls.files[file];
      let selected = fileData.selectControl.value;
      if(selected) {
        let extents = fileData.extentControl.value;
        data.data.files[file] = extents;
        data.labels.files.push(fileData.label);
      }
    }
    this.dialogRef.close(data);
  }


}


