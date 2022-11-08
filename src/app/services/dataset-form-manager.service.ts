import { Injectable } from '@angular/core';
import moment, { Moment, unitOfTime } from 'moment';
import { StringMap } from '../models/types';
import { DateManagerService } from './dateManager/date-manager.service';


@Injectable({
  providedIn: 'root'
})
export class DatasetFormManagerService {
  private _datasetFormData: DatasetFormData;
  private _datasets: {[tag: string]: Dataset};
  private _activeDataset: Dataset;
  private _activeItem: DatasetItem;
  private _state: StringMap;

  constructor(private dateHandler: DateManagerService) {

    // let t = new TimeseriesData(moment("1990-01-01"), moment("2022-10-25"), "minute", 30);
    // console.log(t.roundToInterval(moment.utc("2022-01-02:10:14:59")).toISOString());


    this.setupDatasets();

    //start with rainfall data
    this._activeDataset = this._datasets["rainfall"];

    //default values for each node
    this._state = {
      period: "month",
      fill: "partial",
      dsm: "statistical",
      model: "rcp45",
      season: "annual"
    };
    this.updateState();
  }

  ////////////// set up datasets ///////////////////
  private setupDatasets() {
    //set up form data

    ////values
    //////period
    let periodDay = new FormValue(new DisplayData("Data measured at a daily time scale.", "Daily", "day"), {period: "day"}, [true, true]);
    let periodMonth = new FormValue(new DisplayData("Data measured at a monthly time scale.", "Monthly", "month"), {period: "month"}, [true, true]);
    //////fill
    let fillUnfilled = new FormValue(new DisplayData("Station data including only values provided by stations before going through QA/QC.", "Unfilled", "unfilled"), {fill: "raw"}, [false, true]);
    let fillPartialFilled = new FormValue(new DisplayData("This data has undergone QA/QC and is partially filled using statistical techniques to estimate some missing station values.", "Partial Filled", "partial"), {fill: "partial"}, [false, true]);
    //////downscaling method
    let dsmDynamical = new FormValue(new DisplayData("Dynamical downscaling uses high resolution regional climate models to extrapolate lower resolution global climate models down to an area of interest.", "Dynamical", "dynamical"), {dsm: "dynamical"}, [true, true]);
    let dsmStatistical = new FormValue(new DisplayData("Statistical downscaling uses historical climatological data to statistically approximate future values.", "Statistical", "statistical"), {dsm: "statistical"}, [true, true]);
    //////climate model
    let climateRCP45 = new FormValue(new DisplayData("A climate scenario assuming peak emissions around 2040. This scenario approximates a rise in global temperature by between 2.5 and 3°C by the year 2100.", "RCP 4.5", "rcp45"), {model: "rcp45"}, [true, true]);
    let climateRCP85 = new FormValue(new DisplayData("A worst case climate scenario assuming continuously rising rates of emissions. This scenario approximates a rise in global temperature of about 5°C by the year 2100.", "RCP 8.5", "rcp85"), {model: "rcp85"}, [true, true]);
    //////season
    let seasonAnnual = new FormValue(new DisplayData("Includes all annual data.", "Annual", "annual"), {season: "annual"}, [true, true]);
    let seasonDry = new FormValue(new DisplayData("Only includes data from the wet season.", "Wet", "wet"), {season: "wet"}, [true, true]);
    let seasonWet = new FormValue(new DisplayData("Only includes data from the dry season.", "Dry", "dry"), {season: "dry"}, [true, true]);
    //////DS period
    let periodPresent = new FormValue(new DisplayData("Present day baseline values based on recorded climate data.", "Present Day", "present"), {period: "present"}, [true, true]);
    let periodMid = new FormValue(new DisplayData("Mid-century (2040-2069) projections.", "Mid-Century (2040-2069)", "mid"), {period: "mid"}, [true, true]);
    let periodLate = new FormValue(new DisplayData("Late-century (2070-2099) projections.", "Late-Century (2070-2099)", "late"), {period: "end"}, [true, true]);

    let periodNode = new FormNode(new DisplayData("The time period over which the data is measured.", "Time Period", "period"), [
      periodDay,
      periodMonth
    ]);
    let fillNode = new FormNode(new DisplayData("The type of processing the station data goes through.", "Data Fill", "fill"), [
      fillUnfilled,
      fillPartialFilled
    ]);
    let dsmNode = new FormNode(new DisplayData("The type of downscaling climate model used for future projections.", "Downscaling Method", "dsm"), [
      dsmDynamical,
      dsmStatistical
    ]);
    let climateNode = new FormNode(new DisplayData("The climate model used to predict future data.", "Future Climate Model", "model"), [
      climateRCP45,
      climateRCP85
    ]);
    let seasonNode = new FormNode(new DisplayData("The season measurements and projections are made for.", "Season", "season"), [
      seasonAnnual,
      seasonDry,
      seasonWet
    ]);
    let dsPeriodStatisticalNode = new FormNode(new DisplayData("The period of coverage for the data to display, including baseline present day data and future projections", "Data Period", "ds_period"), [
      periodPresent,
      periodMid,
      periodLate
    ]);
    let dsPeriodDynamicalNode = new FormNode(new DisplayData("The period of coverage for the data to display, including baseline present day data and future projections", "Data Period", "ds_period"), [
      periodPresent,
      periodLate
    ]);

    ////categories
    //right now only fill data is categorized separately under station data
    let stationDataFillCategory = new FormCategory(new DisplayData("These options apply only to the station data displayed on the map. Gridded map products are generated using partial filled station data.", "Station Data", "station_data"), [
      fillNode
    ]);

    ////form data
    //new rainfall and min and max temperature all use same elements so make one and reuse
    let rainfallMinMaxTempFormData = new FormData([
      periodNode
    ], [
      stationDataFillCategory
    ]);
    //legacy and mean temperature use the same elements
    let legacyRainfallMeanTempFormData = new FormData([
      periodNode
    ], []);
    //rainfall downscaling data
    let dsRainfallFormData = new FormData([
      dsmNode,
      climateNode,
      seasonNode
    ], []);
    //temperature downscaling data
    let dsTemperatureFormData = new FormData([
      dsmNode,
      climateNode
    ], []);

    //Create Focus Managers
    ////dates
    let now = moment();
    let lastMonth = now.clone().subtract(1, "month").startOf("month");
    let lastDay = now.clone().subtract(1, "day").startOf("day");
    let date1990 = moment("1990-01-01");
    let date1920 = moment("1920-01");
    let date2018 = moment("2018-12");
    let date2012 = moment("2012-12");
    ////periods
    let monthPeriod = new PeriodData("month", 1, "month");
    let dayPeriod = new PeriodData("day", 1, "day");
    ////focus managers
    let rainfallMonthFocusManager = new TimeseriesData(date1990, lastMonth, monthPeriod, [monthPeriod, dayPeriod], this.dateHandler, lastMonth);
    let temperatureRainfallDayFocusManager = new TimeseriesData(date1990, lastDay, dayPeriod, [dayPeriod], this.dateHandler, lastDay);
    let legacyRainfallFocusManager = new TimeseriesData(date1920, date2012, monthPeriod, [monthPeriod], this.dateHandler, date2012);
    let temperatureMonthFocusManager = new TimeseriesData(date1990, date2018, monthPeriod, [monthPeriod, dayPeriod], this.dateHandler, date2018);
    let dsDynamicalFocusManager = new TimeSelectorData(dsPeriodDynamicalNode, periodPresent);
    let dsStatisticalFocusManager = new TimeSelectorData(dsPeriodStatisticalNode, periodPresent);

    //Create Datasets
    ////Dataset Items
    //////Rainfall
    let rainfallMonthPartial = new DatasetItem(true, true, "Millimeters", "mm", "Rainfall", "Monthly Rainfall", [0, 650], [true, false], rainfallMonthFocusManager, false, {
      period: "month",
      fill: "partial"
    });
    let rainfallDayPartial = new DatasetItem(true, false, "Millimeters", "mm", "Rainfall", "Daily Rainfall", [0, 20], [true, false], temperatureRainfallDayFocusManager, false, {
      period: "day",
      fill: "partial"
    });
    let rainfallDayUnfilled = new DatasetItem(true, false, "Millimeters", "mm", "Rainfall", "Daily Rainfall", [0, 20], [true, false], temperatureRainfallDayFocusManager, false, {
      period: "day",
      fill: "unfilled"
    });
    //////Legacy Rainfall
    let legacyRainfallMonth = new DatasetItem(false, true, "Millimeters", "mm", "Rainfall", "Monthly Rainfall", [0, 650], [true, false], legacyRainfallFocusManager, false, {
      period: "month"
    });
    //////Min Temperature
    let minTemperatureMonthUnfilled = new DatasetItem(true, true, "Celcius", "°C", "Minimum Temperature", "Monthly Minimum Temperature", [-10, 35], [false, false], temperatureMonthFocusManager, true, {
      period: "month",
      fill: "unfilled"
    });
    let minTemperatureDayUnfilled = new DatasetItem(true, true, "Celcius", "°C", "Minimum Temperature", "Daily Minimum Temperature", [-10, 35], [false, false], temperatureRainfallDayFocusManager, true, {
      period: "day",
      fill: "unfilled"
    });
    //////Max Temperature
    let maxTemperatureMonthUnfilled = new DatasetItem(true, true, "Celcius", "°C", "Maximum Temperature", "Monthly Maximum Temperature", [-10, 35], [false, false], temperatureMonthFocusManager, true, {
      period: "month",
      fill: "unfilled"
    });
    let maxTemperatureDayUnfilled = new DatasetItem(true, true, "Celcius", "°C", "Maximum Temperature", "Daily Maximum Temperature", [-10, 35], [false, false], temperatureRainfallDayFocusManager, true, {
      period: "day",
      fill: "unfilled"
    });
    //////Mean Temperature
    let meanTemperatureMonthUnfilled = new DatasetItem(false, true, "Celcius", "°C", "Mean Temperature", "Monthly Mean Temperature", [-10, 35], [false, false], temperatureMonthFocusManager, true, {
      period: "month"
    });
    let meanTemperatureDayUnfilled = new DatasetItem(false, true, "Celcius", "°C", "Mean Temperature", "Daily Mean Temperature", [-10, 35], [false, false], temperatureRainfallDayFocusManager, true, {
      period: "day"
    });
    //////DS Rainfall
    let dsRainfallStatisticalRcp45Annual = new DatasetItem(false, true, "Millimeters", "mm", "Rainfall", "Statistically Downscaled Annual Rainfall (RCP 4.5)", [0, 10000], [true, false], dsStatisticalFocusManager, false, {
      dsm: "statistical",
      model: "rcp45",
      season: "annual"
    });
    let dsRainfallStatisticalRcp45Wet = new DatasetItem(false, true, "Millimeters", "mm", "Rainfall", "Statistically Downscaled Wet Season Rainfall (RCP 4.5)", [0, 5000], [true, false], dsStatisticalFocusManager, false, {
      dsm: "statistical",
      model: "rcp45",
      season: "wet"
    });
    let dsRainfallStatisticalRcp45Dry = new DatasetItem(false, true, "Millimeters", "mm", "Rainfall", "Statistically Downscaled Dry Season Rainfall (RCP 4.5)", [0, 5000], [true, false], dsStatisticalFocusManager, false, {
      dsm: "statistical",
      model: "rcp45",
      season: "dry"
    });
    let dsRainfallStatisticalRcp85Annual = new DatasetItem(false, true, "Millimeters", "mm", "Rainfall", "Statistically Downscaled Annual Rainfall (RCP 8.5)", [0, 10000], [true, false], dsStatisticalFocusManager, false, {
      dsm: "statistical",
      model: "rcp85",
      season: "annual"
    });
    let dsRainfallStatisticalRcp85Wet = new DatasetItem(false, true, "Millimeters", "mm", "Rainfall", "Statistically Downscaled Wet Season Rainfall (RCP 8.5)", [0, 5000], [true, false], dsStatisticalFocusManager, false, {
      dsm: "statistical",
      model: "rcp85",
      season: "wet"
    });
    let dsRainfallStatisticalRcp85Dry = new DatasetItem(false, true, "Millimeters", "mm", "Rainfall", "Statistically Downscaled Dry Season Rainfall (RCP 8.5)", [0, 5000], [true, false], dsStatisticalFocusManager, false, {
      dsm: "statistical",
      model: "rcp85",
      season: "dry"
    });
    let dsRainfallDynamicalRcp45Annual = new DatasetItem(false, true, "Millimeters", "mm", "Rainfall", "Dynamically Downscaled Annual Rainfall (RCP 4.5)", [0, 10000], [true, false], dsDynamicalFocusManager, false, {
      dsm: "dynamical",
      model: "rcp45",
      season: "annual"
    });
    let dsRainfallDynamicalRcp45Wet = new DatasetItem(false, true, "Millimeters", "mm", "Rainfall", "Dynamically Downscaled Wet Season Rainfall (RCP 4.5)", [0, 5000], [true, false], dsDynamicalFocusManager, false, {
      dsm: "dynamical",
      model: "rcp45",
      season: "wet"
    });
    let dsRainfallDynamicalRcp45Dry = new DatasetItem(false, true, "Millimeters", "mm", "Rainfall", "Dynamically Downscaled Dry Season Rainfall (RCP 4.5)", [0, 5000], [true, false], dsDynamicalFocusManager, false, {
      dsm: "dynamical",
      model: "rcp45",
      season: "dry"
    });
    let dsRainfallDynamicalRcp85Annual = new DatasetItem(false, true, "Millimeters", "mm", "Rainfall", "Dynamically Downscaled Annual Rainfall (RCP 8.5)", [0, 10000], [true, false], dsDynamicalFocusManager, false, {
      dsm: "dynamical",
      model: "rcp85",
      season: "annual"
    });
    let dsRainfallDynamicalRcp85Wet = new DatasetItem(false, true, "Millimeters", "mm", "Rainfall", "Dynamically Downscaled Wet Season Rainfall (RCP 8.5)", [0, 5000], [true, false], dsDynamicalFocusManager, false, {
      dsm: "dynamical",
      model: "rcp85",
      season: "wet"
    });
    let dsRainfallDynamicalRcp85Dry = new DatasetItem(false, true, "Millimeters", "mm", "Rainfall", "Dynamically Downscaled Dry Season Rainfall (RCP 8.5)", [0, 5000], [true, false], dsDynamicalFocusManager, false, {
      dsm: "dynamical",
      model: "rcp85",
      season: "dry"
    });
    //////DS Temperature
    let dsTemperatureStatisticalRcp45 = new DatasetItem(false, true, "Celcius", "°C", "Temperature", "Statistically Downscaled Temperature (RCP 4.5)", [-10, 35], [false, false], dsStatisticalFocusManager, true, {
      dsm: "statistical",
      model: "rcp45"
    });
    let dsTemperatureStatisticalRcp85 = new DatasetItem(false, true, "Celcius", "°C", "Temperature", "Statistically Downscaled Temperature (RCP 8.5)", [-10, 35], [false, false], dsStatisticalFocusManager, true, {
      dsm: "statistical",
      model: "rcp85"
    });
    let dsTemperatureDynamicalRcp45 = new DatasetItem(false, true, "Celcius", "°C","Temperature", "Dynamically Downscaled Temperature (RCP 4.5)", [-10, 35], [false, false], dsDynamicalFocusManager, true, {
      dsm: "dynamical",
      model: "rcp45"
    });
    let dsTemperatureDynamicalRcp85 = new DatasetItem(false, true, "Celcius", "°C","Temperature", "Dynamically Downscaled Temperature (RCP 8.5)", [-10, 35], [false, false], dsDynamicalFocusManager, true, {
      dsm: "dynamical",
      model: "rcp85"
    });

    ////Datasets
    let rainfallDataset = new Dataset(new DisplayData("Rainfall data (1990 - present).", "Rainfall", "rainfall"), {
      datatype: "rainfall",
      production: "new"
    }, rainfallMinMaxTempFormData, [
      rainfallMonthPartial,
      rainfallDayPartial,
      rainfallDayUnfilled
    ]);
    let legacyRainfallDataset = new Dataset(new DisplayData("Legacy rainfall data based on older production methods (1920 - 2012).", "Legacy Rainfall", "legacy_rainfall"), {
      datatype: "rainfall",
      production: "legacy"
    }, legacyRainfallMeanTempFormData, [
      legacyRainfallMonth
    ]);
    let maxTemperatureDataset = new Dataset(new DisplayData("Temperature data aggregated to its maximum value over the time period.", "Maximum Temperature", "max_temp"), {
      datatype: "temperature",
      aggregation: "max"
    }, rainfallMinMaxTempFormData, [
      maxTemperatureMonthUnfilled,
      maxTemperatureDayUnfilled
    ]);
    let minTemperatureDataset = new Dataset(new DisplayData("Temperature data aggregated to its minimum value over the time period.", "Minimum Temperature", "min_temp"), {
      datatype: "temperature",
      aggregation: "min"
    }, rainfallMinMaxTempFormData, [
      minTemperatureMonthUnfilled,
      minTemperatureDayUnfilled
    ]);
    let meanTemperatureDataset = new Dataset(new DisplayData("Temperature data aggregated to its average value over the time period.", "Mean Temperature", "mean_temp"), {
      datatype: "temperature",
      aggregation: "mean"
    }, legacyRainfallMeanTempFormData, [
      meanTemperatureDayUnfilled,
      meanTemperatureMonthUnfilled
    ]);
    let dsRainfallDataset = new Dataset(new DisplayData("Downscaled future projections for rainfall data.", "Rainfall Projections", "ds_rainfall"), {
      datatype: "downscaling_rainfall"
    }, dsRainfallFormData, [
      dsRainfallStatisticalRcp45Annual,
      dsRainfallStatisticalRcp45Dry,
      dsRainfallStatisticalRcp45Wet,
      dsRainfallStatisticalRcp85Annual,
      dsRainfallStatisticalRcp85Dry,
      dsRainfallStatisticalRcp85Wet,
      dsRainfallDynamicalRcp45Annual,
      dsRainfallDynamicalRcp45Dry,
      dsRainfallDynamicalRcp45Wet,
      dsRainfallDynamicalRcp85Annual,
      dsRainfallDynamicalRcp85Dry,
      dsRainfallDynamicalRcp85Wet
    ]);
    let dsTemperatureDataset = new Dataset(new DisplayData("Downscaled future projections for temperature data.", "Temperature Projections", "ds_temp"), {
      datatype: "downscaling_temperature"
    }, dsTemperatureFormData, [
      dsTemperatureStatisticalRcp45,
      dsTemperatureStatisticalRcp85,
      dsTemperatureDynamicalRcp45,
      dsTemperatureDynamicalRcp85
    ]);
    let datasets = [rainfallDataset, legacyRainfallDataset, maxTemperatureDataset, minTemperatureDataset, meanTemperatureDataset, dsRainfallDataset, dsTemperatureDataset];
    this._datasets = {};
    for(let dataset of datasets) {
      this._datasets[dataset.tag] = dataset;
    }
    let datasetSingles: Dataset[] = [];
    let datasetGroupers: DatasetSelectorGroup[] = [
      new DatasetSelectorGroup(new DisplayData("Datasets using emperical rainfall data.", "Historical Rainfall", "historical_rainfall"), [rainfallDataset, legacyRainfallDataset]),
      new DatasetSelectorGroup(new DisplayData("Datasets using temperature data", "Historical Temperature", "historical_temperature"), [maxTemperatureDataset, minTemperatureDataset, meanTemperatureDataset]),
      new DatasetSelectorGroup(new DisplayData("Future climate projections using downscaling prediction methods.", "Downscaled Climate Projections", "downscaled"), [dsRainfallDataset, dsTemperatureDataset])
    ];
    this._datasetFormData = new DatasetFormData(new DisplayData("Select the type of data you would like to view. Hover over an option for a description of the dataset.", "Dataset", "dataset"), datasetSingles, datasetGroupers);
  }

