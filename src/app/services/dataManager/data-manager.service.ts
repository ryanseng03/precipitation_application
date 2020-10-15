import { Injectable } from '@angular/core';
import { RasterData, IndexedValues, BandData, RasterHeader, UpdateStatus, UpdateFlags } from "../../models/RasterData";
import {Subject, Observable} from "rxjs";
import {SiteMetadata, SiteValue, SiteInfo} from "../../models/SiteMetadata";
import {DataLoaderService} from "../dataLoaders/localDataLoader/data-loader.service";
import {DataRequestorService} from "../dataLoaders/dataRequestor/data-requestor.service";
import Moment from 'moment';
import { MapComponent } from 'src/app/components/map/map.component';
import {EventParamRegistrarService} from "../inputManager/event-param-registrar.service";
import {Dataset} from "../../models/dataset";
import moment from 'moment';


@Injectable({
  providedIn: 'root'
})
export class DataManagerService {
  //this will be replaced with some result from initialization that indicates newest data date
  public static readonly DEFAULT_TYPE = "rainfall";
  public static readonly DATA_TYPES: DataType[] = ["rainfall", "anomaly", "se_rainfall", "se_anomaly"];
  public static readonly FALLBACK_DATE: string = "1970-01-01T00:00:00.000Z";



  //use manager to mitigate issues with changing data structure
  private data: DataModel;

  //provides initial data and verifies that initialization is complete
  private initPromise: Promise<void>;

  private dataset: Dataset = null;
  //track and emit currently active data set
  //SCRAP, JUST ORDER BY DATES AND ADD SITE METADATA, EACH DATE HAS UNIQUE RASTER, MAKES EVERYTHING EASIER AND MORE ADAPTABLE
  //OVERHEAD SHOULD BE MINIMAL

  constructor(private dataLoader: DataLoaderService, private dataRequestor: DataRequestorService, private paramService: EventParamRegistrarService) {
    // this.data = {
    //   header: null,
    //   primary: {},
    //   focusedData: null
    // };
    this.header = dataRequestor.getRasterHeader();
    // this.initPromise = this.initialize();
    //no delay for init data
    //this.getData(this.initDate, 0);
    // setTimeout(() => {
    //   console.log("second submitted");
    //   this.getData(Moment("2018-11-01T00:00:00.000Z"));
    // }, 10000);

    let focusedSite = null;
    paramService.createParameterHook(EventParamRegistrarService.GLOBAL_HANDLE_TAGS.dataset, (dataset: Dataset) => {
      this.dataset = dataset;
      this.updateStationTimeSeries()
    });
    //track selected station and emit series data based on
    paramService.createParameterHook(EventParamRegistrarService.GLOBAL_HANDLE_TAGS.selectedSite, (site: SiteInfo) => {
      this.updateStationTimeSeries()
    });

  }

  updateStationTimeSeries() {
    console.log("!!!!");
  }

  //store single raster data object and swap out bands


  //////////////////////////
  //////////////////////////
  ///////////////////////////
  /////////////////

  //store time range info for current site


  //TEMP PATCH
  //all months for now
  initDate = Moment("2019-12-01T00:00:00.000Z");
  //only store 7 (focus +-3)
  //map by date string to ensure access proper
  cache = new Map<string, Promise<InternalDataPack>>();
  header: Promise<RasterHeader>;

  //available movement 1 ahead of base granularity
  granularities = ["daily", "monthly", "yearly"];
  granularityTranslation = {
    daily: "days",
    monthly: "months",
    yearly: "years"
  };


  private getRangeBreakdown(movementInfo: MovementVector): [number, string][] {
    let cacheRange = [1, 3, 5];
    //copy here so don't modify the original object if it was null
    let magnitude = movementInfo.magnitude
    //if null magnitude (moved to a set date using map navigation), just use +/-3 baseGranularity/other granularity
    if(magnitude == null) {
      //balance cache range in each direction if no directionality
      cacheRange = [3, 3, 3];
      //just set magnitude to a default value, all directions will be the same anyway
      magnitude = {
        direction: 1,
        granularity: movementInfo.baseGranularity
      }
    }
    let baseI = this.granularities.indexOf(movementInfo.baseGranularity);
    if(baseI < 0 || baseI >= this.granularities.length - 1) {
      throw new Error("Invalid base granularity.");
    }
    let info = {
      magnitude: {
        same: magnitude.direction,
        opposite: -magnitude.direction
      },
      granularity: {
        same: this.granularityTranslation[magnitude.granularity],
        opposite: movementInfo.baseGranularity == magnitude.granularity ? this.granularityTranslation[this.granularities[baseI + 1]] : this.granularityTranslation[movementInfo.baseGranularity]
      }
    }
    let toAdd: [number, string][] = [
      [info.magnitude.same * cacheRange[2], info.granularity.same],
      [info.magnitude.opposite * cacheRange[1], info.granularity.same],
      [info.magnitude.same * cacheRange[1], info.granularity.opposite],
      [info.magnitude.opposite * cacheRange[0], info.granularity.opposite]
    ]

    //list of add objects (magnitude, granularity)
    return toAdd;
  }


