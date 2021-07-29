import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Subscription, throwError } from 'rxjs';
import { retry, catchError, take } from 'rxjs/operators';
import { AssetManagerService } from 'src/app/services/util/asset-manager.service';
import { DataProcessorService } from 'src/app/services/dataProcessor/data-processor.service';
import { DateInfo, Period, StringMap } from 'src/app/models/types';
import { Moment } from 'moment';
import { DateManagerService } from 'src/app/services/dateManager/date-manager.service';


export interface Config {
  oAuthAccessToken: string,
  queryEndpoint: string
}

@Injectable({
  providedIn: 'root'
})
export class DbConService {
  static readonly CONFIG_FILE = "config.json";
  static readonly MAX_URI = 2000;
  static readonly MAX_POINTS = 10000;

  private initPromise: Promise<Config>;

  constructor(private http: HttpClient, assetService: AssetManagerService, private geotiffProcessor: DataProcessorService, private dateProcessor: DateManagerService) {
    let url = assetService.getAssetURL(DbConService.CONFIG_FILE);
    this.initPromise = <Promise<Config>>(this.http.get(url, { responseType: "json" }).toPromise());
  }

  queryMetadata(query: string, offset: number = 0): MetadataRequestResults {
    //mirror results through external subject to avoid issues with promise wrapper
    let response = new MetadataRequestResults(this.http);
    this.initPromise.then((config: Config) => {
      response.get({query, config, offset});
    })
    .catch((e: any) => {
      console.error(`Error getting config: ${e}`);
    });

    return response;
  }

  getRaster(date: DateInfo, params: StringMap): GeotiffRequestResults {
    let response = new GeotiffRequestResults(this.http);
    let geotiffParams: GeotiffParams = {
      date,
      params,
      services: {
        geotiffHandler: this.geotiffProcessor,
        dateHandler: this.dateProcessor
      }
    }
    response.get(geotiffParams);
    return response;
  }
}


export abstract class RequestResults {
  protected sub: Subscription;
  private data: Promise<any>;
  private http: HttpClient;
  private retry: number;
  private resolve: (value: any) => void;
  protected reject: (reason: any) => void;
  private linked: RequestResults[];

  cancelled: boolean;

  constructor(http: HttpClient, retry: number = 3) {
    this.http = http;
    this.retry = retry;
    this.cancelled = false;
    this.data = new Promise<any>((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });
    // this.data.catch((reason: RequestReject) => {
    //   console.log(reason);
    //   //return Promise.reject(reason);
    // });
    this.linked = [];
  }

  abstract get(params: GeotiffParams | MetadataParams): void;

  protected _get(url: string, options: any) {
    this.sub = this.http.get(url, options)
      .pipe(
        retry(this.retry),
        take(1),
        catchError((e: HttpErrorResponse) => {
          return throwError(e);
        })
      )
      .subscribe((response: any) => {
        this.resolve(response);
      }, (error: HttpErrorResponse) => {
        let reject: RequestReject = {
          cancelled: this.cancelled,
          reason: `Error in query, status: ${error.status}, message: ${error.message}`
        };
        this.reject(reject);
      }, () => {
        if(this.cancelled) {
          let reject: RequestReject = {
            cancelled: true,
            reason: null
          }
          this.reject(reject);
        }
      });
  }

  transform(onfulfilled: (value: any) => any) {
    this.data = this.data.then(onfulfilled);

    // this.data.catch((reason: any) => {
    //   return Promise.reject(reason);
    // });
  }

  cancel(): void {
    for(let link of this.linked) {
      link.cancel();
    }
    this.cancelled = true;
    //does this complete the stream?
    this.sub.unsubscribe();
    //this.outSource.complete();
  }

  combine(request: RequestResults): void {
    this.linked.push(request);
    let promises = [this.data];
    for(let link of this.linked) {
      promises.push(link.toPromise());
    }
    this.data = Promise.all(promises);
    // this.data.catch((reason: RequestReject) => {
    //   console.log(reason);
    //   return Promise.reject(reason);
    // });
  }

  toPromise(): Promise<any> {
    return this.data;
  }

}


export class MetadataRequestResults extends RequestResults {
  
  get(params: MetadataParams) {
    if(!this.cancelled && !this.sub) {
      let url = `${params.config.queryEndpoint}?q=${encodeURI(params.query)}&limit=${DbConService.MAX_POINTS}&offset=${params.offset}`;

      if(url.length > DbConService.MAX_URI) {
        let reject: RequestReject = {
          cancelled: this.cancelled,
          reason: `Query too long: max length: ${DbConService.MAX_URI}, query length: ${url.length}`
        };
        this.reject(reject);
      }

      let head = new HttpHeaders()
      .set("Authorization", "Bearer " + params.config.oAuthAccessToken)
      .set("Content-Type", "application/x-www-form-urlencoded");
      let options = {
        headers: head
      };

      this._get(url, options);
    }
  }
  
}

export class GeotiffRequestResults extends RequestResults {
  static readonly GEOTIFF_NODATA = -3.3999999521443642e+38;
  static readonly ENDPOINT = "https://cistore.its.hawaii.edu:443/raster";

  get(params: GeotiffParams) {
    if(!this.cancelled && !this.sub) {
      // let resourceInfo = {
      //   datatype: "rainfall",
      //   period: "month",
      //   date: "2018-12",
      //   extent: "state",
      //   tier: "0"
      // };

      let geotiffNodata = params.geotiffNodata || GeotiffRequestResults.GEOTIFF_NODATA;
      let dateStr = params.services.dateHandler.dateToString(params.date.start, params.date.period);
      let resourceInfo = {
        ...params.params,
        date: dateStr,
        period: params.date.period
      };

      console.log(resourceInfo);

      let urlParams = [];
      for(let key in resourceInfo) {
        let value = resourceInfo[key];
        urlParams.push(`${key}=${value}`);
      }
      let urlSuffix = `${GeotiffRequestResults.ENDPOINT}?${urlParams.join("&")}`;
      let url = `${urlSuffix}`;
      let head = new HttpHeaders()
      .set("Cache-Control", "public, max-age=31536000");

      let responseType: "arraybuffer" = "arraybuffer";
      let options = {
        responseType: responseType,
        headers: head
      };
      //register transform before get to be safe
      this.transform((data: ArrayBuffer) => {
        return params.services.geotiffHandler.getRasterDataFromGeoTIFFArrayBuffer(data, geotiffNodata);
      });
      this._get(url, options);
    }
  }
}


interface GeotiffParams {
  date: DateInfo,
  params: StringMap,
  services: {
    geotiffHandler: DataProcessorService,
    dateHandler: DateManagerService
  },
  geotiffNodata?: number
}

interface MetadataParams {
  query: string,
  config: Config,
  offset: number
}


export interface RequestReject {
  cancelled: boolean,
  reason: any
}