  private updateState() {
    let stateData = this._activeDataset.getStateData(this._state);
    this._state = stateData.state;
    this._activeItem = stateData.item;
  }

  public setValue(field: string, tag: string): ParamFormData {
    this._state[field] = tag;
    //if changing dataset
    if(field == "dataset") {
      this._activeDataset = this._datasets[tag];
    }
    this.updateState();

    return {
      formData: this._activeItem.formData,
      values: this._activeItem.values,
      coverageLabel: this._activeItem.coverageLabel
    };
  }

  public setDataset(tag: string): ParamFormData {
    return this.setValue("dataset", tag);
  }

  public getDatasetItem() {
    return this._activeItem;
  }

  public getAllFormData(): AllFormData {
    return {
      datasetFormData: this._datasetFormData,
      paramFormData: this._activeItem.formData,
      values: Object.assign({
        dataset: this._activeDataset.tag
      }, this._activeItem.values),
      coverageLabel: this._activeItem.coverageLabel
    };
  }
}


type ParamFormData = {
  formData: FormData,
  values: StringMap,
  coverageLabel: string
};
export type AllFormData = {
  datasetFormData: DatasetFormData,
  paramFormData: FormData,
  values: StringMap,
  coverageLabel: string
}


export class DatasetFormData {
  private _displayData: DisplayData;
  private _datasetValues: FormValue[];
  private _groupers: DatasetSelectorGroup[];

