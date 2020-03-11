import { Injectable } from '@angular/core';
import { RasterData, IndexedValues, BandData, RasterHeader, UpdateStatus } from "../../models/RasterData";
import {Subject, Observable} from "rxjs";
import {SiteMetadata, SiteValue, SiteInfo} from "../../models/SiteMetadata";
import {DataLoaderService} from "../localDataLoader/data-loader.service";
import {DataRequestorService} from "../dataRequestor/data-requestor.service";
import {MetadataStoreService} from "../dataRequestor/auxillary/siteManagement/metadata-store.service";



@Injectable({
  providedIn: 'root'
})
export class DataManagerService {
  //this will be replaced with some result from initialization that indicates newest data date
  //public static readonly BASE_DATE = "Jan_1_1970";
  public static readonly DEFAULT_TYPE = "rainfall";
  public static readonly DATA_TYPES: DataType[] = ["rainfall", "anomaly", "se_rainfall", "se_anomaly"];

  //emit currently focused set, map will use this to populate
  private stateEmitter: Subject<FocusedData>;

  //use manager to mitigate issues with changing data structure
  private data: DataModel;

  //provides initial data and verifies that initialization is complete
  public initPromise: Promise<void>;

  //track and emit currently active data set
  //SCRAP, JUST ORDER BY DATES AND ADD SITE METADATA, EACH DATE HAS UNIQUE RASTER, MAKES EVERYTHING EASIER AND MORE ADAPTABLE
  //OVERHEAD SHOULD BE MINIMAL

  constructor(private dataLoader: DataLoaderService, private dataRequestor: DataRequestorService, private metaRetreiver: MetadataStoreService) {
    this.data = {
      header: null,
      primary: {},
      focusedData: null
    };
    this.stateEmitter = new Subject<FocusedData>();
    this.initPromise = this.initialize();
  }

  //store single raster data object and swap out bands

  //NOT DONE
  initialize(): Promise<void> {
    //want to retreive both things in parallel, so how to deal with date? Can just do the same for both, then add validation to ensure date is the same
    //need to add some additional information to returned like date
    let rasterLoader = this.dataLoader.getInitRaster().then((raster: RasterData) => {
      this.data.header = raster.getHeader();
    });

    let siteLoader: Promise<SiteInfo[]> = this.dataRequestor.getInitSiteVals().then((values: SiteValue[]) => {
      //print error if there's no values, should never happen, promise should reject if couldn't get data
      if(values.length == 0) {
        console.error("No values returned");
        return [];
      }
      else {
        return this.combineMetaWithValues(values);
      }
    }, (e) => {
      console.error(`Could not get site values: ${e}`);
      return [];
    });
    
    this.initPromise = Promise.all([rasterLoader, siteLoader]).then(() => {});
    return this.initPromise;
  }

  private combineMetaWithValues(values: SiteValue[]): Promise<SiteInfo[]> {
    let resPromises: Promise<SiteInfo>[] = [];
    for(let i = 0; i < values.length; i++) {
      let value: SiteValue = values[i];
      let skn: string = value.skn;
      resPromises.push(this.metaRetreiver.getMetaBySKN(skn).then((metadata: SiteMetadata) => {
        return new SiteInfo(metadata, value);
      }));
    }
    return Promise.all(resPromises);
  }

  setFocusedData(date: string): FocusedData {
    let focus: FocusedData = {
      date: date,
      data: null,
      header: null
    };
    let dataPack: DataPack = this.data.primary[date];
    //if undefined then the date doesn't exist, do nothign and return null
    if(dataPack != undefined) {
      let data = dataPack.raster.getBands([type])[type];
      //if there is no band of a specified data type for a date range then the internal state is wrong and an error should be thrown
      if(data == undefined) {
        throw new Error("Internal state error: Data band " + type + " for date does not exist");
      }
      focus.data = data;
      focus.header = dataPack.raster.getHeader();
      //freeze focused object, don't want anything external messing with the state
      Object.freeze(focus);
      this.data.focusedData = focus;
      this.stateEmitter.next(focus);
    }
    return focus;
  }

  getFocusedData(): FocusedData {
    return this.data.focusedData;
  }

  getFocusedDataListener(): Observable<FocusedData> {
    return this.stateEmitter.asObservable();
  }

  getRasterData(date: Date, types?: DataType[]): BandData | null {
    let data = null
    let dataPack: DataPack = this.data.primary[date];
    //if no types defined assume all types
    if(types == undefined) {
      types = DataManagerService.DATA_TYPES;
    }
    //if undefined then the date doesn't exist, do nothign and return null
    if(dataPack != undefined) {
      let bands: BandData = dataPack.raster.getBands(types);
      let bandNames = Object.keys(bands);
      //verify internal state
      let bandName: string;
      let i: number;
      for(i = 0; i < bandNames.length; i++) {
        bandName = bandNames[i];
        //if value undefined for band then the internal state is wrong
        if(bands[bandName] == undefined) {
          throw new Error("Internal state error: Data band " + bandName + " for date does not exist");
        }
      }
      data = bands;
    }
    return data;
  }

  getRasterHeader(date: Date): RasterHeader | null {
    let header: RasterHeader = null;
    let data: DataPack = this.data.primary[date];
    if(data != undefined) {
      header = data.raster.getHeader()
    }
    return header;
  }

  getMetrics(date: Date): Metrics | null {
    let metrics: Metrics = null;
    let data: DataPack = this.data.primary[date];
    if(data != undefined) {
      metrics = data.metrics;
    }
    return metrics;
  }

  getSiteMetadata(date: Date): SiteMetadata[] | null {
    let metadata: SiteMetadata[] = null;
    let data: DataPack = this.data.primary[date];
    if(data != undefined) {
      metadata = data.sites;
    }
    return metadata;
  }

  //should set up some sort of data listener for managing data set changes, maybe a hooking system like the parameter service

  // setCurrentData(date: string): boolean {
  //   let success = true;

  //   return success;
  // }

  // getCurrentData

  //SWITCH TO STORE EACH OF THE FOUR DATA TYPES AS SEPARATE BANDS
  //APPROPRIATE BECAUSE GARENTEED TO BE SPATIALLY COINCIDENT DATA 

  //reconstruct asserts that band names should be consistent and raster does not need to be reconstructed, verifies and returns false if incorrect
  

  //data has to be added in sets of 4 to maintain consistency
  addData(date: string, data: DataBands) {

  }

  purgeData(date: Date): boolean {

    let success: boolean = false;
    //cannot delete focused data
    if(date != this.data.focusedData.date) {
      delete this.data.primary[date];
      success = true;
    }
    return success
    
  }
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
export type Date = string;

export interface FocusedData {
  data: DataPack,
  date: Date
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