  private getAdditionalCacheDates(focus: Moment.Moment, movementInfo: MovementVector): Moment.Moment[] {
    let breakdown = this.getRangeBreakdown(movementInfo);
    let dateCopy: Moment.Moment = null;
    let range = [];
    for(let item of breakdown) {
      let v = Math.sign(item[0]);
      let lim = Math.abs(item[0]);
      //need to get magnitude!!!!
      for(let i = 1; i <= lim; i++) {
        // console.log(focus.toISOString());
        dateCopy = Moment(focus);
        // console.log(item[1]);
        dateCopy = dateCopy.add(v * i, <Moment.unitOfTime.DurationConstructor>item[1]);
        // console.log(v, i, item[1], dateCopy.toISOString());
        //verify not out of range

        range.push(dateCopy);
      }
    }
    console.log(range);
    return range;
  }

  throttle = null;
  private getDataPackRetreiver(date: Moment.Moment): Promise<InternalDataPack> {
    let dataPackRetreiver: Promise<InternalDataPack> = new Promise((resolve, reject) => {
      let dataPack: InternalDataPack = {
        bands: null,
        sites: null,
        metrics: null
      }
      let rasterLoader = this.dataRequestor.getRastersDate(date);
      let siteLoader = this.dataRequestor.getSiteValsDate(date);

      Promise.all([rasterLoader, siteLoader]).then((data: [BandData, SiteValue[]]) => {
        dataPack.bands = data[0];
        dataPack.sites = data[1];
        resolve(dataPack);
      });
    });
    return dataPackRetreiver;
  }

  //header stuff part of dataRequestor

  // private getRasterHeader(): Promise<RasterHeader> {
  //   return new Promise((resolve, reject) => {
  //     if(this.header) {
  //       resolve(this.header);
  //     }
  //     else {
  //       this.dataRequestor.
  //     }
  //   });
  // }
  private map: MapComponent;
  setMap(map: MapComponent) {
    this.map = map;
  }
  private loading: boolean;
  setLoadingOnMap(loading: boolean) {
    //only set loading once
    if(this.loading != loading) {
      this.loading = loading;
      this.map.setLoad(loading);
    }
  }


  //THIS IS BEING CALLED 3 TIMES AT INTIALIZATION, WHY???
  focusDataRetreiverCanceller: (reason: string) => void = null;
  getData(date: Moment.Moment, movementInfo: MovementVector, delay: number = 3000): void {
    console.log("called!", date.toISOString());
    //use a throttle to prevent constant data pulls on fast date walk, set to 5 second (is there a better way to do this? probably not really)
    if(this.throttle) {
      clearTimeout(this.throttle);
    }
    if(this.focusDataRetreiverCanceller) {
      //cancel old retreiver, if already finished should be fine (can reject an already resolved promise without issue)
      this.focusDataRetreiverCanceller("Another date was focused before completion.");
    }

    //two different cases where this used (cache hit/miss), set as function
    let setFocusedDataRetreiverHandler = (dataRetreiver) => {
      console.log("before");
      let focusDataRetreiver = new Promise((resolve, reject) => {
        console.log("focusdataretreiver started!!!");
        this.focusDataRetreiverCanceller = reject;
        console.log("here")
        //resolve after cached promise resolves to allow for cancellation
        dataRetreiver.then((data: InternalDataPack) => {
          console.log("got focus data", data);
          resolve(data);
        });
      });
      console.log("after");
      focusDataRetreiver.then((data: InternalDataPack) => {
        console.log("Got focus data!!!", data);
        //emit the data to the application
        this.setFocusedData(date, data);
        //only runs if completed (not canceled)
        this.setLoadingOnMap(false);

        /////////
        //dates//
        /////////

        //NOTE THAT THIS LEAVES NO DELAY IF CACHE HIT RETURNS IMMEDIATELY!!! BAD BAD BAD

        //get additional dates to pull data for for cache
        //seemed to have been causing a delay in focused date retreival even if cached, so just do additional cached dates after focused date completed
        //slower cache but more responsive focus date, which is preferable
        let cacheDates = this.getAdditionalCacheDates(date, movementInfo);
        this.cacheDates(date, cacheDates);
      }, () => {/*cancelled*/});
    };
    //if already loading won't set load again
    this.setLoadingOnMap(true);
    let isoStr: string = date.toISOString();
    let dataRetreiver: Promise<InternalDataPack> = this.cache.get(isoStr);
    //if already in cache no need to wait since not submitting new request, just set up hook on cached promise (will be cancelled if new request comes through before)
    if(dataRetreiver) {
      console.log("cache hit!!");
      setFocusedDataRetreiverHandler(dataRetreiver);
    }
    //cache missed, get focus date data
    else {
      this.throttle = setTimeout(() => {
          dataRetreiver = this.getDataPackRetreiver(date);
          this.cache.set(date.toISOString(), dataRetreiver);
          setFocusedDataRetreiverHandler(dataRetreiver);
      }, delay);
    }


  }

