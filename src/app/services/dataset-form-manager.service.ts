import { Injectable } from '@angular/core';
import moment, { Moment, unitOfTime } from 'moment';
import { StringMap } from '../models/types';
import { DateManagerService } from './dateManager/date-manager.service';


@Injectable({
  providedIn: 'root'
})
export class DatasetFormManagerService {
  // private _datasetFormData: DatasetFormData;
  // private _datasets: {[tag: string]: Dataset};
  // private _activeDataset: Dataset;
  // private _activeItem: DatasetItem;
  // private _state: StringMap;
  private _visFormManager: FormManager<VisDatasetItem>;
  private _exportFormManager: FormManager<ExportDatasetItem>;

  constructor(private dateHandler: DateManagerService) {
    this.setupDatasets();
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
    let periodOnlyFormData = new FormData([
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
    let rainfallMonthPartial = new VisDatasetItem(true, true, "Millimeters", "mm", "Rainfall", "Monthly Rainfall", [0, 650], [true, false], rainfallMonthFocusManager, false, {
      period: "month",
      fill: "partial"
    });
    let rainfallDayPartial = new VisDatasetItem(true, false, "Millimeters", "mm", "Rainfall", "Daily Rainfall", [0, 20], [true, false], temperatureRainfallDayFocusManager, false, {
      period: "day",
      fill: "partial"
    });
    let rainfallDayUnfilled = new VisDatasetItem(true, false, "Millimeters", "mm", "Rainfall", "Daily Rainfall", [0, 20], [true, false], temperatureRainfallDayFocusManager, false, {
      period: "day",
      fill: "unfilled"
    });
    //////Legacy Rainfall
    let legacyRainfallMonth = new VisDatasetItem(false, true, "Millimeters", "mm", "Rainfall", "Monthly Rainfall", [0, 650], [true, false], legacyRainfallFocusManager, false, {
      period: "month"
    });
    //////Min Temperature
    let minTemperatureMonthUnfilled = new VisDatasetItem(true, true, "Celcius", "°C", "Minimum Temperature", "Monthly Minimum Temperature", [-10, 35], [false, false], temperatureMonthFocusManager, true, {
      period: "month",
      fill: "unfilled"
    });
    let minTemperatureDayUnfilled = new VisDatasetItem(true, true, "Celcius", "°C", "Minimum Temperature", "Daily Minimum Temperature", [-10, 35], [false, false], temperatureRainfallDayFocusManager, true, {
      period: "day",
      fill: "unfilled"
    });
    //////Max Temperature
    let maxTemperatureMonthUnfilled = new VisDatasetItem(true, true, "Celcius", "°C", "Maximum Temperature", "Monthly Maximum Temperature", [-10, 35], [false, false], temperatureMonthFocusManager, true, {
      period: "month",
      fill: "unfilled"
    });
    let maxTemperatureDayUnfilled = new VisDatasetItem(true, true, "Celcius", "°C", "Maximum Temperature", "Daily Maximum Temperature", [-10, 35], [false, false], temperatureRainfallDayFocusManager, true, {
      period: "day",
      fill: "unfilled"
    });
    //////Mean Temperature
    let meanTemperatureMonthUnfilled = new VisDatasetItem(false, true, "Celcius", "°C", "Mean Temperature", "Monthly Mean Temperature", [-10, 35], [false, false], temperatureMonthFocusManager, true, {
      period: "month"
    });
    let meanTemperatureDayUnfilled = new VisDatasetItem(false, true, "Celcius", "°C", "Mean Temperature", "Daily Mean Temperature", [-10, 35], [false, false], temperatureRainfallDayFocusManager, true, {
      period: "day"
    });
    //////DS Rainfall
    let dsRainfallStatisticalRcp45Annual = new VisDatasetItem(false, true, "Millimeters", "mm", "Rainfall", "Statistically Downscaled Annual Rainfall (RCP 4.5)", [0, 10000], [true, false], dsStatisticalFocusManager, false, {
      dsm: "statistical",
      model: "rcp45",
      season: "annual"
    });
    let dsRainfallStatisticalRcp45Wet = new VisDatasetItem(false, true, "Millimeters", "mm", "Rainfall", "Statistically Downscaled Wet Season Rainfall (RCP 4.5)", [0, 5000], [true, false], dsStatisticalFocusManager, false, {
      dsm: "statistical",
      model: "rcp45",
      season: "wet"
    });
    let dsRainfallStatisticalRcp45Dry = new VisDatasetItem(false, true, "Millimeters", "mm", "Rainfall", "Statistically Downscaled Dry Season Rainfall (RCP 4.5)", [0, 5000], [true, false], dsStatisticalFocusManager, false, {
      dsm: "statistical",
      model: "rcp45",
      season: "dry"
    });
    let dsRainfallStatisticalRcp85Annual = new VisDatasetItem(false, true, "Millimeters", "mm", "Rainfall", "Statistically Downscaled Annual Rainfall (RCP 8.5)", [0, 10000], [true, false], dsStatisticalFocusManager, false, {
      dsm: "statistical",
      model: "rcp85",
      season: "annual"
    });
    let dsRainfallStatisticalRcp85Wet = new VisDatasetItem(false, true, "Millimeters", "mm", "Rainfall", "Statistically Downscaled Wet Season Rainfall (RCP 8.5)", [0, 5000], [true, false], dsStatisticalFocusManager, false, {
      dsm: "statistical",
      model: "rcp85",
      season: "wet"
    });
    let dsRainfallStatisticalRcp85Dry = new VisDatasetItem(false, true, "Millimeters", "mm", "Rainfall", "Statistically Downscaled Dry Season Rainfall (RCP 8.5)", [0, 5000], [true, false], dsStatisticalFocusManager, false, {
      dsm: "statistical",
      model: "rcp85",
      season: "dry"
    });
    let dsRainfallDynamicalRcp45Annual = new VisDatasetItem(false, true, "Millimeters", "mm", "Rainfall", "Dynamically Downscaled Annual Rainfall (RCP 4.5)", [0, 10000], [true, false], dsDynamicalFocusManager, false, {
      dsm: "dynamical",
      model: "rcp45",
      season: "annual"
    });
    let dsRainfallDynamicalRcp45Wet = new VisDatasetItem(false, true, "Millimeters", "mm", "Rainfall", "Dynamically Downscaled Wet Season Rainfall (RCP 4.5)", [0, 5000], [true, false], dsDynamicalFocusManager, false, {
      dsm: "dynamical",
      model: "rcp45",
      season: "wet"
    });
    let dsRainfallDynamicalRcp45Dry = new VisDatasetItem(false, true, "Millimeters", "mm", "Rainfall", "Dynamically Downscaled Dry Season Rainfall (RCP 4.5)", [0, 5000], [true, false], dsDynamicalFocusManager, false, {
      dsm: "dynamical",
      model: "rcp45",
      season: "dry"
    });
    let dsRainfallDynamicalRcp85Annual = new VisDatasetItem(false, true, "Millimeters", "mm", "Rainfall", "Dynamically Downscaled Annual Rainfall (RCP 8.5)", [0, 10000], [true, false], dsDynamicalFocusManager, false, {
      dsm: "dynamical",
      model: "rcp85",
      season: "annual"
    });
    let dsRainfallDynamicalRcp85Wet = new VisDatasetItem(false, true, "Millimeters", "mm", "Rainfall", "Dynamically Downscaled Wet Season Rainfall (RCP 8.5)", [0, 5000], [true, false], dsDynamicalFocusManager, false, {
      dsm: "dynamical",
      model: "rcp85",
      season: "wet"
    });
    let dsRainfallDynamicalRcp85Dry = new VisDatasetItem(false, true, "Millimeters", "mm", "Rainfall", "Dynamically Downscaled Dry Season Rainfall (RCP 8.5)", [0, 5000], [true, false], dsDynamicalFocusManager, false, {
      dsm: "dynamical",
      model: "rcp85",
      season: "dry"
    });
    //////DS Temperature
    let dsTemperatureStatisticalRcp45 = new VisDatasetItem(false, true, "Celcius", "°C", "Temperature", "Statistically Downscaled Temperature (RCP 4.5)", [-10, 35], [false, false], dsStatisticalFocusManager, true, {
      dsm: "statistical",
      model: "rcp45"
    });
    let dsTemperatureStatisticalRcp85 = new VisDatasetItem(false, true, "Celcius", "°C", "Temperature", "Statistically Downscaled Temperature (RCP 8.5)", [-10, 35], [false, false], dsStatisticalFocusManager, true, {
      dsm: "statistical",
      model: "rcp85"
    });
    let dsTemperatureDynamicalRcp45 = new VisDatasetItem(false, true, "Celcius", "°C","Temperature", "Dynamically Downscaled Temperature (RCP 4.5)", [-10, 35], [false, false], dsDynamicalFocusManager, true, {
      dsm: "dynamical",
      model: "rcp45"
    });
    let dsTemperatureDynamicalRcp85 = new VisDatasetItem(false, true, "Celcius", "°C","Temperature", "Dynamically Downscaled Temperature (RCP 8.5)", [-10, 35], [false, false], dsDynamicalFocusManager, true, {
      dsm: "dynamical",
      model: "rcp85"
    });

    ////Datasets
    let rainfallDatasetDisplayData = new DisplayData("Rainfall data (1990 - present).", "Rainfall", "rainfall");
    let legacyRainfallDatasetDisplayData = new DisplayData("Legacy rainfall data based on older production methods (1920 - 2012).", "Legacy Rainfall", "legacy_rainfall");
    let maxTemperatureDatasetDisplayData = new DisplayData("Temperature data aggregated to its maximum value over the time period.", "Maximum Temperature", "max_temp");
    let minTemperatureDatasetDisplayData = new DisplayData("Temperature data aggregated to its minimum value over the time period.", "Minimum Temperature", "min_temp");
    let meanTemperatureDatasetDisplayData = new DisplayData("Temperature data aggregated to its average value over the time period.", "Mean Temperature", "mean_temp");
    let dsRainfallDatasetDisplayData = new DisplayData("Downscaled future projections for rainfall data.", "Rainfall Projections", "ds_rainfall");
    let dsTemperatureDatasetDisplayData = new DisplayData("Downscaled future projections for temperature data.", "Temperature Projections", "ds_temp");

    let rainfallVisDataset = new Dataset<VisDatasetItem>(rainfallDatasetDisplayData, {
      datatype: "rainfall",
      production: "new"
    }, rainfallMinMaxTempFormData, [
      rainfallMonthPartial,
      rainfallDayPartial,
      rainfallDayUnfilled
    ]);
    let legacyRainfallVisDataset = new Dataset<VisDatasetItem>(legacyRainfallDatasetDisplayData, {
      datatype: "rainfall",
      production: "legacy"
    }, periodOnlyFormData, [
      legacyRainfallMonth
    ]);
    let maxTemperatureVisDataset = new Dataset<VisDatasetItem>(maxTemperatureDatasetDisplayData, {
      datatype: "temperature",
      aggregation: "max"
    }, rainfallMinMaxTempFormData, [
      maxTemperatureMonthUnfilled,
      maxTemperatureDayUnfilled
    ]);
    let minTemperatureVisDataset = new Dataset<VisDatasetItem>(minTemperatureDatasetDisplayData, {
      datatype: "temperature",
      aggregation: "min"
    }, rainfallMinMaxTempFormData, [
      minTemperatureMonthUnfilled,
      minTemperatureDayUnfilled
    ]);
    let meanTemperatureVisDataset = new Dataset<VisDatasetItem>(meanTemperatureDatasetDisplayData, {
      datatype: "temperature",
      aggregation: "mean"
    }, periodOnlyFormData, [
      meanTemperatureDayUnfilled,
      meanTemperatureMonthUnfilled
    ]);
    let dsRainfallVisDataset = new Dataset<VisDatasetItem>(dsRainfallDatasetDisplayData, {
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
    let dsTemperatureVisDataset = new Dataset<VisDatasetItem>(dsTemperatureDatasetDisplayData, {
      datatype: "downscaling_temperature"
    }, dsTemperatureFormData, [
      dsTemperatureStatisticalRcp45,
      dsTemperatureStatisticalRcp85,
      dsTemperatureDynamicalRcp45,
      dsTemperatureDynamicalRcp85
    ]);



    //////////////////////////////////////////////////////////////////////
    /////////////////////////////// export ///////////////////////////////
    //////////////////////////////////////////////////////////////////////

    //filetypes
    let geotiffFtype = new FileType("GeoTIFF", "tif", "Geotiff files are a variant of the TIFF file format which is used to store raster based data/graphics including georeferencing information.");
    let txtFtype = new FileType("Text", "txt", "A plaintext file.");
    let csvFtype = new FileType("Comma-Separated Values", "csv", "A text based file with data separated by commas.");
    //file display data
    let rainfallMapDisplayData = new DisplayData("A gridded rainfall map representing estimated rainfall values over the state of Hawaiʻi.", "Rainfall Map", "data_map");
    let temperatureMapDisplayData = new DisplayData("A gridded temperature map representing the estimated temperature values over the state of Hawaiʻi.", "Temperature Map", "data_map");
    let dsRainfallMapDisplayData = new DisplayData("A gridded rainfall map representing estimated present day rainfall values based on current data.", "Rainfall Map", "data_map");
    let dsRainfallMapPredictionsDisplayData = new DisplayData("A gridded map displaying the predicted future rainfall.", "Rainfall Prediction Map", "data_map_predictions");
    let dsRainfallMapChangeDisplayData = new DisplayData("A gridded map displaying the predicted change in rainfall from present day conditions.", "Rainfall Change Map", "data_map_change"); //includes percent
    let dsTemperatureMapDisplayData = new DisplayData("A gridded temperature map representing estimated present day average temperature values based on current data.", "Temperature Map", "data_map");
    let dsTemperatureMapPredictionsDisplayData = new DisplayData("A gridded map displaying the predicted future temperature.", "Temperature Prediction Map", "data_map_predictions");
    let dsTemperatureMapChangeDisplayData = new DisplayData("A gridded map displaying the predicted change in temperature from present day conditions.", "Temperature Change Map", "data_map_change");
    let standardErrorMapDisplayData = new DisplayData("The standard error values for the gridded map data.", "Standard Error Map", "se");
    let anomalyDisplayData = new DisplayData("The anomaly values for the gridded map.", "Anomaly Map", "anom");
    let anomalyStandardErrorDisplayData = new DisplayData("The standard error values for the gridded map's anomaly values.", "Anomaly Standard Error", "anom_se");
    let metadataDisplayData = new DisplayData("Gridded map product metadata and error metrics.", "Metadata and Error Metrics", "metadata");
    let stationPartialDisplayData = new DisplayData("Processed station data including each station's metadata and values over a period of time", "Station Data", "station_data");
    //additional property nodes
    ////values
    //////spatial extents
    let statewideSpatialExtent = new FormValue(new DisplayData("Data covering the entire state of Hawaiʻi.", "Statewide", "statewide"), {
      extent: "statewide"
    }, null);
    let hawaiiSpatialExtent = new FormValue(new DisplayData("Data covering Hawaiʻi county.", "Hawaiʻi", "bi"), {
      extent: "bi"
    }, null);
    let mauiSpatialExtent = new FormValue(new DisplayData("Data covering Maui county.", "Maui", "mn"), {
      extent: "mn"
    }, null);
    let honoluluSpatialExtent = new FormValue(new DisplayData("Data covering Honolulu county.", "Honolulu", "oa"), {
      extent: "oa"
    }, null);
    let kauaiSpatialExtent = new FormValue(new DisplayData("Data covering Kauaʻi county.", "Kauaʻi", "ka"), {
      extent: "ka"
    }, null);
    //////units
    let mmUnits = new FormValue(new DisplayData("Values in millimeters", "mm", "mm"), {
      units: "mm"
    }, null);
    let inUnits = new FormValue(new DisplayData("Values in inches", "in", "in"), {
      units: "in"
    }, null);
    let cUnits = new FormValue(new DisplayData("Values in degrees celcius", "°C", "c"), {
      units: "c"
    }, null);
    let fUnits = new FormValue(new DisplayData("Values in degrees fahrenheit", "°F", "f"), {
      units: "f"
    }, null);
    let kUnits = new FormValue(new DisplayData("Values in kelvin", "K", "k"), {
      units: "k"
    }, null);
    let percentUnits = new FormValue(new DisplayData("Percent change", "Percent", "percent"), {
      units: "percent"
    }, null);
    ////nodes
    let extentDisplayData = new DisplayData("The area of coverage for the data.", "Spatial Extent", "extent");
    let unitsDisplayData = new DisplayData("The units the data are represented in.", "Units", "units");
    let extentNode = new FormNode(extentDisplayData, [statewideSpatialExtent, hawaiiSpatialExtent, mauiSpatialExtent, honoluluSpatialExtent, kauaiSpatialExtent]);
    let rfUnitsNode = new FormNode(unitsDisplayData, [mmUnits, inUnits, percentUnits]);
    let tempUnitsNode = new FormNode(unitsDisplayData, [cUnits, fUnits, kUnits]);
    //fileProperties
    let allExtentProperty = new FileProperty(extentNode, ["statewide"]);
    let statewideProperty = new FileProperty(extentNode.filter(["statewide"]), ["statewide"]);
    let rfAllUnitsProperty = new FileProperty(rfUnitsNode.filter(["mm", "in"]), ["mm"]);
    let rfMmUnitsProperty = new FileProperty(rfUnitsNode.filter(["mm"]), ["mm"]);
    let rfChangeUnitsProperty = new FileProperty(rfUnitsNode, ["mm"]);
    let tempAllUnitsProperty = new FileProperty(tempUnitsNode, ["c"]);
    let tempCUnitsProperty = new FileProperty(tempUnitsNode.filter(["c"]), ["c"]);
    let fillProperty = new FileProperty(fillNode, ["partial"]);
    let fillPartialProperty = new FileProperty(fillNode.filter(["partial"]), ["partial"]);
    let fillUnfilledProperty = new FileProperty(fillNode.filter(["unfilled"]), ["unfilled"]);
    let dsPeriodStatisticalAllProperty = new FileProperty(dsPeriodStatisticalNode, ["present"]);
    let dsPeriodStatisticalFutureProperty = new FileProperty(dsPeriodStatisticalNode.filter(["mid", "late"]), ["mid"]);
    let dsPeriodDynamicalAllProperty = new FileProperty(dsPeriodDynamicalNode, ["present"]);
    let dsPeriodDynamicalFutureProperty = new FileProperty(dsPeriodDynamicalNode.filter(["late"]), ["late"]);

    //package files
    let rainfallMapFile = new FileData(rainfallMapDisplayData, geotiffFtype, ["metadata"], {});
    let temperatureMapFile = new FileData(temperatureMapDisplayData, geotiffFtype, ["metadata"], {});
    let dsRainfallMapFile = new FileData(dsRainfallMapDisplayData, geotiffFtype, [], {});
    let dsRainfallMapPredictionsFile = new FileData(dsRainfallMapPredictionsDisplayData, geotiffFtype, [], {});
    let dsRainfallMapChangeFile = new FileData(dsRainfallMapChangeDisplayData, geotiffFtype, [], {});
    let dsTemperatureMapFile = new FileData(dsTemperatureMapDisplayData, geotiffFtype, [], {});
    let dsTemperatureMapPredictionsFile = new FileData(dsTemperatureMapPredictionsDisplayData, geotiffFtype, [], {});
    let dsTemperatureMapChangeFile = new FileData(dsTemperatureMapChangeDisplayData, geotiffFtype, [], {});
    let standardErrorMapFile = new FileData(standardErrorMapDisplayData, geotiffFtype, ["metadata"], {});
    let anomalyFile = new FileData(anomalyDisplayData, geotiffFtype, ["metadata"], {});
    let anomalyStandardErrorFile = new FileData(anomalyStandardErrorDisplayData, geotiffFtype, ["metadata"], {});
    let metadataFile = new FileData(metadataDisplayData, txtFtype, [], {});
    let stationFile = new FileData(stationPartialDisplayData, csvFtype, [], {fill: "partial"});

    //use if you want to add labeling to file groups in the future, unused for now
    // let griddedMapDisplayData = new DisplayData("Gridded mapped data files and metadata", "Map Data", "map_data");
    // let stationDisplayData = new DisplayData("Files containing station data", "Station Data", "station_data");
    let rainfallMonthMapFileGroup = new FileGroup(null, [rainfallMapFile, standardErrorMapFile, anomalyFile, anomalyStandardErrorFile, metadataFile], [allExtentProperty, rfMmUnitsProperty]);
    let rainfallMonthStationFileGroup = new FileGroup(null, [stationFile], [statewideProperty, rfMmUnitsProperty, fillPartialProperty]);
    let rainfallDayStationFileGroup = new FileGroup(null, [stationFile], [statewideProperty, rfMmUnitsProperty, fillProperty]);

    let legacyRainfallFileGroup = new FileGroup(null, [rainfallMapFile], [statewideProperty, rfMmUnitsProperty])

    let temperatureMapFileGroup = new FileGroup(null, [temperatureMapFile, standardErrorMapFile, metadataFile], [allExtentProperty, tempCUnitsProperty]);
    let temperatureStationFileGroup = new FileGroup(null, [stationFile], [fillUnfilledProperty, statewideProperty, tempCUnitsProperty]);

    let dsRainfallStatisticalMapFileGroup = new FileGroup(null, [dsRainfallMapFile], [statewideProperty, rfAllUnitsProperty, dsPeriodStatisticalAllProperty]);
    let dsRainfallStatisticalPredictionsFileGroup = new FileGroup(null, [dsRainfallMapPredictionsFile], [statewideProperty, rfAllUnitsProperty, dsPeriodStatisticalFutureProperty]);
    let dsRainfallStatisticalChangeFileGroup = new FileGroup(null, [dsRainfallMapChangeFile], [statewideProperty, rfChangeUnitsProperty, dsPeriodStatisticalFutureProperty]);

    let dsRainfallDynamicalMapFileGroup = new FileGroup(null, [dsRainfallMapFile], [statewideProperty, rfAllUnitsProperty, dsPeriodDynamicalAllProperty]);
    let dsRainfallDynamicalPredictionsFileGroup = new FileGroup(null, [dsRainfallMapPredictionsFile], [statewideProperty, rfAllUnitsProperty, dsPeriodDynamicalFutureProperty]);
    let dsRainfallDynamicalChangeFileGroup = new FileGroup(null, [dsRainfallMapChangeFile], [statewideProperty, rfChangeUnitsProperty, dsPeriodDynamicalFutureProperty]);

    let dsTemperatureStatisticalMapFileGroup = new FileGroup(null, [dsTemperatureMapFile], [statewideProperty, tempAllUnitsProperty, dsPeriodStatisticalAllProperty]);
    let dsTemperatureStatisticalPredictionsFileGroup = new FileGroup(null, [dsTemperatureMapPredictionsFile], [statewideProperty, tempAllUnitsProperty, dsPeriodStatisticalFutureProperty]);
    let dsTemperatureStatisticalChangeFileGroup = new FileGroup(null, [dsTemperatureMapChangeFile], [statewideProperty, tempAllUnitsProperty, dsPeriodStatisticalFutureProperty]);

    let dsTemperatureDynamicalMapFileGroup = new FileGroup(null, [dsTemperatureMapFile], [statewideProperty, tempAllUnitsProperty, dsPeriodDynamicalAllProperty]);
    let dsTemperatureDynamicalPredictionsFileGroup = new FileGroup(null, [dsTemperatureMapPredictionsFile], [statewideProperty, tempAllUnitsProperty, dsPeriodDynamicalFutureProperty]);
    let dsTemperatureDynamicalChangeFileGroup = new FileGroup(null, [dsTemperatureMapChangeFile], [statewideProperty, tempAllUnitsProperty, dsPeriodDynamicalFutureProperty]);

    //allow filetypes to be a dropdown, in case other file types in the future

    //export items
    ////rainfall
    let rainfallMonthExportItem = new ExportDatasetItem([rainfallMonthMapFileGroup, rainfallMonthStationFileGroup], {
      period: "month"
    }, [date1990, lastMonth]);
    let rainfallDayExportItem = new ExportDatasetItem([rainfallDayStationFileGroup], {
      period: "day"
    }, [date1990, lastDay]);
    ////legacy rainfall
    let legacyRainfallMonthExportItem = new ExportDatasetItem([legacyRainfallFileGroup], {
      period: "month"
    }, [date1920, date2012]);
    ////min temp
    let minTemperatureMonthExportItem = new ExportDatasetItem([temperatureMapFileGroup, temperatureStationFileGroup], {
      period: "month"
    }, [date1990, date2018]);
    let minTemperatureDayExportItem = new ExportDatasetItem([temperatureMapFileGroup, temperatureStationFileGroup], {
      period: "day"
    }, [date1990, date2018]);
    ////max temp
    let maxTemperatureMonthExportItem = new ExportDatasetItem([temperatureMapFileGroup, temperatureStationFileGroup], {
      period: "month"
    }, [date1990, date2018]);
    let maxTemperatureDayExportItem = new ExportDatasetItem([temperatureMapFileGroup, temperatureStationFileGroup], {
      period: "day"
    }, [date1990, date2018]);
    ////mean temp
    let meanTemperatureMonthExportItem = new ExportDatasetItem([temperatureMapFileGroup], {
      period: "month"
    }, [date1990, date2018]);
    let meanTemperatureDayExportItem = new ExportDatasetItem([temperatureMapFileGroup], {
      period: "day"
    }, [date1990, date2018]);
    ////ds
    //////DS Rainfall
    let dsRainfallStatisticalRcp45AnnualExportItem = new ExportDatasetItem([dsRainfallStatisticalMapFileGroup, dsRainfallStatisticalPredictionsFileGroup, dsRainfallStatisticalChangeFileGroup], {
      dsm: "statistical",
      model: "rcp45",
      season: "annual"
    });
    let dsRainfallStatisticalRcp45WetExportItem = new ExportDatasetItem([dsRainfallStatisticalMapFileGroup, dsRainfallStatisticalPredictionsFileGroup, dsRainfallStatisticalChangeFileGroup], {
      dsm: "statistical",
      model: "rcp45",
      season: "wet"
    });
    let dsRainfallStatisticalRcp45DryExportItem = new ExportDatasetItem([dsRainfallStatisticalMapFileGroup, dsRainfallStatisticalPredictionsFileGroup, dsRainfallStatisticalChangeFileGroup], {
      dsm: "statistical",
      model: "rcp45",
      season: "dry"
    });
    let dsRainfallStatisticalRcp85AnnualExportItem = new ExportDatasetItem([dsRainfallStatisticalMapFileGroup, dsRainfallStatisticalPredictionsFileGroup, dsRainfallStatisticalChangeFileGroup], {
      dsm: "statistical",
      model: "rcp85",
      season: "annual"
    });
    let dsRainfallStatisticalRcp85WetExportItem = new ExportDatasetItem([dsRainfallStatisticalMapFileGroup, dsRainfallStatisticalPredictionsFileGroup, dsRainfallStatisticalChangeFileGroup], {
      dsm: "statistical",
      model: "rcp85",
      season: "wet"
    });
    let dsRainfallStatisticalRcp85DryExportItem = new ExportDatasetItem([dsRainfallStatisticalMapFileGroup, dsRainfallStatisticalPredictionsFileGroup, dsRainfallStatisticalChangeFileGroup], {
      dsm: "statistical",
      model: "rcp85",
      season: "dry"
    });
    let dsRainfallDynamicalRcp45AnnualExportItem = new ExportDatasetItem([dsRainfallDynamicalMapFileGroup, dsRainfallDynamicalPredictionsFileGroup, dsRainfallDynamicalChangeFileGroup], {
      dsm: "dynamical",
      model: "rcp45",
      season: "annual"
    });
    let dsRainfallDynamicalRcp45WetExportItem = new ExportDatasetItem([dsRainfallDynamicalMapFileGroup, dsRainfallDynamicalPredictionsFileGroup, dsRainfallDynamicalChangeFileGroup], {
      dsm: "dynamical",
      model: "rcp45",
      season: "wet"
    });
    let dsRainfallDynamicalRcp45DryExportItem = new ExportDatasetItem([dsRainfallDynamicalMapFileGroup, dsRainfallDynamicalPredictionsFileGroup, dsRainfallDynamicalChangeFileGroup], {
      dsm: "dynamical",
      model: "rcp45",
      season: "dry"
    });
    let dsRainfallDynamicalRcp85AnnualExportItem = new ExportDatasetItem([dsRainfallDynamicalMapFileGroup, dsRainfallDynamicalPredictionsFileGroup, dsRainfallDynamicalChangeFileGroup], {
      dsm: "dynamical",
      model: "rcp85",
      season: "annual"
    });
    let dsRainfallDynamicalRcp85WetExportItem = new ExportDatasetItem([dsRainfallDynamicalMapFileGroup, dsRainfallDynamicalPredictionsFileGroup, dsRainfallDynamicalChangeFileGroup], {
      dsm: "dynamical",
      model: "rcp85",
      season: "wet"
    });
    let dsRainfallDynamicalRcp85DryExportItem = new ExportDatasetItem([dsRainfallDynamicalMapFileGroup, dsRainfallDynamicalPredictionsFileGroup, dsRainfallDynamicalChangeFileGroup], {
      dsm: "dynamical",
      model: "rcp85",
      season: "dry"
    });
    //////DS Temperature
    let dsTemperatureStatisticalRcp45ExportItem = new ExportDatasetItem([dsTemperatureStatisticalMapFileGroup, dsTemperatureStatisticalPredictionsFileGroup, dsTemperatureStatisticalChangeFileGroup], {
      dsm: "statistical",
      model: "rcp45"
    });
    let dsTemperatureStatisticalRcp85ExportItem = new ExportDatasetItem([dsTemperatureStatisticalMapFileGroup, dsTemperatureStatisticalPredictionsFileGroup, dsTemperatureStatisticalChangeFileGroup], {
      dsm: "statistical",
      model: "rcp85"
    });
    let dsTemperatureDynamicalRcp45ExportItem = new ExportDatasetItem([dsTemperatureDynamicalMapFileGroup, dsTemperatureDynamicalPredictionsFileGroup, dsTemperatureDynamicalChangeFileGroup], {
      dsm: "dynamical",
      model: "rcp45"
    });
    let dsTemperatureDynamicalRcp85ExportItem = new ExportDatasetItem([dsTemperatureDynamicalMapFileGroup, dsTemperatureDynamicalPredictionsFileGroup, dsTemperatureDynamicalChangeFileGroup], {
      dsm: "dynamical",
      model: "rcp85"
    });

    ////Datasets
    let rainfallExportDataset = new Dataset<ExportDatasetItem>(rainfallDatasetDisplayData, {
      datatype: "rainfall",
      production: "new"
    }, periodOnlyFormData, [
      rainfallMonthExportItem,
      rainfallDayExportItem
    ]);
    let legacyRainfallExportDataset = new Dataset<ExportDatasetItem>(legacyRainfallDatasetDisplayData, {
      datatype: "rainfall",
      production: "legacy"
    }, periodOnlyFormData, [
      legacyRainfallMonthExportItem
    ]);
    let maxTemperatureExportDataset = new Dataset<ExportDatasetItem>(maxTemperatureDatasetDisplayData, {
      datatype: "temperature",
      aggregation: "max"
    }, periodOnlyFormData, [
      maxTemperatureMonthExportItem,
      maxTemperatureDayExportItem
    ]);
    let minTemperatureExportDataset = new Dataset<ExportDatasetItem>(minTemperatureDatasetDisplayData, {
      datatype: "temperature",
      aggregation: "min"
    }, periodOnlyFormData, [
      minTemperatureMonthExportItem,
      minTemperatureDayExportItem
    ]);
    let meanTemperatureExportDataset = new Dataset<ExportDatasetItem>(meanTemperatureDatasetDisplayData, {
      datatype: "temperature",
      aggregation: "mean"
    }, periodOnlyFormData, [
      meanTemperatureDayExportItem,
      meanTemperatureMonthExportItem
    ]);
    let dsRainfallExportDataset = new Dataset<ExportDatasetItem>(dsRainfallDatasetDisplayData, {
      datatype: "downscaling_rainfall"
    }, dsRainfallFormData, [
      dsRainfallStatisticalRcp45AnnualExportItem,
      dsRainfallStatisticalRcp45DryExportItem,
      dsRainfallStatisticalRcp45WetExportItem,
      dsRainfallStatisticalRcp85AnnualExportItem,
      dsRainfallStatisticalRcp85DryExportItem,
      dsRainfallStatisticalRcp85WetExportItem,
      dsRainfallDynamicalRcp45AnnualExportItem,
      dsRainfallDynamicalRcp45DryExportItem,
      dsRainfallDynamicalRcp45WetExportItem,
      dsRainfallDynamicalRcp85AnnualExportItem,
      dsRainfallDynamicalRcp85DryExportItem,
      dsRainfallDynamicalRcp85WetExportItem
    ]);
    let dsTemperatureExportDataset = new Dataset<ExportDatasetItem>(dsTemperatureDatasetDisplayData, {
      datatype: "downscaling_temperature"
    }, dsTemperatureFormData, [
      dsTemperatureStatisticalRcp45ExportItem,
      dsTemperatureStatisticalRcp85ExportItem,
      dsTemperatureDynamicalRcp45ExportItem,
      dsTemperatureDynamicalRcp85ExportItem
    ]);



    ///////////////////////////////////////////////////////////////////
    ///////////// Create Dataset Groups and Form Managers /////////////
    ///////////////////////////////////////////////////////////////////

    let historicalRainfallGrouperDisplayData = new DisplayData("Datasets using empirical rainfall data.", "Historical Rainfall", "historical_rainfall");
    let historicalTemperatureGrouperDisplayData = new DisplayData("Datasets using empirical temperature data", "Historical Temperature", "historical_temperature");
    let dsGrouperDisplayData = new DisplayData("Future climate projections using downscaling prediction methods.", "Downscaled Climate Projections", "downscaled");
    let datasetFormDisplayData = new DisplayData("Select the type of data you would like to view. Hover over an option for a description of the dataset.", "Dataset", "dataset");
    //vis dataset groups
    let visDatasets = [rainfallVisDataset, legacyRainfallVisDataset, maxTemperatureVisDataset, minTemperatureVisDataset, meanTemperatureVisDataset, dsRainfallVisDataset, dsTemperatureVisDataset];
    let visDatasetSingles: Dataset<VisDatasetItem>[] = [];
    let visDatasetGroupers: DatasetSelectorGroup[] = [
      new DatasetSelectorGroup(historicalRainfallGrouperDisplayData, [rainfallVisDataset, legacyRainfallVisDataset]),
      new DatasetSelectorGroup(historicalTemperatureGrouperDisplayData, [maxTemperatureVisDataset, minTemperatureVisDataset, meanTemperatureVisDataset]),
      new DatasetSelectorGroup(dsGrouperDisplayData, [dsRainfallVisDataset, dsTemperatureVisDataset])
    ];
    let visDatasetFormData = new DatasetFormData(datasetFormDisplayData, visDatasetSingles, visDatasetGroupers);

    //export dataset groups
    let exportDatasets = [rainfallExportDataset, legacyRainfallExportDataset, maxTemperatureExportDataset, minTemperatureExportDataset, meanTemperatureExportDataset, dsRainfallExportDataset, dsTemperatureExportDataset];
    let exportDatasetSingles: Dataset<ExportDatasetItem>[] = [];
    let exportDatasetGroupers: DatasetSelectorGroup[] = [
      new DatasetSelectorGroup(historicalRainfallGrouperDisplayData, [rainfallExportDataset, legacyRainfallExportDataset]),
      new DatasetSelectorGroup(historicalTemperatureGrouperDisplayData, [maxTemperatureExportDataset, minTemperatureExportDataset, meanTemperatureExportDataset]),
      new DatasetSelectorGroup(dsGrouperDisplayData, [dsRainfallExportDataset, dsTemperatureExportDataset])
    ];
    let exportDatasetFormData = new DatasetFormData(datasetFormDisplayData, exportDatasetSingles, exportDatasetGroupers);

    //default values for each node
    let defaultVisState = {
      datatype: "rainfall",
      period: "month",
      fill: "partial",
      dsm: "statistical",
      model: "rcp45",
      season: "annual"
    };
    let defaultExportState = {
      datatype: "rainfall",
      period: "month",
      dsm: "statistical",
      model: "rcp45",
      season: "annual"
    };
    //create form managers
    this._visFormManager = new FormManager(visDatasets, visDatasetFormData, defaultVisState);
    this._exportFormManager = new FormManager(exportDatasets, exportDatasetFormData, defaultExportState);
  }

  get visFormManager(): FormManager<VisDatasetItem> {
    return this._visFormManager;
  }

  get exportFormManager(): FormManager<ExportDatasetItem> {
    return this._exportFormManager;
  }
}


export type ActiveFormData<T extends DatasetItem> = {
  datasetFormData: DatasetFormData,
  datasetItem: T,
  values: StringMap
}


export class DatasetFormData {
  private _displayData: DisplayData;
  private _datasetValues: FormValue[];
  private _groupers: DatasetSelectorGroup[];

  constructor(displayData: DisplayData, datasets: Dataset<DatasetItem>[], datasetGroups: DatasetSelectorGroup[]) {
    this._displayData = displayData;
    this._datasetValues = datasets.map((dataset: Dataset<DatasetItem>) => {
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

  constructor(displayData: DisplayData, datasets: Dataset<DatasetItem>[]) {
    this._values = datasets.map((dataset: Dataset<DatasetItem>) => {
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
class Dataset<T extends DatasetItem> {
  private _displayData: DisplayData;
  private _formData: FormData;
  private _fields: string[];
  private _itemMap: any;
  private _paramData: StringMap;

  constructor(displayData: DisplayData, paramData: StringMap, formData: FormData, items: T[]) {
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

  private addItem(item: T) {
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

  public getStateData(state: StringMap): StateData<T> {
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
    let datasetItem: T = tree;
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

type StateData<T extends DatasetItem> = {
  item: T,
  state: StringMap
}


abstract class DatasetItem {
  private _fieldData: {[tag: string]: DisplayData};
  private _rasterParams: StringMap;
  private _stationParams: StringMap;
  private _baseParams: StringMap;
  private _values: StringMap;
  private _formData: FormData;


  constructor(values: StringMap) {
    this._values = values;
    this._formData = null;
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

  get rasterParams(): StringMap {
    return this._rasterParams;
  }

  get stationParams(): StringMap {
    return this._stationParams;
  }

  get baseParams(): StringMap {
    return this._baseParams;
  }

  set dataset(dataset: Dataset<DatasetItem>) {
    this._baseParams = Object.assign({}, dataset.paramData);
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
    this._baseParams = Object.assign(this._baseParams, valueData.paramData);
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

export class VisDatasetItem extends DatasetItem {
  private _includeStations: boolean;
  private _includeRaster: boolean;
  private _units: string;
  private _unitsShort: string;
  private _dataRange: [number, number];
  private _rangeAbsolute: [boolean, boolean];
  //when select date options should emit param data for date
  private _focusManager: FocusManager<any>;
  private _reverseColors: boolean;
  private _datatype: string;
  private _label: string;

  constructor(includeStations: boolean, includeRaster: boolean, units: string, unitsShort: string, datatype: string, label: string, dataRange: [number, number], rangeAbsolute: [boolean, boolean], focusManager: FocusManager<any>, reverseColors: boolean, values: StringMap) {
    super(values);
    this._includeRaster = includeRaster;
    this._includeStations = includeStations;
    this._units = units;
    this._unitsShort = unitsShort;
    this._dataRange = dataRange;
    this._rangeAbsolute = rangeAbsolute;
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

  get focusManager(): FocusManager<any> {
    return this._focusManager;
  }

  get coverageLabel(): string {
    return this.focusManager.coverageLabel;
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



//display data tag should be the type for the file sent to API
class FileData {
  private _displayData: DisplayData;
  private _fileType: FileType;
  private _requires: string[];
  private _paramData: StringMap;

  constructor(displayData: DisplayData, fileType: FileType, requires: string[], paramData: StringMap) {
    this._displayData = displayData;
    this._fileType = fileType;
    this._requires = requires;
    this._paramData = paramData;
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

  get fileType(): FileType {
    return this._fileType;
  }

  get requires(): string[] {
    return this._requires;
  }

  get paramData(): StringMap {
    return this._paramData;
  }
}

class FileProperty {
  private _formData: FormNode;
  private _defaultValues: string[];

  constructor(formData: FormNode, defaultValues: string[]) {
    this._formData = formData;
    this._defaultValues = defaultValues;
  }

  get formData(): FormNode {
    return this._formData;
  }

  get defaultValues(): string[] {
    return this._defaultValues;
  }
}

class FileType {
  private _type: string;
  private _ext: string;
  private _description: string;

  constructor(type: string, ext: string, description: string) {
    this._type = type;
    this._ext = ext;
    this._description = description;
  }

  get type(): string {
    return this._type;
  }

  get ext(): string {
    return this._ext;
  }

  get description(): string {
    return this._description;
  }
}

class FileGroup {
  private _fileData: FileData[];
  private _displayData: DisplayData;
  private _additionalProperties: FileProperty[];

  constructor(displayData: DisplayData, fileData: FileData[], additionalProperties: FileProperty[]) {
    this._fileData = fileData;
    this._displayData = displayData;
    this._additionalProperties = additionalProperties;
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

   get fileData(): FileData[] {
    return this._fileData;
   }

   get additionalProperties(): FileProperty[] {
    return this._additionalProperties;
   }
}


//just make a separate structure for export, there are differences
//this doesn't need any separation so just have date range or no date range
//add period to additional properties in a file group is you want to allow multiples
export class ExportDatasetItem extends DatasetItem {
  private _fileGroups: FileGroup[];
  //can be null
  private _dateRange: [Moment, Moment];

  constructor(fileGroups: FileGroup[], values: StringMap, dateRange?: [Moment, Moment]) {
    super(values);
    this._fileGroups = fileGroups;
    this._dateRange = dateRange || null;
  }

  get fileGroups(): FileGroup[] {
    return this._fileGroups;
  }

  get dateRange(): [Moment, Moment] {
    return this._dateRange;
  }
}




export class FormManager<T extends DatasetItem> {
  private _datasetFormData: DatasetFormData;
  private _datasets: {[tag: string]: Dataset<T>};
  private _values: StringMap;
  private _activeItem: T;
  private _state: StringMap;

  constructor(datasets: Dataset<T>[], datasetFormData: DatasetFormData, defaultState: StringMap) {
    this._state = defaultState;
    this._datasets = {};
    for(let dataset of datasets) {
      this._datasets[dataset.tag] = dataset;
    }
    this._datasetFormData = datasetFormData;
    this.updateState();
  }

  private updateState() {
    let dataset = this._datasets[this._state.datatype];
    let stateData = dataset.getStateData(this._state);
    this._state = stateData.state;
    this._activeItem = stateData.item;
    this._values = Object.assign({
      datatype: dataset.tag
    }, this._activeItem.values)
  }

  public setValue(field: string, tag: string): ActiveFormData<T> {
    this._state[field] = tag;
    this.updateState();
    return this.getFormData();
  }

  public setDataset(tag: string): ActiveFormData<T> {
    return this.setValue("datatype", tag);
  }

  public getFormData(): ActiveFormData<T> {
    return {
      datasetFormData: this._datasetFormData,
      datasetItem: this._activeItem,
      values: this._values
    };
  }
}
