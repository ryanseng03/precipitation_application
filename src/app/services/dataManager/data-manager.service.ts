import { Injectable } from '@angular/core';
import { RasterData, IndexedValues, BandData, RasterHeader, UpdateStatus, UpdateFlags } from "../../models/RasterData";
import {Subject, Observable} from "rxjs";
import {SiteMetadata, SiteValue, SiteInfo} from "../../models/SiteMetadata";
import {DataLoaderService} from "../dataLoaders/localDataLoader/data-loader.service";
import {DataRequestorService} from "../dataLoaders/dataRequestor/data-requestor.service";
import Moment from 'moment';



@Injectable({
  providedIn: 'root'
})
export class DataManagerService {
  //this will be replaced with some result from initialization that indicates newest data date
  public static readonly DEFAULT_TYPE = "rainfall";
  public static readonly DATA_TYPES: DataType[] = ["rainfall", "anomaly", "se_rainfall", "se_anomaly"];
  public static readonly FALLBACK_DATE: string = "1970-01-01T00:00:00.000Z";

  //emit currently focused set, map will use this to populate
  private stateEmitter: Subject<FocusedData>;

  //use manager to mitigate issues with changing data structure
  private data: DataModel;

  //provides initial data and verifies that initialization is complete
  private initPromise: Promise<void>;

  //track and emit currently active data set
  //SCRAP, JUST ORDER BY DATES AND ADD SITE METADATA, EACH DATE HAS UNIQUE RASTER, MAKES EVERYTHING EASIER AND MORE ADAPTABLE
  //OVERHEAD SHOULD BE MINIMAL

  constructor(private dataLoader: DataLoaderService, private dataRequestor: DataRequestorService) {
    // this.data = {
    //   header: null,
    //   primary: {},
    //   focusedData: null
    // };
    this.stateEmitter = new Subject<FocusedData>();
    this.header = dataRequestor.getRasterHeader();
    // this.initPromise = this.initialize();
    //no delay for init data
    this.getData(this.initDate, 0);
    // setTimeout(() => {
    //   console.log("second submitted");
    //   this.getData(Moment("2018-11-01T00:00:00.000Z"));
    // }, 10000);
  }

  //store single raster data object and swap out bands


  //////////////////////////
  //////////////////////////
  ///////////////////////////
  /////////////////

  //TEMP PATCH
  //all months for now
  initDate = Moment("2019-12-01T00:00:00.000Z");
  //only store 7 (focus +-3)
  //map by date string to ensure access proper
  cache = new Map<string, Promise<InternalDataPack>>();
  header: Promise<RasterHeader>;

  
  private getDateRange(focus: Moment.Moment): Moment.Moment[] {
    //let's get 3 months around
    let range = [];
    for(let i = -3; i < 0; i++) {
      range.push(focus.add(i, "months"));
    }
    for(let i = 1; i <= 3; i++) {
      range.push(focus.add(i, "months"));
    }
    return range;
  }