  constructor(displayData: DisplayData, datasets: Dataset[], datasetGroups: DatasetSelectorGroup[]) {
    this._displayData = displayData;
    this._datasetValues = datasets.map((dataset: Dataset) => {
      return new FormValue(dataset.displayData, dataset.paramData, [true, true]);
    });
    this._groupers = datasetGroups;
  }

  get description(): string {
    return this._displayData.description;
  }

  get label(): string {
    return this._displayData.label;
  }

  get tag(): string {
    return this._displayData.tag;
  }

  get displayData(): DisplayData {
    return this._displayData;
  }

  get datasetValues(): FormValue[] {
    return this._datasetValues;
  }

  get datasetGroups(): DatasetSelectorGroup[] {
    return this._groupers;
  }
}

class DatasetSelectorGroup {
  private _displayData: DisplayData;
  private _values: DisplayData[];

  constructor(displayData: DisplayData, datasets: Dataset[]) {
    this._values = datasets.map((dataset: Dataset) => {
      return dataset.displayData;
    });
    this._displayData = displayData;
  }

  get description(): string {
    return this._displayData.description;
  }

  get label(): string {
    return this._displayData.label;
  }

  get tag(): string {
    return this._displayData.tag;
  }

  get displayData(): DisplayData {
    return this._displayData;
  }

