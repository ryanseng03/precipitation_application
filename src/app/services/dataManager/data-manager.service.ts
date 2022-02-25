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


interface StagedTimeseriesData {
  month: RequestResults,
  year: RequestResults,
  full: RequestResults
}

@Injectable({
  providedIn: 'root'
})
export class DataManagerService {
  //this will be replaced with some result from initialization that indicates newest data date
  public static readonly DEFAULT_TYPE = "rainfall";
  public static readonly DATA_TYPES: DataType[] = ["rainfall", "anomaly", "se_rainfall", "se_anomaly"];
  public static readonly FALLBACK_DATE: string = "1970-01-01T00:00:00.000Z";

  private throttles: {
    focus: NodeJS.Timer,
    cache: NodeJS.Timer
  };


  //use manager to mitigate issues with changing data structure
  private data: DataModel;

  //provides initial data and verifies that initialization is complete
  private initPromise: Promise<void>;

  private dataset: Dataset = null;
  //track and emit currently active data set
  //SCRAP, JUST ORDER BY DATES AND ADD SITE METADATA, EACH DATE HAS UNIQUE RASTER, MAKES EVERYTHING EASIER AND MORE ADAPTABLE
  //OVERHEAD SHOULD BE MINIMAL

  constructor(private dataRequestor: DataRequestorService, private paramService: EventParamRegistrarService, private errorPop: ErrorPopupService, private dateHandler: DateManagerService) {
    this.throttles = {
      focus: null,
      cache: null
    };

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
    metadataReq.toPromise()
    .then((data: any) => {
      console.log(data);
    });


    let data = {
      dataset: null,
      date: null,
      selectedStation: null,
      dateRange: null
    }
    paramService.createParameterHook(EventParamRegistrarService.EVENT_TAGS.stations, (stations: SiteInfo[]) => {
      if(stations && data.selectedStation) {
        let exists = false;
        for(let station of stations) {
          if(station.skn == data.selectedStation.skn) {
            exists = true;
            break;
          }
        }
        if(!exists) {
          paramService.pushSelectedStation(null);
        }
      }
    });
    paramService.createParameterHook(EventParamRegistrarService.EVENT_TAGS.dataset, (dataset: Dataset) => {
      if(dataset) {
        data.dataset = dataset
        //get dataset range
        let dateRangeRes = dataRequestor.getDateRange(dataset);
        let dateRangePromise = dateRangeRes.toPromise();
        dateRangePromise.then((dateRange: any) => {
          console.log(dateRange);
          //TEMP
          dateRange = {
            start: Moment("1990-12"),
            end: Moment("2019-12")
          }
          data.dateRange = dateRange;
          paramService.pushDateRange(dateRange);
        })
        .catch((reason: RequestReject) => {
          if(!reason.cancelled) {
            console.error(reason.reason);
            errorPop.notify("error", `Could not retreive date information.`);
          }
        });
        //emit date range data to trigger other stuff
        //should create emmitter for date range

        //reset selected station and timeseries data
        paramService.pushSelectedStation(null);
      }
    });

    //TIMESERIES DATA SHOULD JUST BE PULLED REGARDLESS OF DATE (AT LEAST FOR NOW), THE TIMESERIES COMPONENT SHOULD GET DATE FOR ADJUSTING FOCUS AREAS
    //DON'T HAVE TO DO ANYTHING HERE FOR TIMESERIES WHEN DATE CHANGES

    //note this should push initial date, it doesnt...
    //add delay/caching stuff, simple for now
    paramService.createParameterHook(EventParamRegistrarService.EVENT_TAGS.date, (date: Moment.Moment) => {
      if(date) {
        data.date = date;

        let dataset = data.dataset;
        let date_s: string = this.dateHandler.dateToString(date, data.dataset.period);
        dataset.date = date_s;

        paramService.pushLoading({
          tag: "vis",
          loading: true
        });

        let promises: [Promise<any>, Promise<any>] = [null, null];

        let stationRes = dataRequestor.getStationData(data.dataset);
        let stationPromise = stationRes.toPromise();
        promises[0] = stationPromise;

        let mapRes = dataRequestor.getRaster(data.dataset);
        let mapPromise = mapRes.toPromise();
        promises[1] = mapPromise;

        //don't have to wait to set data for each
        promises[0].then((stationData: any[]) => {
          //get metadata
          metadataReq.toPromise()
          .then((metadata: any) => {
            stationData = stationData.map((stationVals: any) => {
              let stationId = stationVals.station_id;
              //yay for inconsistent data
              stationId = this.getStandardizedNumericString(stationId);
              let stationValue = stationVals.value;
              let stationMetadata = metadata[stationId];
              if(stationMetadata) {
                stationMetadata.value = stationValue;
              }
              else {
                console.error(`Could not find metadata for station, station ID: ${stationId}.`);
              }

              return stationMetadata;
            });
            paramService.pushStations(stationData);
          })
          .catch((reason: RequestReject) => {
            if(!reason.cancelled) {
              console.error(reason.reason);
              errorPop.notify("error", `Could not retreive station metadata.`);
            }
          });
        })
        .catch((reason: RequestReject) => {
          if(!reason.cancelled) {
            console.error(reason.reason);
            errorPop.notify("error", `Could not retreive station data.`);
          }
        });
        promises[1].then((raster: RasterData) => {
          paramService.pushRaster(raster);
        })
        .catch((reason: RequestReject) => {
          if(!reason.cancelled) {
            console.error(reason.reason);
            errorPop.notify("error", `Could not retreive raster data.`);
            //should push out error raster (raster with empty data)
          }
        });
        //when both done send loading complete signal
        Promise.all(promises).finally(() => {
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
        let timeseriesPromises = [];
        let startDate = data.dateRange.start;
        let endDate = data.dateRange.end;
        let periods = ["month", "day"];
        for(let period of periods) {
          let params = Object.assign({}, data.dataset);
          delete params.date;
          params.station_id = station.skn;
          params.period = period;

          //chunk queries by year
          let date = startDate.clone();
          while(date.isSameOrBefore(endDate)) {
            let start_s: string = this.dateHandler.dateToString(date, params.period);
            date.add(1, "year");
            let end_s: string = this.dateHandler.dateToString(date, params.period);
            //note query is [)
            let timeseriesRes = dataRequestor.getStationTimeSeries(start_s, end_s, params);

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


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////



//   //TEMP PATCH
//   //all months for now
//   initDate = Moment("2019-12-01T00:00:00.000Z");
//   //only store 7 (focus +-3)
//   //map by date string to ensure access proper
//   cache = new Map<string, RequestResults>();
//   //timeseriesCache = new Map<StationData, >();

//   header: Promise<RasterHeader>;

//   //available movement 1 ahead of base granularity
//   granularities = ["day", "month", "year"];
//   granularityTranslation = {
//     day: "days",
//     month: "months",
//     year: "years"
//   };



//   //----------------------------------------------------------------------------

//   //how many station values timeseries cache?
//   timeseriesCacheSize = 25;
//   datasetCacheSize = 25;
//   timeseriesCache = new AccessWeightedCache<string, RequestResults>(this.timeseriesCacheSize);
//   datasetCache = new AccessWeightedCache<string, RequestResults>(this.timeseriesCacheSize);

//   //MAP OBJECTS MAINTAIN INSERTION ORDER, CAN USE FOR IMPLICIT TIME ORDERING!
//   requests = {
//     georef: null,
//     stationMetadata: null,
//     dates: [null, null],
//     focus: null,
//     cache: {},
//     timeseries: {

//     }
//   }



//   //----------------------------------------------------------------------------


//   private getRangeBreakdown(movementInfo: MovementVector): [number, string][] {
//     let cacheRange = [1, 3, 5];
//     //copy here so don't modify the original object if it was null
//     let magnitude = movementInfo;
//     //if null magnitude (moved to a set date using map navigation), just use +/-3 baseGranularity/other granularity
//     if(magnitude == null) {
//       //balance cache range in each direction if no directionality
//       cacheRange = [3, 3, 3];
//       //just set magnitude to a default value, all directions will be the same anyway
//       magnitude = {
//         direction: 1,
//         period: this.dataset.timestep
//       }
//     }
//     let baseI = this.granularities.indexOf(this.dataset.timestep);
//     if(baseI < 0 || baseI >= this.granularities.length - 1) {
//       throw new Error("Invalid base granularity.");
//     }
//     let info = {
//       magnitude: {
//         same: magnitude.direction,
//         opposite: -magnitude.direction
//       },
//       granularity: {
//         same: this.granularityTranslation[magnitude.period],
//         opposite: this.dataset.timestep == magnitude.period ? this.granularityTranslation[this.granularities[baseI + 1]] : this.granularityTranslation[this.dataset.timestep]
//       }
//     }
//     let toAdd: [number, string][] = [
//       [info.magnitude.same * cacheRange[2], info.granularity.same],
//       [info.magnitude.opposite * cacheRange[1], info.granularity.same],
//       [info.magnitude.same * cacheRange[1], info.granularity.opposite],
//       [info.magnitude.opposite * cacheRange[0], info.granularity.opposite]
//     ]

//     //list of add objects (magnitude, granularity)
//     return toAdd;
//   }


//   private getAdditionalCacheDates(focus: Moment.Moment, movementInfo: MovementVector): Moment.Moment[] {
//     let breakdown = this.getRangeBreakdown(movementInfo);
//     let dateCopy: Moment.Moment = null;
//     let range = [];
//     for(let item of breakdown) {
//       let v = Math.sign(item[0]);
//       let lim = Math.abs(item[0]);
//       //need to get magnitude!!!!
//       for(let i = 1; i <= lim; i++) {
//         // console.log(focus.toISOString());
//         dateCopy = Moment(focus);
//         // console.log(item[1]);
//         dateCopy = dateCopy.add(v * i, <Moment.unitOfTime.DurationConstructor>item[1]);
//         // console.log(v, i, item[1], dateCopy.toISOString());
//         //verify not out of range
//         if(dateCopy.isBetween(this.dataset.startDate, this.dataset.endDate, "day", "[]")) {
//           range.push(dateCopy);
//         }
//       }
//     }
//     return range;
//   }

//   private map: MapComponent;
//   setMap(map: MapComponent) {
//     this.map = map;
//   }
//   private loading: boolean;
//   setLoadingOnMap(loading: boolean) {
//     //only set loading once
//     //if(this.loading != loading) {
//     this.map.setLoad(loading);
//     //}
//   }



//   //should handler stuff as a transform
//   //nope because not necessaruly cancelling

//   //probably the easiest way is to just check if current date matches, if it doesn't then skip
//   //what about if move around and back? trigger multiple times?
//   focusDataRetreiverCanceller: (reason: string) => void = null;

//   // //THIS IS BEING CALLED 3 TIMES AT INTIALIZATION, WHY???
//   // //probably has to do with non-production running lifecycle hooks multiple times for change verification
//   getData(date: Moment.Moment, movementInfo: MovementVector, delay: number = 2000): void {

//     this.setLoadingOnMap(true);
//     //use a throttle to prevent constant data pulls on fast date walk, set to 5 second (is there a better way to do this? probably not really)
//     if(this.throttles.focus) {
//       clearTimeout(this.throttles.focus);
//       this.setLoadingOnMap(false);
//     }
//     if(this.throttles.cache) {
//       clearTimeout(this.throttles.cache);
//     }
//     if(this.focusDataRetreiverCanceller) {
//       //cancel old retreiver, if already finished should be fine (can reject an already resolved promise without issue)
//       this.focusDataRetreiverCanceller(null);
//     }

//     //two different cases where this used (cache hit/miss), set as function
//     let focusedDataHandler = (dataRetreiver: RequestResults) => {
//       let start = new Date().getTime();
//       new Promise((resolve, reject) => {
//         this.focusDataRetreiverCanceller = reject;
//         return dataRetreiver.toPromise().then((data: InternalDataPack) => {
//           resolve(data)
//         })
//         .catch((reason: RequestReject) => {
//           //cancelled or failed
//           reject(reason);
//         });
//       })
//       .then((data: InternalDataPack) => {
//         let time = new Date().getTime() - start;
//         let timeSec = time / 1000;
//         console.log(`Retreived focused data, time elapsed ${timeSec} seconds`);
//         //emit the data to the application
//         this.setFocusedData(date, data);
//       })
//       .catch((reason: RequestReject) => {
//         //request cancelled or failed upstream
//         if(reason && !reason.cancelled) {
//           console.error(reason);
//           //don't need to put error details to user, have those in console
//           let emsg = `There was an issue retreiving the requested climate data.`;
//           this.errorPop.notify("error", emsg);
//         }
//       })
//       //loading complete
//       .then(() => {
//         this.setLoadingOnMap(false);
//       });
//     };

//     let isoStr: string = date.toISOString();
//     let dataRetreiver: RequestResults = this.cache.get(isoStr);

//     let cacheDates = () => {
//       return;
//       this.throttles.cache = null;

//       /////////
//       //dates//
//       /////////

//       //get additional dates to pull data for cache
//       let cacheDates = this.getAdditionalCacheDates(date, movementInfo);
//       //cache data for new dates and clear old entries
//       this.cacheDates(date, cacheDates);
//     }

//     if(dataRetreiver) {
//       this.throttles.focus = setTimeout(() => {
//         this.throttles.focus = null;
//         focusedDataHandler(dataRetreiver);
//         cacheDates();
//       }, 0)
//     }
//     else {
//       this.throttles.focus = setTimeout(() => {
//         this.throttles.focus = null;
//         dataRetreiver = this.dataRequestor.getDataPack(date);
//         this.cache.set(date.toISOString(), dataRetreiver);
//         focusedDataHandler(dataRetreiver);
//         cacheDates();
//       }, delay);
//     }



//   }

//   //caches set of dates and clears old values from cache
//   //require focusDate to prevent clearing it from the cache
//   private cacheDates(focusDate: Moment.Moment, dates: Moment.Moment[]) {
//     let cachedDates = this.cache.keys();
//     //should be more efficient to delete things from a set than array
//     let cachedDatesSet = new Set(cachedDates);
//     //remove focus date
//     cachedDatesSet.delete(focusDate.toISOString());
//     for(let date of dates) {
//       let dateString = date.toISOString();
//       //already in cache, just delete from set so not cleared
//       if(cachedDatesSet.has(dateString)) {
//         //console.log("hit!!!");
//         //remove from set, anything left over will be removed from cache
//         cachedDatesSet.delete(dateString);
//       }
//       //not in cache, need to retreive data
//       else {
//         //diffuse load by adding random delay up to five seconds
//         let delay = Math.round(Math.random() * 5000);
//         let cacheData = this.dataRequestor.getDataPack(date, delay);
//         this.cache.set(dateString, cacheData);

//       }
//     }
//     //remove old entries that weren't recached (anything still in cachedDatesSet)
//     cachedDatesSet.forEach((date: string) => {
//       //cancel queries before deleting
//       this.cache.get(date).cancel();
//       this.cache.delete(date);
//     });
//   }



//   //need to set something that cancels old calls on new data request to ensure synch
//   //should also add some sort of small delay or cancel logic to data request logic to prevent slow down on rapid input changes, some sort of input throttle
//   //sets the data focused by the application
//   private setFocusedData(date: Moment.Moment, internalData: InternalDataPack): void {
//     //need to wait for raster header if not already in
//     this.header.then((header: RasterHeader) => {
//       //if header null then couldn't get header from server (already pushed error message)
//       if(header) {
//         let focus: FocusedData = {
//           date: date,
//           data: null,
//         };

//         let data: DataPack = {
//           raster: null,
//           sites: null,
//           metrics: null
//         };
//         focus.data = data;
//         this.combineMetaWithValues(internalData.stations).then((info: SiteInfo[]) => {
//           data.sites = info;
//           //console.log(internalData.sites);
//           //wrap in rasterdata object
//           let raster: RasterData = new RasterData(header);
//           if(raster.addBands(internalData.bands).code != UpdateFlags.OK) {
//             console.error(`Error setting bands, code: ${raster.addBands(internalData.bands).code}`);
//             this.errorPop.notify("error", "An unexpected error occured while handling the climate data.");
//           }
//           else {
//             data.raster = raster;
//             // this.data.focusedData = focus;
//             this.paramService.pushFocusedData(focus);
//           }
//         });
//       }
//     });
//   }


//   //combining metadata here instead of ahead of time cuts down on a lot of memory for redundant cached values in exchange for somewhat minor overhead
//   private combineMetaWithValues(values: SiteValue[]): Promise<SiteInfo[]> {
//     let resPromises: Promise<SiteInfo>[] = [];
//     for(let i = 0; i < values.length; i++) {
//       let value: SiteValue = values[i];
//       let skn: string = value.skn;
//       resPromises.push(this.dataRequestor.getMetaBySKN(skn).then((metadata: SiteMetadata) => {
//         if(metadata != undefined) {
//           return new SiteInfo(metadata, value);
//         }
//         else {
//           //could not find metadata, print error
//           console.error(`Could not find metadata for site, skn: ${skn}.`);
//           return null;
//         }
//       }));
//     }
//     return Promise.all(resPromises).then((info: SiteInfo[]) => {
//       //console.log(info);
//       //filter out any instances where metadata could not be found to maintain consistency
//       return info.filter((si) => {
//         return si != null;
//       });
//     });
//   }
}

interface CancellableQuery {
  result: Promise<InternalDataPack>,
  cancel: () => void
}

export interface MovementVector {
  direction: 1 | -1,
  period: string
}

//update as needed
interface DataModel {
  //decouple header for internal storage to save memory (only need once)
  header: RasterHeader,
  primary: DateReferencedInternalDataPack,
  //reference to a set of values in data (primary)
  focusedData: FocusedData,
}

interface DateReferencedInternalDataPack {
  [date: string]: InternalDataPack
}

interface InternalDataPack {
  bands: BandData,
  //might change to something a bit more robust
  stations: SiteValue[],
  //need to define this, refer to empty interface for now
  metrics: Metrics
}

export interface DataPack {
  raster: RasterData,
  //might change to something a bit more robust
  sites: SiteInfo[],
  //need to define this, refer to empty interface for now
  metrics: Metrics
}

//can change this to something fancier
//export type Date = string;

export interface FocusedData {
  data: DataPack,
  date: Moment.Moment
}

export interface DataBands {
  rainfall: IndexedValues,
  anomaly: IndexedValues,
  se_rainfall: IndexedValues,
  se_anomaly: IndexedValues
}


export type DataType = keyof DataBands;

//define metrics structure
export interface Metrics {

}

class AccessWeightedCache<T, U> {
  private limit: number;
  private index: Map<T, CacheNode<T, U>>;
  private priority: CachePriority<T, U>

  constructor(limit: number) {
    if(limit <= 0) {
      throw "Cache underflow";
    }
    this.limit = limit;
    this.index = new Map<T, CacheNode<T, U>>();
    this.priority = new CachePriority<T, U>();
  }

  setLimit(limit: number): void {
    if(limit <= 0) {
      throw "Cache underflow";
    }
    this.limit = limit;
    this.clean();
  }

  cache(key: T, value: U): void {
    let node = this.priority.add(key, value);
    this.index.set(key, node);
    this.clean();
  }

  get(key: T): U {
    let value: U = null;
    let node = this.index.get(key);
    if(node) {
      value = node.value;
      this.priority.accessed(node);
    }
    return value;
  }

  clear(): void {
    this.index.clear();
    this.priority.clear();
  }

  private clean(): void {
    while(this.index.size > this.limit) {
      let key = this.priority.removeLast();
      this.index.delete(key);
    }
  }
}

class CachePriority<T, U> {
  head: CacheNode<T, U>;
  tail: CacheNode<T, U>;

  constructor() {
    this.head = null;
    this.tail = null;
  }

  //add to head (last accessed)
  add(key: T, value: U): CacheNode<T, U> {
    let node = new CacheNode<T, U>();
    node.key = key;
    node.value = value;
    node.next = this.head;
    node.previous = null;
    this.head.previous = node;
    this.head = node;
    return node;
  }

  accessed(node: CacheNode<T, U>): void {
    node.previous.next = node.next;
    node.previous = null;
    node.next = this.head;
    this.head.previous = node;
    this.head = node;
  }

  //remove LRU
  removeLast(): T {
    let key = this.tail.key;
    this.tail = this.tail.previous;
    this.tail.next = null;
    return key;
  }

  clear() {
    this.head = null;
    this.tail = null;
  }
}

class CacheNode<T, U> {
  key: T;
  value: U;
  next: CacheNode<T, U>;
  previous: CacheNode<T, U>;
}

//static for now, get at start and store
//raster header, station metadata

//CLEAR ALL CACHES ON DATASET CHANGE

//get on triggers
  //focus date or dataset change
    //station data, raster
      //cache by date
  //station select change
    //station time series
      //cache by station id

//cache keep object index, array o


//FOR CACHE ORDER ISSUE, INSERTION DOES NOT COUNT AS ACCESS
//insert at end of cache, access moved to front

//CAN USE DELAY AS THROTTLE WITH CANCELLATIONS WHEN MOVE OUT OF CACHE, IF MOVED OUT OF CACHE WHILE GOING THROUGH DATES THEN JUST CANCEL THE QUERY, IF BEFORE DELAY TIMEOUT THEN WONT BE DISPATCHED ANYWAY
