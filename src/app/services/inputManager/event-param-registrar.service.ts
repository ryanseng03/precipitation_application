import { Injectable } from '@angular/core';
import { ParameterStoreService, ParameterHook } from "./auxillary/parameter-store.service"
import { BehaviorSubject, Observable } from 'rxjs';
import { RasterData } from 'src/app/models/RasterData';
import { SiteInfo } from 'src/app/models/SiteMetadata';
import Moment from 'moment';

@Injectable({
  providedIn: 'root'
})
export class EventParamRegistrarService {

  public static readonly EVENT_TAGS = {
    raster: "raster",
    stations: "stations",
    filteredStations: "filteredStations",
    selectedStation: "selectedStation",
    date: "date",
    dataset: "dataset",
    stationTimeseries: "stationTimeseries",
    loading: "loading",
    mapBounds: "mapBounds",
  };

  private datasetSource: BehaviorSubject<any>;
  private rasterSource: BehaviorSubject<RasterData>;
  private stationsSource: BehaviorSubject<any[]>;
  private filteredStationsSource: BehaviorSubject<any[]>;
  private selectedStationSource: BehaviorSubject<any>;
  private stationTimeseriesSource: BehaviorSubject<any>;
  private dateSource: BehaviorSubject<Moment.Moment>;
  private loadingSource: BehaviorSubject<LoadingData>;
  private mapBoundsSource: BehaviorSubject<L.LatLngBounds>;
  private tagGen: UniqueTagID;

  constructor(private paramService: ParameterStoreService) {
    this.tagGen = new UniqueTagID();

    this.datasetSource = this.paramService.registerParameter<any>(EventParamRegistrarService.EVENT_TAGS.dataset);
    this.rasterSource = this.paramService.registerParameter<RasterData>(EventParamRegistrarService.EVENT_TAGS.raster);
    this.stationsSource = this.paramService.registerParameter<any[]>(EventParamRegistrarService.EVENT_TAGS.stations);
    this.filteredStationsSource = this.paramService.registerParameter<any[]>(EventParamRegistrarService.EVENT_TAGS.filteredStations);
    this.selectedStationSource = this.paramService.registerParameter<SiteInfo>(EventParamRegistrarService.EVENT_TAGS.selectedStation);
    this.stationTimeseriesSource = this.paramService.registerParameter<any>(EventParamRegistrarService.EVENT_TAGS.stationTimeseries);
    this.dateSource = this.paramService.registerParameter<Moment.Moment>(EventParamRegistrarService.EVENT_TAGS.date);
    this.loadingSource = this.paramService.registerParameter<LoadingData>(EventParamRegistrarService.EVENT_TAGS.loading);
    this.mapBoundsSource = this.paramService.registerParameter<L.LatLngBounds>(EventParamRegistrarService.EVENT_TAGS.mapBounds);
  }

  pushDataset(dataset: any): void {
    this.datasetSource.next(dataset);
  }

  pushRaster(raster: RasterData): void {
    this.rasterSource.next(raster);
  }

  pushStations(stations: any[]): void {
    this.stationsSource.next(stations);
  }

  pushFilteredStations(stations: any[]): void {
    this.filteredStationsSource.next(stations);
  }

  pushSelectedStation(station: any): void {
    this.selectedStationSource.next(station);
  }

  pushStationTimeseries(seriesData: any) {
    this.stationTimeseriesSource.next(seriesData);
  }

  pushDate(date: Moment.Moment): void {
    this.dateSource.next(date);
  }

  pushLoading(loading: LoadingData): void {
    this.loadingSource.next(loading);
  }

  pushMapBounds(mapBounds: L.LatLngBounds): void {
    this.mapBoundsSource.next(mapBounds);
  }



  //can this be integrated with the rest of the stuff?
  //why not just have map logic in map component and push out values (originally made this way in case multiple maps, shouldn't be a concern anymore)
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


  //wrapper functions for param store
  public createParameterHook(paramName: string, cb: (value: any) => void, install: boolean = true): ParameterHook {
    return this.paramService.createParameterHook(paramName, cb, install);
  }

}

export { ParameterHook } from "./auxillary/parameter-store.service"


export interface RegisterOptions {
  tagType?: "global" | "dynamic",
  globalTag?: string,
  updateTrigger?: Observable<any>
}

export interface LoadingData {
  tag: string,
  loading: boolean
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