  get values(): DisplayData[] {
    return this._values;
  }
}

export class FormData {
  private _default: FormNode[];
  private _categorized: FormCategory[];

  constructor(defaultNodes: FormNode[], categorizedNodes: FormCategory[]) {
    this._default = defaultNodes;
    this._categorized = categorizedNodes;
  }

  get default(): FormNode[] {
    return this._default;
  }

  get categorized(): FormCategory[] {
    return this._categorized;
  }

  private filterNodes(values: any, nodes: FormNode[]) {
    return nodes.map((node: FormNode) => {
      let tag = node.tag;
      let valueTags = values[tag];
      return node.filter(valueTags);
    });
  }

  public filter(values: any): FormData {
    let filteredDefault = this.filterNodes(values, this._default);
    let filteredCategorized = this._categorized.map((category: FormCategory) => {
      let nodes = this.filterNodes(values, category.nodes);
      return new FormCategory(category.displayData, nodes);
    });
    return new FormData(filteredDefault, filteredCategorized);
  }
}


//each dataset has a specific set of fields, define the entire set of fields and values, specific items can have subsets that are valid for it (all descriptions etc must be the same)
//dataset fields can be bound together by using the same tags
//each individual item will just have a tag map
//what properties are dataset specific?
class Dataset {
  private _displayData: DisplayData;
  private _formData: FormData;
  private _fields: string[];
  private _itemMap: any;
  private _paramData: StringMap;