  private getDataCheckSource(date: Moment.Moment): Promise<InternalDataPack> {
    return new Promise((resolve, reject) => {
      let isoStr = date.toISOString();
      let data: Promise<InternalDataPack> = this.cache.get(isoStr);
      //data not in cache (not available or being retreived)
      //set to retrieve and add to cache
      if(data === undefined) {
        data = new Promise((resolve, reject) => {
          let dataPack = {
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
        this.cache.set(isoStr, data);
      }
      resolve(data);
    });
    
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


  //note init calls setFocusedData

  throttle = null;

  getData(date: Moment.Moment, delay: number = 5000): void {
    //use a throttle to prevent constant data pulls on fast date walk, set to 5 second (is there a better way to do this?)
    if(this.throttle) {
      clearTimeout(this.throttle);
    }
    this.throttle = setTimeout(() => {
      let dateRange = this.getDateRange(date);
      let initData: InternalDataPack = {
        bands: null,
        sites: null,
        metrics: null
      }
      this.getDataCheckSource(date).then((data: InternalDataPack) => {
        console.log(data);
        //emit the data to the application
        this.setFocusedData(date, data);
      });
      //set the other dates in the range
      for(let sdate of dateRange) {
        this.getDataCheckSource(sdate);
      }
    }, delay);
    
  }




  //need to set something that cancels old calls on new data request to ensure synch
  //should also add some sort of small delay or cancel logic to data request logic to prevent slow down on rapid input changes, some sort of input throttle
  //sets the data focused by the application
  setFocusedData(date: Moment.Moment, internalData: InternalDataPack): Promise<FocusedData> {
    //need to wait for raster header if not already in
    return this.header.then((header: RasterHeader) => {
      return new Promise<FocusedData>((resolve, reject) => {
        let focus: FocusedData = {
          date: date,
          data: null,
        };
        
    
        //if undefined then the date doesn't exist, do nothign and return null
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
              this.stateEmitter.next(focus);
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
          console.error("Could not find metadata for site.");
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



  getFocusedDataListener(): Observable<FocusedData> {
    return this.stateEmitter.asObservable();
  }

  ////////////
  /////////////
  //////////////
  /////////////






  // //instead of initializing like this just use init date
  // initialize(): Promise<void> {
  //   let initData: InternalDataPack = {
  //     bands: null,
  //     sites: null,
  //     metrics: null
  //   }
  //   //want to retreive both things in parallel, so how to deal with date? Can just do the same for both, then add validation to ensure date is the same
  //   //need to add some additional information to returned like date
  //   let rasterLoader = this.dataLoader.getInitRaster().then((raster: RasterData) => {
  //     this.data.header = raster.getHeader();
  //     //freeze header so can't be inadvertantly modified when passed out of data manager
  //     Object.freeze(this.data.header);
  //     initData.bands = raster.getBands();
  //   });



  //   let siteLoader = this.dataRequestor.getInitSiteVals().then((values: SiteValue[]) => {
  //     //console.log(values);
  //     //print error if there's no values, should never happen, promise should reject if couldn't get data
  //     if(values.length == 0) {
  //       console.error("No values returned");
  //     }
  //     initData.sites = values;
  //   }, (e) => {
  //     console.error(`Could not get site values: ${e}`);
  //     initData.sites = [];
  //   });
    
  //   let date: string = DataManagerService.FALLBACK_DATE;
  //   this.initPromise = Promise.all([rasterLoader, siteLoader]).then(() => {
  //     //for now just use date from sites (or fallback date if no sites), should verify raster date though once database retreival up
  //     if(initData.sites.length > 0) {
  //       date = initData.sites[0].date;
  //     }
  //     this.data.primary[date] = initData;
  //   });
  //   this.initPromise.then(() => {
  //     //set the focused data to the init data
  //     this.setFocusedData(date);
  //   });
  //   return this.initPromise;
  // }




  // //should require a focused date too, need some place to pivot around
  // //should it just start the display at the min value? should also just focus that after retreival
  // setDateRange(start: string, end: string) {
  //   //for now just get and cache everything, should be chunked
  //   this.dataRequestor.getSiteVals
  // }

  // // retreiveDateRange(start: string, end: string): Promise {
  // //   //only get site data for now
  // //   this.dataRequestor.getSiteVals(date)
  // // }


  // getFocusedData(): Promise<FocusedData> {
  //   return this.initPromise.then(() => {
  //     return this.data.focusedData;
  //   });
  // }

  

  // getRasterData(date: Date, types?: DataType[]): Promise<BandData> {
  //   return this.initPromise.then(() => {
  //     let data = null
  //     let dataPack: InternalDataPack = this.data.primary[date];
  //     //if no types defined assume all types
  //     if(types == undefined) {
  //       types = DataManagerService.DATA_TYPES;
  //     }
  //     //if undefined then the date doesn't exist, do nothign and return null
  //     if(dataPack != undefined) {
  //       let bands: BandData = dataPack.bands;
  //       let bandNames = Object.keys(bands);
  //       //verify internal state
  //       let bandName: string;
  //       let i: number;
  //       for(i = 0; i < bandNames.length; i++) {
  //         bandName = bandNames[i];
  //         //if value undefined for band then the internal state is wrong
  //         if(bands[bandName] == undefined) {
  //           throw new Error("Internal state error: Data band " + bandName + " for date does not exist");
  //         }
  //       }
  //       data = bands;
  //     }
  //     return data;
  //   });
  // }

  // getRasterHeader(): Promise<RasterHeader> {
  //   return this.initPromise.then(() => {
  //     return this.data.header;
  //   });
  // }

  // getMetrics(date: Date): Promise<Metrics> {
  //   return this.initPromise.then(() => {
  //     let metrics: Metrics = null;
  //     let data: InternalDataPack = this.data.primary[date];
  //     if(data != undefined) {
  //       metrics = data.metrics;
  //     }
  //     //return null for now, instead should pull the data into the cache
  //     return metrics;
  //   });
  // }

  // getSiteInfo(date: Date): Promise<SiteInfo[]> {
  //   return this.initPromise.then(() => {
  //     let metadata: SiteInfo[] = null;
  //     let data: InternalDataPack = this.data.primary[date];
  //     if(data != undefined) {
  //       return this.combineMetaWithValues(data.sites);
  //     }
  //     //return null for now, instead should pull the data into the cache
  //     return metadata;
  //   });
    
  // }

  // //should set up some sort of data listener for managing data set changes, maybe a hooking system like the parameter service

  // // setCurrentData(date: string): boolean {
  // //   let success = true;

  // //   return success;
  // // }

  // // getCurrentData

  // //SWITCH TO STORE EACH OF THE FOUR DATA TYPES AS SEPARATE BANDS
  // //APPROPRIATE BECAUSE GARENTEED TO BE SPATIALLY COINCIDENT DATA 

  // //reconstruct asserts that band names should be consistent and raster does not need to be reconstructed, verifies and returns false if incorrect
  

  // //data has to be added in sets of 4 to maintain consistency
  // addData(date: string, data: DataBands) {

  // }

  // purgeData(date: Date): boolean {

  //   let success: boolean = false;
  //   //cannot delete focused data
  //   if(date != this.data.focusedData.date) {
  //     delete this.data.primary[date];
  //     success = true;
  //   }
  //   return success
    
  // }
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