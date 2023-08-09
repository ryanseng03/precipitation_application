import { Injectable } from '@angular/core';
import { RasterData } from "../../models/RasterData";
import { RequestFactoryService } from "../requests/request-factory.service";
import { RequestResults, RequestReject } from "../requests/request.service";
import {EventParamRegistrarService} from "../inputManager/event-param-registrar.service";
import { ErrorPopupService } from '../errorHandling/error-popup.service';
import { DateManagerService } from '../dateManager/date-manager.service';
import { FocusData, TimeseriesData, UnitOfTime, VisDatasetItem } from '../dataset-form-manager.service';
import { MapLocation, Station, StationMetadata, V_Station } from 'src/app/models/Stations';
import { TimeseriesGraphData } from 'src/app/components/rainfall-graph/rainfall-graph.component';


@Injectable({
  providedIn: 'root'
})
export class DataManagerService {

  constructor(private reqFactory: RequestFactoryService, private paramService: EventParamRegistrarService, private errorPop: ErrorPopupService, private dateHandler: DateManagerService) {
    this.lastLocation = null;
    this.dataset = null;
    this.queries = {
      timeseries: []
    };
    this.init();
  }

  lastLocation: MapLocation;
  dataset: VisDatasetItem;
  queries: {
    timeseries: RequestResults[]
  }

  private async execTimeseries(exec: (start: string, end: string, period: UnitOfTime, location: MapLocation, properties: Object, printTiming?: boolean, delay?: number) => Promise<RequestResults>, properties: any, location: MapLocation): Promise<void> {
    const chunkSize: {interval: number, unit: UnitOfTime} = {
      interval: 5,
      unit: "year"
    };
    let startTime = new Date().getTime();
    //cancel outbound queries and reset query list
    for(let query of this.queries.timeseries) {
      query.cancel();
    }
    this.queries.timeseries = [];
    //set loading
    //delay so executes after loading from previous query cancelled if still running
    setTimeout(() => {
      this.paramService.pushLoading({
        tag: "timeseries",
        loading: true
      });
    }, 0);
   
    const timeseriesData: TimeseriesData = <TimeseriesData>this.dataset.focusManager;
    const start = timeseriesData.start;
    const end = timeseriesData.end;
    let date = start.clone();
    console.log(timeseriesData.stationPeriods);
    while(date.isSameOrBefore(end)) {
      let start_s: string = date.toISOString();
      date.add(chunkSize.interval, chunkSize.unit);
      let end_s: string = date.toISOString();
      for(let periodData of timeseriesData.stationPeriods) {
        properties.period = periodData.tag;
        let timeseriesRes = await exec(start_s, end_s, <UnitOfTime>periodData.tag, location, properties, false);
        this.queries.timeseries.push(timeseriesRes);
      }
    }

    let queryPromises = this.queries.timeseries.map((res: RequestResults) => {
      return res.toPromise()
      .then((timeseriesData: TimeseriesGraphData) => {
        console.log(timeseriesData);
        if(timeseriesData) {
          //this.paramService.pushTimeseries(timeseriesData);
        }
      })
      .catch((reason: RequestReject) => {
        //if failed not cancelled print reason to stderr
        if(!reason.cancelled) {
          console.error(reason.reason);
          //throw to promise.all for error message
          throw new Error(reason.reason);
        }
      });
    });
    Promise.allSettled(queryPromises).then(() => {
      let time = new Date().getTime() - startTime;
      let timeSec = time / 1000;
      console.log(`Timeseries retreival for ${start.toISOString()}-${end.toISOString()} completed or canceled, time elapsed ${timeSec} seconds`);
      this.paramService.pushLoading({
        tag: "timeseries",
        loading: false
      });
    });
    Promise.all(queryPromises).then().catch(() => {
      this.errorPop.notify("error", `An error occurred while retrieving the timeseries data. Some of the timeseries data could not be retrieved.`);
    });
  }

  private selectStation(station: Station) {
    if(this.lastLocation?.type != "station" || station.id != (<Station>this.lastLocation).id) {
      const { stationParams } = this.dataset;
      let properties: any = {
        station_id: station.id,
        ...stationParams
      }
      this.execTimeseries(this.reqFactory.getStationTimeseries.bind(this.reqFactory), properties, station);
    }
  }

  private selectVStation(location: V_Station) {
    const { row, col } = location.cellData;
    if(this.lastLocation?.type != "virtual_station" || row != (<V_Station>this.lastLocation).cellData.row || col != (<V_Station>this.lastLocation).cellData.col) {
      const { rasterParams } = this.dataset;
      let properties: any = {
        extent: "statewide",
        row,
        col,
        ...rasterParams
      }
      this.execTimeseries(this.reqFactory.getVStationTimeseries.bind(this.reqFactory), properties, location);
    }
  }
  

