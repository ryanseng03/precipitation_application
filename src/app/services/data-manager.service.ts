import { Injectable } from '@angular/core';
import { RasterData, IndexedValues, BandData, RasterHeader, UpdateStatus } from "../models/RasterData";
import {Subject, Observable} from "rxjs";
import {SiteMetadata} from "../models/SiteMetadata";
import {DataLoaderService, InitData} from "../services/data-loader.service";
import { forEach } from '@angular/router/src/utils/collection';


@Injectable({
  providedIn: 'root'
})
export class DataManagerService {
  //this will be replaced with some result from initialization that indicates newest data date
  public static readonly BASE_DATE = "Jan_1_1970";
  public static readonly DEFAULT_TYPE = "rainfall";
  public static readonly DATA_TYPES: DataType[] = ["rainfall", "anomaly", "se_rainfall", "se_anomaly"];

  private stateEmitter: Subject<FocusedData>;

  //use manager to mitigate issues with changing data structure
  data: DataModel;
  initialized: boolean;

  //track and emit currently active data set
  //SCRAP, JUST ORDER BY DATES AND ADD SITE METADATA, EACH DATE HAS UNIQUE RASTER, MAKES EVERYTHING EASIER AND MORE ADAPTABLE
  //OVERHEAD SHOULD BE MINIMAL

  constructor(private dataLoader: DataLoaderService) {
    this.data = {
      primary: null,
      focusedData: null
    };
    this.stateEmitter = new Subject<FocusedData>();
    this.initialized = false;
    this.initialize();
  }

  initialize() {
    this.dataLoader.getInitData().then((data: InitData) => {
      this.initialized = true;
      let date = DataManagerService.BASE_DATE;
      let rasterData: RasterData = new RasterData(data.rasterData.header);
      for(let band in data.rasterData.data) {
        let added: UpdateStatus<null> = rasterData.addBand(band, data.rasterData.data[band]);
        if(added.code != 0) {
          throw new Error("Unexpected initialization error");
        }
      }
      //console.log(data);
      let pack: DataPack = {
        raster: rasterData,
        sites: data.siteMeta,
        metrics: null
      };
      this.data.primary = {};
      this.data.primary[date] = pack;
      this.setFocusedData(date, DataManagerService.DEFAULT_TYPE);
    });
    
  }

  //might just want to switch this so methods return promises, some of them will probably need to pull data eventually anyway
  // getInitialized(): Promise<void> {

  // }

  setFocusedData(date: string, type: DataType): FocusedData | null {
    this.initCheck();
    let focus: FocusedData = {
      date: date,
      type: type,
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
    console.log("?");
    return this.stateEmitter.asObservable();
  }

  getRasterData(date: Date, types?: DataType[]): BandData | null {
    this.initCheck();
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
    this.initCheck();
    let header: RasterHeader = null;
    let data: DataPack = this.data.primary[date];
    if(data != undefined) {
      header = data.raster.getHeader()
    }
    return header;
  }

  getMetrics(date: Date): Metrics | null {
    this.initCheck();
    let metrics: Metrics = null;
    let data: DataPack = this.data.primary[date];
    if(data != undefined) {
      metrics = data.metrics;
    }
    return metrics;
  }

  getSiteMetadata(date: Date): SiteMetadata[] | null {
    this.initCheck();
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
    this.initCheck();
  }

  purgeData(date: Date): boolean {
    this.initCheck();
    let success: boolean = false;
    //cannot delete focused data
    if(date != this.data.focusedData.date) {
      delete this.data.primary[date];
      success = true;
    }
    return success
    
  }

  initCheck() {
    if(!this.initialized) {
      throw new Error("State used before initialized. Please wait until initialization has been completed.");
    }
  }
}

//update as needed
interface DataModel {
  primary: DateReferencedDataPack;
  //reference to a set of values in data (primary)
  focusedData: FocusedData;
}

interface DateReferencedDataPack {
  [date: string]: DataPack
}

interface DataPack {
  raster: RasterData,
  //might change to something a bit more robust
  sites: SiteMetadata[],
  //need to define this, refer to empty interface for now
  metrics: Metrics
}

//can change this to something fancier
export type Date = string;

export interface FocusedData {
  header: RasterHeader,
  data: IndexedValues,
  type: DataType,
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