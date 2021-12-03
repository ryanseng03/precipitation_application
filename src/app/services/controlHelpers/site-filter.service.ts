import { Injectable } from '@angular/core';
import {EventParamRegistrarService, ParameterHook} from "../inputManager/event-param-registrar.service";
import { SiteInfo } from 'src/app/models/SiteMetadata';

@Injectable({
  providedIn: 'root'
})
export class SiteFilterService {

  constructor(private paramService: EventParamRegistrarService) {
    let hook: ParameterHook = paramService.createParameterHook(EventParamRegistrarService.EVENT_TAGS.stations, (sites: SiteInfo[]) => {
      // let filtered = this.applySiteFilter(sites);
      // paramService.pushSiteFilter(filtered);
    });
  }

  //need to apply actual filtering, for now just return same
  applySiteFilter(sites: SiteInfo[]): SiteInfo[] {
    return sites;
  }
}