  constructor(displayData: DisplayData, paramData: StringMap, formData: FormData, items: DatasetItem[]) {
    this._fields = [];
    for(let node of formData.default) {
      this._fields.push(node.tag);
    }
    for(let category of formData.categorized) {
      for(let node of category.nodes) {
        this._fields.push(node.tag);
      }
    }
    this._formData = formData;
    this._displayData = displayData;
    this._paramData = paramData;
    this._itemMap = {};
    for(let item of items) {
      this.addItem(item);
    }
  }

  private addItem(item: DatasetItem) {
    item.dataset = this;
    let values = item.values;
    let tree = this._itemMap;
    let i: number;
    for(i = 0; i < this._fields.length - 1; i++) {
      let field = this._fields[i];
      let value = values[field];
      let next = tree[value];
      if(next === undefined) {
        next = {};
        tree[value] = next;
      }
      tree = next;
    }
    //leaf node should ne the dataset item
    let field = this._fields[i];
    let value = values[field];
    tree[value] = item;
  }

  get formData(): FormData {
    return this._formData;
  }

  get description(): string {
    return this._displayData.description;
  }

  get label(): string {
    return this._displayData.label;
  }

  get tag(): string {
    return this._displayData.tag;
  }

  get displayData(): DisplayData {
    return this._displayData;
  }