  //caches set of dates and clears old values from cache
  //require focusDate to prevent clearing it from the cache
  private cacheDates(focusDate: Moment.Moment, dates: Moment.Moment[]) {
    let cachedDates = this.cache.keys();
    //should be more efficient to delete things from a set than array
    let cachedDatesSet = new Set(cachedDates);
    //remove focus date
    cachedDatesSet.delete(focusDate.toISOString());
    console.log(cachedDatesSet);
    for(let date of dates) {
      let dateString = date.toISOString();
      //already in cache, just delete from set so not cleared
      if(cachedDatesSet.has(dateString)) {
        console.log("hit!!!");
        //remove from set, anything left over will be removed from cache
        cachedDatesSet.delete(dateString);
      }
      //not in cache, need to retreive data
      else {
        let cacheData = this.getDataPackRetreiver(date);
        this.cache.set(dateString, cacheData);
      }
    }
    //remove old entries that weren't recached (anything still in cachedDatesSet)
    cachedDatesSet.forEach((date: string) => {
      this.cache.delete(date);
    });
  }




  //need to set something that cancels old calls on new data request to ensure synch
  //should also add some sort of small delay or cancel logic to data request logic to prevent slow down on rapid input changes, some sort of input throttle
  //sets the data focused by the application
  private setFocusedData(date: Moment.Moment, internalData: InternalDataPack): Promise<FocusedData> {
    //need to wait for raster header if not already in
    return this.header.then((header: RasterHeader) => {
      return new Promise<FocusedData>((resolve, reject) => {
        let focus: FocusedData = {
          date: date,
          data: null,
        };


        //if undefined then the date doesn't exist, do nothing and return null
        if(internalData != undefined) {
          let data: DataPack = {
            raster: null,
            sites: null,
            metrics: null
          };
          focus.data = data;
          this.combineMetaWithValues(internalData.sites).then((info: SiteInfo[]) => {
            data.sites = info;
            //console.log(internalData.sites);
            //wrap in rasterdata object
            let raster: RasterData = new RasterData(header);
            if(raster.addBands(internalData.bands).code != UpdateFlags.OK) {
              reject("Error Setting bands.");
            }
            else {
              data.raster = raster;
              // this.data.focusedData = focus;
              this.paramService.pushFocusedData(focus);
              resolve(focus);
            }

          });
        }
        else {
          //only get site data for now
          //this.dataRequestor.getSiteVals(date)
          //cache data
          //not implemented just reject for now
          reject();
        }
        //resolve(focus);
      });
    });
  }


  //combining metadata here instead of ahead of time cuts down on a lot of memory for redundant cached values in exchange for somewhat minor overhead
  private combineMetaWithValues(values: SiteValue[]): Promise<SiteInfo[]> {
    let resPromises: Promise<SiteInfo>[] = [];
    for(let i = 0; i < values.length; i++) {
      let value: SiteValue = values[i];
      let skn: string = value.skn;
      resPromises.push(this.dataRequestor.getMetaBySKN(skn).then((metadata: SiteMetadata) => {
        if(metadata != undefined) {
          return new SiteInfo(metadata, value);
        }
        else {
          //could not find metadata, print error
          console.error(`Could not find metadata for site, skn: ${skn}.`);
          return null;
        }
      }));
    }
    return Promise.all(resPromises).then((info: SiteInfo[]) => {
      //console.log(info);
      //filter out any instances where metadata could not be found to maintain consistency
      return info.filter((si) => {
        return si != null;
      });
    });
  }
}



//why is this so hard?
// class CancellablePromise<T> extends Promise<T> {
//   private static temp = null;
//   private reject = null;
//   constructor(executor: (resolve: (value?: T | PromiseLike<T>) => void, reject: (reason?: any) => void) => void) {
//     super(executor);
//     console.log((<any>this).PromiseResolve);
//     this.reject = CancellablePromise.temp;
//   }

//   public cancel(reason: string) {
//     this.reject(reason);
//   }
// }

export interface MovementVector {
  magnitude: {
    direction: 1 | -1,
    granularity: string
  } | null
  baseGranularity: string,

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
  sites: SiteValue[],
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
