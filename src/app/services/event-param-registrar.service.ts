import { Injectable } from '@angular/core';
import { ParameterStoreService, ParameterHook } from "./parameter-store.service"

@Injectable({
  providedIn: 'root'
})
export class EventParamRegistrarService {

  tagGen: UniqueTagID;

  constructor(private paramService: ParameterStoreService) {
    this.tagGen = new UniqueTagID();
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
      map.off("mousemove", moveHandler);
    });

    return label;
  }

  
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