  get paramData(): StringMap {
    return this._paramData;
  }

  public getStateData(state: StringMap) {
    //retrieve corrected state, the dataset item associated with it, and form data
    let correctedState = Object.assign({}, state);
    let validValues = {};
    let tree = this._itemMap;
    for(let field of this._fields) {
      //get form data (valid values for subtree)
      let fieldValues = Object.keys(tree);
      validValues[field] = fieldValues;

      let stateValue = state[field];
      let next = tree[stateValue];
      if(next === undefined) {
        let validStateValue = fieldValues[0];
        correctedState[field] = validStateValue;
        next = tree[validStateValue];
      }
      tree = next;
    }
    //leaf node is the dataset item
    let datasetItem: DatasetItem = tree;
    //check if form info cached in item
    if(datasetItem.formData === null) {
      let filteredFormData = this.formData.filter(validValues);
      //cache form data in the item so don't have to recompute if same combination selected, can use this field to retrieve form data in caller
      datasetItem.formData = filteredFormData;
    }

    //process form data into FormData object by filtering values
    return {
      //leaf node is the dataset item
      item: datasetItem,
      state: correctedState
    }
  }
}


export class DatasetItem {
  private _includeStations: boolean;
  private _includeRaster: boolean;
  private _units: string;
  private _unitsShort: string;
  private _dataRange: [number, number];
  private _rangeAbsolute: [boolean, boolean];
  //when select date options should emit param data for date
  private _focusManager: FocusManager<any>;
  private _values: StringMap;
  private _formData: FormData;
  private _reverseColors: boolean;
  private _datatype: string;
  private _label: string;
  private _fieldData: {[tag: string]: DisplayData};
  private _rasterParams: StringMap;
  private _stationParams: StringMap;


