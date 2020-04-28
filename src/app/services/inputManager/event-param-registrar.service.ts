import { Injectable } from '@angular/core';
import { ParameterStoreService, ParameterHook } from "./auxillary/parameter-store.service"
import { Observable } from 'rxjs';
import { DataManagerService, FocusedData, DataType, Metrics } from "../../services/dataManager/data-manager.service";
import { RasterData } from 'src/app/models/RasterData';
import { SiteInfo } from 'src/app/models/SiteMetadata';
import { Subject } from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class EventParamRegistrarService {

  public static readonly GLOBAL_HANDLE_TAGS = {
    raster: "focusedRaster",
    sites: "focusedSites",
    filteredSites: "filteredSites",
    selectedSite: "selectedSite",
    date: "focusedDate",
    metrics: "focusedMetrics",
    startDate: "startDate",
    endDate: "endDate",
    timestep: "timeGranularity",
    dataset: "submittedDataset",
  };

  //global handler aux events
  private _siteSelectSource = new Subject<SiteInfo>();
  private _filteredSiteSource = new Subject<SiteInfo[]>();

  //dataset select persistent
  private _startDateSource = new Subject<string>();
  private _endDateSource = new Subject<string>();
  private _timestepSource = new Subject<string>();

  //selected dataset, change from any type when defined
  private _datasetSource = new Subject<any>();

  pushSiteSelect(selectedSite: SiteInfo): void {
    this._siteSelectSource.next(selectedSite);
  }

  pushSiteFilter(filteredSites: SiteInfo[]): void {
    this._filteredSiteSource.next(filteredSites);
  }

  pushStartDate(startDate: string): void {
    this._startDateSource.next(startDate);
  }

  pushEndDate(endDate: string): void {
    this._endDateSource.next(endDate);
  }

  pushTimestep(timestep: string): void {
    this._timestepSource.next(timestep);
  }

  pushDataset(dataset: any): void {
    this._datasetSource.next(dataset);
  }

  tagGen: UniqueTagID;

  constructor(private paramService: ParameterStoreService, private dataManager: DataManagerService) {
    this.tagGen = new UniqueTagID();
    this.setupGlobalHandlers();
  }

  //register a map click's geopositional data as a parameter, return identifier
  registerGeoMapClick(map: L.Map): string {
    //use unique tag id to prevent issues if called multiple times
    let label = "mapclick_" + this.tagGen.getTag();

    let sub = this.paramService.registerParameter<L.LatLng>(label);

    map.on("click", (e: L.LeafletMouseEvent) => {
      sub.next(e.latlng);
    });

    return label;
  }


  private setupGlobalHandlers() {
    //get focused data from data manager and split into data, raster, and site handlers
    //parameter hooks can then be used
    let rasterTag = EventParamRegistrarService.GLOBAL_HANDLE_TAGS.raster;
    let sitesTag = EventParamRegistrarService.GLOBAL_HANDLE_TAGS.sites;
    let filteredSitesTag = EventParamRegistrarService.GLOBAL_HANDLE_TAGS.filteredSites;
    let selectedSiteTag = EventParamRegistrarService.GLOBAL_HANDLE_TAGS.selectedSite;
    let dateTag = EventParamRegistrarService.GLOBAL_HANDLE_TAGS.date;
    let metricsTag = EventParamRegistrarService.GLOBAL_HANDLE_TAGS.metrics;

    let startDateTag = EventParamRegistrarService.GLOBAL_HANDLE_TAGS.startDate;
    let endDateTag = EventParamRegistrarService.GLOBAL_HANDLE_TAGS.endDate;
    let timestepTag = EventParamRegistrarService.GLOBAL_HANDLE_TAGS.timestep;

    let datasetTag = EventParamRegistrarService.GLOBAL_HANDLE_TAGS.dataset;


    let rasterSub = this.paramService.registerParameter<RasterData>(rasterTag);
    let sitesSub = this.paramService.registerParameter<SiteInfo[]>(sitesTag);
    let metricsSub = this.paramService.registerParameter<Metrics>(metricsTag);
    let dateSub = this.paramService.registerParameter<string>(dateTag);

    let siteSelectSub = this.paramService.registerParameter<SiteInfo>(selectedSiteTag);
    let filteredSitesSub = this.paramService.registerParameter<SiteInfo[]>(filteredSitesTag);

    let startDateSub = this.paramService.registerParameter<string>(startDateTag);
    let endDateSub = this.paramService.registerParameter<string>(endDateTag);
    let timestepSub = this.paramService.registerParameter<string>(timestepTag);

    let datasetSub = this.paramService.registerParameter<any>(datasetTag);

    let siteSelectObserver = this._siteSelectSource.asObservable();
    let filteredSiteObserver = this._filteredSiteSource.asObservable();

    let startDateObserver = this._startDateSource.asObservable();
    let endDateObserver = this._endDateSource.asObservable();
    let timestepObserver = this._timestepSource.asObservable();

    let datasetObserver = this._datasetSource.asObservable();

    this.dataManager.getFocusedDataListener().subscribe((data: FocusedData) => {
      rasterSub.next(data.data.raster);
      sitesSub.next(data.data.sites);
      metricsSub.next(data.data.metrics);
      dateSub.next(data.date);
    });

    siteSelectObserver.subscribe((data: SiteInfo) => {
      siteSelectSub.next(data);
    });
    filteredSiteObserver.subscribe((data: SiteInfo[]) => {
      filteredSitesSub.next(data);
    });

    startDateObserver.subscribe((data: string) => {
      startDateSub.next(data);
    });
    endDateObserver.subscribe((data: string) => {
      endDateSub.next(data);
    });
    timestepObserver.subscribe((data: string) => {
      timestepSub.next(data);
    });

    datasetObserver.subscribe((data: any) => {
      datasetSub.next(data);
    });

  }


  registerMapHover(map: L.Map) {
    let label = "maphover_" + this.tagGen.getTag();
    let sub = this.paramService.registerParameter<L.LatLng>(label);
    let moveHandler = (e: L.LeafletMouseEvent) => {
      sub.next(e.latlng);
    };
    map.on("mouseover", () => {
      map.on("mousemove", moveHandler)
    });
    map.on("mouseout", () => {
      //indicate exited map with a null
      sub.next(null);
      map.off("mousemove", moveHandler);
    });

    return label;
  }


  //wrapper functions for param store
  public createParameterHook(paramName: string, cb: (value: any) => void, install: boolean = true): ParameterHook {
    return this.paramService.createParameterHook(paramName, cb, install);
  }

  public getParameters(paramNames?: string[]): {[name: string]: any} {
    return this.paramService.getParameters(paramNames);
  }

}

export { ParameterHook } from "./auxillary/parameter-store.service"



export interface RegisterOptions {
  tagType?: "global" | "dynamic",
  globalTag?: string,
  updateTrigger?: Observable<any>
}



//provides a unique id for creating a tag, not secure (can easily guess ids), probably don't need a secure tagging system
class UniqueTagID {
  private tag: string;
  private tagNum: number;

  constructor() {
    this.tagNum = 0;
    this.tag = "0";
  }

  public getTag(): string {
    let tag = this.tag;
    this.nextGlobalTagID();
    return tag;
  }

  private nextGlobalTagID(): void {
    this.tag = (++this.tagNum).toString();
  }
}
