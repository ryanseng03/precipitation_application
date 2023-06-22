import { Injectable } from '@angular/core';
import { RasterData } from "../../models/RasterData";
import {DataRequestorService, RequestResults} from "../dataLoader/data-requestor.service";
import Moment from 'moment';
import {EventParamRegistrarService} from "../inputManager/event-param-registrar.service";
import { RequestReject } from '../dataLoader/auxillary/dbCon/db-con.service';
import { ErrorPopupService } from '../errorHandling/error-popup.service';
import { DateManagerService } from '../dateManager/date-manager.service';
import { LatLng } from 'leaflet';
import { FocusData, TimeseriesData, VisDatasetItem } from '../dataset-form-manager.service';
import { MapLocation, Station, StationMetadata } from 'src/app/models/Stations';
import { StringMap } from '@angular/compiler/src/compiler_facade_interface';




@Injectable({
  providedIn: 'root'
})
export class DataManagerService {

  constructor(private dataRequestor: DataRequestorService, private paramService: EventParamRegistrarService, private errorPop: ErrorPopupService, private dateHandler: DateManagerService) {
    let selectedDataset: VisDatasetItem;
    let selectedLocation: MapLocation;
    //change to use station group listed in dataset
    let metadataReq: RequestResults = dataRequestor.getStationMetadata({
      station_group: "hawaii_climate_primary"
    });

    metadataReq.transform((data: any[]) => {
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
      paramService.pushMetadata(Object.values(metadataMap));
      return metadataMap;
    });

    let selectedStation: Station = null;

    paramService.createParameterHook(EventParamRegistrarService.EVENT_TAGS.stations, (stations: Station[]) => {
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
          paramService.pushSelectedLocation(selected);
        }, 0);
      }
    });
    paramService.createParameterHook(EventParamRegistrarService.EVENT_TAGS.dataset, (dataset: VisDatasetItem) => {
      selectedDataset = dataset;
      //reset selected station and timeseries data
      paramService.pushSelectedLocation(null);
    });


    let stationRes: RequestResults = null;
    let rasterRes: RequestResults = null;
    paramService.createParameterHook(EventParamRegistrarService.EVENT_TAGS.focusData, (focus: FocusData<unknown>) => {
      if(focus) {
        if(stationRes) {
          stationRes.cancel();
        }
        if(rasterRes) {
          rasterRes.cancel();
        }

        let datasetInfo: VisDatasetItem = selectedDataset;

        const { includeStations, includeRaster, rasterParams, stationParams } = datasetInfo;

        paramService.pushLoading({
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
          stationRes = dataRequestor.getStationData(properties);
          //transform by combining with station data
          stationRes.transform((stationVals: any[]) => {
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
                  let station = new Station(stationValue, stationId, selectedDataset.units, selectedDataset.unitsShort, stationMetadata);
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
                errorPop.notify("error", `Could not retreive station metadata.`);
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
          rasterRes = dataRequestor.getRaster(properties);
          rasterPromise = rasterRes.toPromise();
        }
        else {
          rasterPromise = Promise.resolve(null);
        }
        let promises: [Promise<Station[]>, Promise<RasterData>] = [stationPromise, rasterPromise];

        //don't have to wait to set data for each
        promises[0].then((stationData: Station[]) => {
          paramService.pushStations(stationData);
        })
        .catch((reason: RequestReject) => {
          if(!reason.cancelled) {
            console.error(reason.reason);
            errorPop.notify("error", `Could not retreive station data.`);
            paramService.pushStations(null);
          }
        });

        promises[1].then((raster: RasterData) => {
          paramService.pushRaster(raster);
        })
        .catch((reason: RequestReject) => {
          if(!reason.cancelled) {
            console.error(reason.reason);
            errorPop.notify("error", `Could not retreive raster data.`);
            paramService.pushRaster(null);
          }
        });
        //when both done send loading complete signal
        Promise.allSettled(promises).finally(() => {
          paramService.pushLoading({
            tag: "vis",
            loading: false
          });
        });
      }
    });


    let timeseriesQueries = [];
    //track selected station and emit series data based on
    paramService.createParameterHook(EventParamRegistrarService.EVENT_TAGS.selectedLocation, (location: MapLocation) => {

      //VIRTUAL STATIONS
      //...

      //normal station
      if(location && location.type == "station") {
        let station = <Station>location;
        //don't trigger again if already handling this station
        if(!station || !selectedStation || selectedStation.id !== station.id) {
          //cancel outbound queries and reset query list
          for(let query of timeseriesQueries) {
            query.cancel();
          }
          timeseriesQueries = [];
          selectedStation = station;
          //dispatch query if the dataset has a timeseries component and the selected station is not null
          if(station && selectedDataset.focusManager.type == "timeseries") {
            let timeseriesData: TimeseriesData = <TimeseriesData>selectedDataset.focusManager;
            paramService.pushLoading({
              tag: "timeseries",
              loading: true
            });
            let datasetInfo: VisDatasetItem = selectedDataset;
            const { stationParams } = datasetInfo;
            let timeseriesPromises = [];
            let startDate = timeseriesData.start;
            let endDate = timeseriesData.end;
            let periods = timeseriesData.stationPeriods;
            for(let periodData of periods) {
              let properties = {
                station_id: station.id,
                ...stationParams
              }
              //make sure to overwrite period from params
              properties["period"] = periodData.tag;

              //chunk queries by year
              let date = startDate.clone();
              while(date.isSameOrBefore(endDate)) {
                let start_s: string = this.dateHandler.dateToString(date, periodData.unit);
                date.add(1, "year");
                let end_s: string = this.dateHandler.dateToString(date, periodData.unit);
                //note query is [)
                let timeseriesRes = dataRequestor.getStationTimeSeries(start_s, end_s, properties);

                timeseriesRes.transform((timeseriesData: any[]) => {
                  if(timeseriesData.length > 0) {
                    let transformed = {
                      stationId: timeseriesData[0].station_id,
                      period: timeseriesData[0].period,
                      values: timeseriesData.map((item: any) => {
                        return {
                          value: item.value,
                          date: Moment(item.date)
                        }
                      })
                    }
                    return transformed;
                  }
                  else {
                    return null;
                  }
                });
                timeseriesQueries.push(timeseriesRes);

                let timeseriesPromise = timeseriesRes.toPromise();
                timeseriesPromise.then((timeseriesData: any) => {
                  if(timeseriesData) {
                    paramService.pushStationTimeseries(timeseriesData);
                  }
                })
                .catch((reason: RequestReject) => {
                  //if failed not cancelled print reason to stderr
                  if(!reason.cancelled) {
                    console.error(reason.reason);
                  }
                });

                timeseriesPromises.push(timeseriesPromise);
              }
            }
            //when all timeseries promises are complete push out loading complete signal
            Promise.allSettled(timeseriesPromises).then(() => {
              paramService.pushLoading({
                tag: "timeseries",
                loading: false
              });
            });
          }
        }
      }
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