  constructor(includeStations: boolean, includeRaster: boolean, units: string, unitsShort: string, datatype: string, label: string, dataRange: [number, number], rangeAbsolute: [boolean, boolean], focusManager: FocusManager<any>, reverseColors: boolean, values: StringMap) {
    this._includeRaster = includeRaster;
    this._includeStations = includeStations;
    this._units = units;
    this._unitsShort = unitsShort;
    this._dataRange = dataRange;
    this._rangeAbsolute = rangeAbsolute;
    this._values = values;
    this._formData = null;
    this._reverseColors = reverseColors;
    this._datatype = datatype;
    this._label = label;
    this._focusManager = focusManager;
  }

  get label(): string {
    return this._label;
  }

  get datatype(): string {
    return this._datatype;
  }

  get formData(): FormData {
    return this._formData;
  }

  set formData(formData: FormData) {
    this._formData = formData;
  }

  get values(): StringMap {
    return this._values;
  }

  get includeStations(): boolean {
    return this._includeStations;
  }

  get includeRaster(): boolean {
    return this._includeRaster;
  }

  get units(): string {
    return this._units;
  }

  get unitsShort(): string {
    return this._unitsShort;
  }

  get dataRange(): [number, number] {
    return this._dataRange;
  }

  get rangeAbsolute(): [boolean, boolean] {
    return this._rangeAbsolute;
  }

  get reverseColors(): boolean {
    return this._reverseColors;
  }

  get rasterParams(): StringMap {
    return this._rasterParams;
  }

  get stationParams(): StringMap {
    return this._stationParams;
  }

  get focusManager(): FocusManager<any> {
    return this._focusManager;
  }

  get coverageLabel(): string {
    return this.focusManager.coverageLabel;
  }

  set dataset(dataset: Dataset) {
    this._rasterParams = Object.assign({}, dataset.paramData);
    this._stationParams = Object.assign({}, dataset.paramData);
    this._fieldData = {
      dataset: dataset.displayData
    };
    dataset.formData.default.forEach(this._setNodeData.bind(this));
    for(let category of dataset.formData.categorized) {
      category.nodes.forEach(this._setNodeData.bind(this));
    }
  }

  private _setNodeData(node: FormNode) {
    let valueTag = this.values[node.tag];
    //get value data for item that matches the tag for this item
    let valueData = node.values.find((value: FormValue) => {
      return value.tag == valueTag;
    });
    if(valueData.applicability[0]) {;
      this._rasterParams = Object.assign(this._rasterParams, valueData.paramData);
    }
    if(valueData.applicability[1]) {
      this._stationParams = Object.assign(this._stationParams, valueData.paramData);
    }
    this._fieldData[node.tag] = valueData.displayData;
  }

  getFieldLabel(field: string): string {
    return this._fieldData[field].label;
  }

  getFieldDescription(field: string): string {
    return this._fieldData[field].description;
  }
}


export type UnitOfTime = "year" | "month" | "day" | "hour" | "minute" | "second";

export class FocusData<T> {
  private _paramData: StringMap;
  private _label: string;
  private _data: T;
  private _type: string

  constructor(type: string, label: string, paramData: StringMap, data: T) {
    this._label = label;
    this._paramData = paramData;
    this._data = data;
    this._type = type;
  }

  get type(): string {
    return this._type;
  }

  get label(): string {
    return this._label;
  }

  get data(): T {
    return this._data;
  }

  get paramData(): StringMap {
    return this._paramData;
  }
}

export abstract class FocusManager<T> {
  private _type: string;
  private _coverageLabel: string;
  private _defaultValue: T;

  constructor(type: string, coverageLabel: string, defaultValue: T) {
    this._coverageLabel = coverageLabel;
    this._type = type;
    this._defaultValue = defaultValue;
  }

  get type(): string {
    return this._type;
  }

  abstract getFocusData(value: T): FocusData<T>;

  get coverageLabel(): string {
    return this._coverageLabel;
  };

  get defaultValue(): T {
    return this._defaultValue;
  }
}

export class TimeSelectorData extends FocusManager<FormValue> {
  private _formData: FormNode;

  constructor(formData: FormNode, defaultValue: FormValue) {
    let labels = formData.values.map((value: FormValue) => {
      return value.label;
    });
    let coverageLabel = labels.join(", ");
    super("selector", coverageLabel, defaultValue);
    this._formData = formData;
  }

  get formData(): FormNode {
    return this._formData;
  }

  getFocusData(value: FormValue): FocusData<FormValue> {
    return new FocusData(this.type, value.label, value.paramData, value);
  }
}

export class PeriodData {
  private _unit: UnitOfTime;
  private _interval: number;
  private _tag: string;

  constructor(unit: UnitOfTime, interval: number, tag: string) {
    this._unit = unit;
    this._interval = interval;
    this._tag = tag;
  }

  get unit(): UnitOfTime {
    return this._unit;
  }

  get interval(): number {
    return this._interval;
  }