  private async init() {
    //change to use station group listed in dataset
    let metadataReq: RequestResults = await this.reqFactory.getStationMetadata({
      station_group: "hawaii_climate_primary"
    });

    metadataReq.transformData((data: any) => {
      let metadataMap = {};
      for(let item of data) {
        //deconstruct
        let { station_group, id_field, ...stationMetadata } = item;
        let metadata = new StationMetadata(id_field, stationMetadata);
        //yay for inconsistent data
        //value docs may have decimals that do not match, standardize id formats
        let standardizedID = this.getStandardizedNumericString(metadata.id);
        metadataMap[standardizedID] = metadata;
      }
      this.paramService.pushMetadata(Object.values(metadataMap));
      return metadataMap;
    });

    let selectedStation: Station = null;

    this.paramService.createParameterHook(EventParamRegistrarService.EVENT_TAGS.stations, (stations: Station[]) => {
      if(stations && selectedStation) {
        let selected: Station = null;
        for(let station of stations) {
          if(station.id == selectedStation.id) {
            selected = station;
            break;
          }
        }
        //delay to allow filtered station propogation before emitting
        setTimeout(() => {
          this.paramService.pushSelectedLocation(selected);
        }, 0);
      }
    });
    this.paramService.createParameterHook(EventParamRegistrarService.EVENT_TAGS.dataset, (dataset: VisDatasetItem) => {
      this.dataset = dataset;
      //reset selected station and timeseries data
      this.paramService.pushSelectedLocation(null);
    });


    let stationRes: RequestResults = null;
    let rasterRes: RequestResults = null;
    this.paramService.createParameterHook(EventParamRegistrarService.EVENT_TAGS.focusData, async (focus: FocusData<unknown>) => {
      if(focus) {
        if(stationRes) {
          stationRes.cancel();
        }
        if(rasterRes) {
          rasterRes.cancel();
        }

        const { includeStations, includeRaster, rasterParams, stationParams, units, unitsShort } = this.dataset;

        this.paramService.pushLoading({
          tag: "vis",
          loading: true
        });

        let stationPromise = null;
        let rasterPromise = null;
        //if station data is available request station data, otherwise just send null
        if(includeStations) {
          let properties = {
            ...focus.paramData,
            ...stationParams
          }
          stationRes = await this.reqFactory.getStationData(properties);
          //transform by combining with station data
          stationRes.transformData((stationVals: any[]) => {
            //get metadata
            return metadataReq.toPromise()
            .then((metadataMap: {[id: string]: StationMetadata}) => {
              let stations: Station[] = stationVals.reduce((acc: Station[], stationVal: any) => {
                let stationId = stationVal.station_id;
                //yay for inconsistent data
                let standardizedStationId = this.getStandardizedNumericString(stationId);
                let stationValue = stationVal.value;
                let stationMetadata = metadataMap[standardizedStationId];
                if(stationMetadata) {
                  let station = new Station(stationValue, stationId, units, unitsShort, stationMetadata);
                  acc.push(station);
                }
                else {
                  console.error(`Could not find metadata for station, station ID: ${stationId}.`);
                }
                return acc;
              }, []);
              return stations;
            })
            .catch((reason: RequestReject) => {
              if(!reason.cancelled) {
                console.error(reason);
                this.errorPop.notify("error", `Could not retreive station metadata.`);
                return [];
              }
            });
          });
          stationPromise = stationRes.toPromise();
        }
        else {
          stationPromise = Promise.resolve(null);
        }
        //if raster data is available request raster data, otherwise just send null
        if(includeRaster) {
          let properties = {
            returnEmptyNotFound: true,
            extent: "statewide",
            ...focus.paramData,
            ...rasterParams
          }
          rasterRes = await this.reqFactory.getRaster(properties);
          rasterPromise = rasterRes.toPromise();
        }
        else {
          rasterPromise = Promise.resolve(null);
        }
        let promises: [Promise<Station[]>, Promise<RasterData>] = [stationPromise, rasterPromise];

        //don't have to wait to set data for each
        promises[0].then((stationData: Station[]) => {
          this.paramService.pushStations(stationData);
        })
        .catch((reason: RequestReject) => {
          if(!reason.cancelled) {
            console.error(reason.reason);
            this.errorPop.notify("error", `Could not retreive station data.`);
            this.paramService.pushStations(null);
          }
        });

        promises[1].then((raster: RasterData) => {
          this.paramService.pushRaster(raster);
        })
        .catch((reason: RequestReject) => {
          if(!reason.cancelled) {
            console.error(reason.reason);
            this.errorPop.notify("error", `Could not retreive raster data.`);
            this.paramService.pushRaster(null);
          }
        });
        //when both done send loading complete signal
        Promise.allSettled(promises).finally(() => {
          this.paramService.pushLoading({
            tag: "vis",
            loading: false
          });
        });
      }
    });


    //track selected station and emit series data based on
    this.paramService.createParameterHook(EventParamRegistrarService.EVENT_TAGS.selectedLocation, (location: MapLocation) => {
      if(location && this.dataset.focusManager.type == "timeseries") {
        switch(location.type) {
          case "station": {
            this.selectStation(<Station>location);
            break;
          }
          case "virtual_station": {
            this.selectVStation(<V_Station>location);
            break;
          }
        }
      }
      this.lastLocation = location;

    });

  }

  //of course the data has no standardization, so enforce a standard pattern for numeric strings here
  getStandardizedNumericString(id: string): string {
    //standardize numeric values by converting to a number and back to a string (will remove trailing .0 if exists)
    let standardized = Number(id).toString();
    //if non-numeric just reflect
    if(standardized == "NaN") {
      standardized = id;
    }
    return standardized;
  }

}

