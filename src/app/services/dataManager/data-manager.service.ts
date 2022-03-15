import { Injectable } from '@angular/core';
import { RasterData, IndexedValues, BandData, RasterHeader } from "../../models/RasterData";
import {SiteValue, SiteInfo} from "../../models/SiteMetadata";
import {DataRequestorService, RequestResults} from "../dataLoader/data-requestor.service";
import Moment from 'moment';
import {EventParamRegistrarService} from "../inputManager/event-param-registrar.service";
import {Dataset} from "../../models/Dataset";
import { RequestReject } from '../dataLoader/auxillary/dbCon/db-con.service';
import { ErrorPopupService } from '../errorHandling/error-popup.service';
import { DateManagerService } from '../dateManager/date-manager.service';
import { LatLng } from 'leaflet';




@Injectable({
  providedIn: 'root'
})
export class DataManagerService {


  constructor(private dataRequestor: DataRequestorService, private paramService: EventParamRegistrarService, private errorPop: ErrorPopupService, private dateHandler: DateManagerService) {


    //use this for map bounds
    //need to fix query for this, unused at the moment, deal with later
    //is this even needed with file based stuff? maybe just to set map location?
    // dataRequestor.getRasterHeader({}).toPromise()
    // .then((header: RasterHeader) => {
    //   console.log(header);
    // })
    // .catch((reason: RequestReject) => {
    //   if(!reason.cancelled) {
    //     console.error(reason.reason);
    //     errorPop.notify("error", `Could not retreive map location data.`);
    //   }
    //   return null;
    // });



    let metadataReq: RequestResults = dataRequestor.getStationMetadata({
      station_group: "hawaii_climate_primary"
    });

    metadataReq.transform((data: any) => {
      let metadata = {};
      for(let item of data) {
        let stationMetadata = item.value;
        //quality of life
        stationMetadata.location = stationMetadata.elevation_m ? new LatLng(stationMetadata.lat, stationMetadata.lng, stationMetadata.elevation_m) : new LatLng(stationMetadata.lat, stationMetadata.lng)
        stationMetadata.value = null;
        let id_field = item.id_field;
        let id = stationMetadata[id_field];
        //yay for inconsistent data
        id = this.getStandardizedNumericString(id);
        metadata[id] = stationMetadata;
      }
      return metadata;
    });


    let data = {
      dataset: null,
      date: null,
      selectedStation: null,
      dateRange: null
    }
    paramService.createParameterHook(EventParamRegistrarService.EVENT_TAGS.stations, (stations: SiteInfo[]) => {
      if(stations && data.selectedStation) {
        let selected = null;
        for(let station of stations) {
          if(station.skn == data.selectedStation.skn) { 
            selected = station;
            break;
          }
        }
        //delay to allow filtered station propogation before emitting
        setTimeout(() => {
          paramService.pushSelectedStation(selected);
        }, 0);
      }
    });
    paramService.createParameterHook(EventParamRegistrarService.EVENT_TAGS.dataset, (dataset: Dataset) => {
      if(dataset) {
        data.dataset = dataset
        //reset selected station and timeseries data
        paramService.pushSelectedStation(null);
      }
    });

    let dataset2Prop = {
      rainfall: {
        datatype: "rainfall",
        production: "new"
      },
      legacy_rainfall: {
        datatype: "rainfall",
        production: "legacy"
      },
      tmin: {
        datatype: "temperature",
        aggregation: "min"
      },
      tmax: {
        datatype: "temperature",
        aggregation: "max"
      },
      tmean: {
        datatype: "temperature",
        aggregation: "mean"
      }
    }

    //TIMESERIES DATA SHOULD JUST BE PULLED REGARDLESS OF DATE (AT LEAST FOR NOW), THE TIMESERIES COMPONENT SHOULD GET DATE FOR ADJUSTING FOCUS AREAS
    //DON'T HAVE TO DO ANYTHING HERE FOR TIMESERIES WHEN DATE CHANGES

    //note this should push initial date, it doesnt...
    //add delay/caching stuff, simple for now
    let stationRes: RequestResults = null;
    let rasterRes: RequestResults = null;
    paramService.createParameterHook(EventParamRegistrarService.EVENT_TAGS.date, (date: Moment.Moment) => {
      if(date) {
        date = date.clone();
        if(stationRes) {
          stationRes.cancel();
        }
        if(rasterRes) {
          rasterRes.cancel();
        }
        data.date = date;

        let datasetInfo = data.dataset;

        const { stationData, rasterData, dataset, period, fill } = datasetInfo;


        let date_s: string = this.dateHandler.dateToString(date, period);

        paramService.pushLoading({
          tag: "vis",
          loading: true
        });

        let datasetProps = dataset2Prop[dataset];

        let stationPromise = null;
        let rasterPromise = null;
        //if station data is available request station data, otherwise just send null
        if(stationData) {
          let properties = {
            date: date_s,
            period,
            fill,
            ...datasetProps
          }
          stationRes = dataRequestor.getStationData(properties);
          //transform by combining with station data
          stationRes.transform((stationVals: any[]) => {
            //get metadata
            return metadataReq.toPromise()
            .then((metadata: any) => {
              let stations: any[] = stationVals.reduce((acc: any[], stationVal: any) => {
                let stationId = stationVal.station_id;
                //yay for inconsistent data
                let standardizedStationId = this.getStandardizedNumericString(stationId);
                let stationValue = stationVal.value;
                let stationMetadata = metadata[standardizedStationId];
                if(stationMetadata) {
                  //TEMP
                  //set station id (SKN) to id non-standardized id from incoming document so timeseries ret works properly (skn needs to match dataset documents)
                  //uggh
                  stationMetadata.skn = stationId;
                  stationMetadata.value = stationValue;
                  //copy the station data to a new object to prevent comparison issues (won't trigger change detection because it's the same object)
                  stationMetadata = Object.assign({}, stationMetadata);
                  acc.push(stationMetadata);
                }
                else {
                  console.error(`Could not find metadata for station, station ID: ${stationId}.`);
                }
                return acc;
              }, []);
              return stations;
            });
          });
          stationPromise = stationRes.toPromise();
        }
        else {
          stationPromise = Promise.resolve(null);
        }
        //if raster data is available request raster data, otherwise just send null
        if(rasterData) {
          let properties = {
            date: date_s,
            period,
            extent: "statewide",
            ...datasetProps,
            returnEmptyNotFound: true
          }
          rasterRes = dataRequestor.getRaster(properties);
          rasterPromise = rasterRes.toPromise();
        }
        else {
          rasterPromise = Promise.resolve(null);
        }
        let promises: [Promise<any>, Promise<any>] = [stationPromise, rasterPromise];

        //don't have to wait to set data for each
        promises[0].then((stationData: any[]) => {
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
    paramService.createParameterHook(EventParamRegistrarService.EVENT_TAGS.selectedStation, (station: any) => {
      //don't trigger again if already handling this station
      if(!station || !data.selectedStation || data.selectedStation.skn !== station.skn) {
        //cancel outbound queries and reset query list
        for(let query of timeseriesQueries) {
          query.cancel();
        }
        timeseriesQueries = [];
        data.selectedStation = station;
        if(station) {
          paramService.pushLoading({
            tag: "timeseries",
            loading: true
          });
          const { dataset, fill } = data.dataset;
          let datasetProps = dataset2Prop[dataset];
          let timeseriesPromises = [];
          let startDate = data.dataset.dateRange[0];
          let endDate = data.dataset.dateRange[1];
          let periods: any[] = ["month", "day"];
          for(let period of periods) {

            let properties = {
              station_id: station.skn,
              period,
              fill,
              ...datasetProps
            }

            //chunk queries by year
            let date = startDate.clone();
            while(date.isSameOrBefore(endDate)) {
              let start_s: string = this.dateHandler.dateToString(date, period);
              date.add(1, "year");
              let end_s: string = this.dateHandler.dateToString(date, period);
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