  get tag(): string {
    return this._tag;
  }
}

export class TimeseriesData extends FocusManager<Moment> {
  private _start: Moment;
  private _end: Moment;
  private _period: PeriodData;
  private _timeseriesPeriods: PeriodData[];
  private _dateHandler: DateManagerService;

  constructor(start: Moment, end: Moment, period: PeriodData, timeseriesPeriods: PeriodData[], dateHandler: DateManagerService, defaultDate: Moment) {
    let coverageLabel = `${dateHandler.dateToString(start, period.unit, true)} - ${dateHandler.dateToString(end, period.unit, true)}`;
    super("timeseries", coverageLabel, defaultDate);
    this._start = start;
    this._end = end;
    this._period = period;
    this._timeseriesPeriods = timeseriesPeriods;
    this._dateHandler = dateHandler;
  }

  addInterval(time: Moment, n: number = 1): Moment {
    let result = this.roundToInterval(time);
    result.add(n * this.interval, this.unit);
    result = this.lockToRange(result);
    return result;
  }

  roundToInterval(time: Moment) {
    let base = this._start.clone();
    let timeClone = time.clone();
    let intervalDiff = timeClone.diff(base, this.unit) / this.interval;
    let roundedDiff = Math.round(intervalDiff) * this.interval;
    base.add(roundedDiff, this.unit);
    base = this.lockToRange(base);
    return base;
  }

  lockToRange(time: Moment) {
    let res: Moment = time;
    if(time.isBefore(this._start)) {
      res = this._start.clone();
    }
    else if(time.isAfter(this._end)) {
      res = this._end.clone();
    }
    return res;
  }

  getFocusData(time: Moment): FocusData<Moment> {
    return new FocusData(this.type, this._dateHandler.dateToString(time, this.unit, true), {date: this._dateHandler.dateToString(time, this.unit, false)}, time);
  }

  get start(): Moment {
    return this._start;
  }

  get end(): Moment {
    return this._end;
  }

  get unit(): UnitOfTime {
    return this._period.unit;
  }

  get interval(): number {
    return this._period.interval;
  }

  get period(): PeriodData {
    return this._period;
  }

  get timeseriesPeriods(): PeriodData[] {
    return this._timeseriesPeriods;
  }
}


export class FormCategory {
  private _displayData: DisplayData;
  private _nodes: FormNode[];

  constructor(displayData: DisplayData, nodes: FormNode[]) {
    this._displayData = displayData;
    this._nodes = nodes;
  }

  get description(): string {
    return this._displayData.description;
  }

  get label(): string {
    return this._displayData.label;
  }

  get tag(): string {
    return this._displayData.tag;
  }

  get displayData(): DisplayData {
    return this._displayData;
  }

  get nodes(): FormNode[] {
    return this._nodes;
  }
}

//note use "true" and "false" as special value tags for toggles
export class FormNode {
  private _displayData: DisplayData
  private _values: FormValue[];

  constructor(displayData: DisplayData, values: FormValue[]) {
    this._displayData = displayData;
    this._values = values;
  }

  get description(): string {
    return this._displayData.description;
  }

  get label(): string {
    return this._displayData.label;
  }

  get tag(): string {
    return this._displayData.tag;
  }

  get displayData(): DisplayData {
    return this._displayData;
  }

  get values(): FormValue[] {
    return this._values;
  }

  public filter(valueTags: string[]): FormNode {
    let tagSet = new Set(valueTags);
    let filteredValues = this._values.filter((value: FormValue) => {
      return tagSet.has(value.tag);
    });
    return new FormNode(this._displayData, filteredValues);
  }
}

export class FormValue {
  private _displayData: DisplayData;
  private _paramData: StringMap;
  private _applicability: [boolean, boolean];

  constructor(displayData: DisplayData, paramData: StringMap, applicability: [boolean, boolean]) {
    this._displayData = displayData;
    this._paramData = paramData;
    this._applicability = applicability;
  }

  get description(): string {
    return this._displayData.description;
  }

  get label(): string {
    return this._displayData.label;
  }

  get tag(): string {
    return this._displayData.tag;
  }

  get displayData(): DisplayData {
    return this._displayData;
  }

  get paramData(): StringMap {
    return this._paramData;
  }

  get applicability(): [boolean, boolean] {
    return this._applicability
  }
}

export class DisplayData {
  private _description: string;
  private _label: string;
  private _tag: string;

  constructor(description: string, label: string, tag: string) {
    this._description = description;
    this._label = label;
    this._tag = tag;
  }

  get description(): string {
    return this._description;
  }

  get label(): string {
    return this._label;
  }

  get tag(): string {
    return this._tag;
  }
}
