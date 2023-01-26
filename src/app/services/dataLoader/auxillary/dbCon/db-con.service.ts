import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, Subscription, throwError } from 'rxjs';
import { retry, catchError, take } from 'rxjs/operators';
import { AssetManagerService } from 'src/app/services/util/asset-manager.service';
import { DataProcessorService } from 'src/app/services/dataProcessor/data-processor.service';
import { StringMap } from 'src/app/models/types';
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

  constructor(private http: HttpClient, assetService: AssetManagerService) {
    let url = assetService.getAssetURL(DbConService.CONFIG_FILE);
    this.initPromise = <Promise<Config>>(this.http.get(url, { responseType: "json" }).toPromise());
  }

  queryMetadata(query: string, offset: number = 0, delay?: number): MetadataRequestResults {
    //mirror results through external subject to avoid issues with promise wrapper
    let response = new MetadataRequestResults(this.http);
    this.initPromise.then((config: Config) => {
      response.get({query, config, offset}, delay);
    })
    .catch((e: any) => {
      console.error(`Error getting config: ${e}`);
    });

    return response;
  }

  getRaster(params: StringMap, nodata?: number, delay?: number): GeotiffRequestResults {
    let response = new GeotiffRequestResults(this.http);

    this.initPromise.then((config: Config) => {
      let data = {
        config,
        data: params
      }
     response.get(data, delay);
    })
    .catch((e: any) => {
      console.error(`Error getting config: ${e}`);
    });


    return response;
  }
}


export abstract class RequestResults {
  protected sub: Subscription;
  protected timeout: NodeJS.Timeout;
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
    this.linked = [];
  }

  abstract get(params: GeotiffParams | MetadataParams, delay?: number): void;

  protected _get(url: string, options: any, delay?: number) {
    const setSub = () => {
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
      });
    }

    if(delay) {
      this.timeout = setTimeout(() => {
        setSub();
      }, delay);
    }
    else {
      setSub();
    }


  }

  transform(onfulfilled: (value: any) => any) {
    this.data = this.data.then(onfulfilled);
  }

  cancel(): void {
    for(let link of this.linked) {
      link.cancel();
    }
    this.cancelled = true;
    if(this.sub) {
      //does this complete the stream?
      this.sub.unsubscribe();
    }

    let reject: RequestReject = {
      cancelled: true,
      reason: null
    }
    this.reject(reject);

    if(this.timeout) {
      clearTimeout(this.timeout);
    }
  }

  combine(request: RequestResults): void {
    this.linked.push(request);
    let promises = [this.data];
    for(let link of this.linked) {
      promises.push(link.toPromise());
    }
    this.data = Promise.all(promises);
  }

  toPromise(): Promise<any> {
    return this.data;
  }

}


export class MetadataRequestResults extends RequestResults {

  get(params: MetadataParams, delay?: number) {
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

      this._get(url, options, delay);
    }
  }
}

export class GeotiffRequestResults extends RequestResults {
  static readonly ENDPOINT = "https://cistore.its.hawaii.edu:8443/raster";

  get(params: GeotiffParams, delay?: number) {
    if(!this.cancelled && !this.sub) {
      let urlParams = [];
      for(let key in params.data) {
        let value = params.data[key];
        urlParams.push(`${key}=${value}`);
      }
      let urlSuffix = `${GeotiffRequestResults.ENDPOINT}?${urlParams.join("&")}`;
      let url = `${urlSuffix}`;
      let head = new HttpHeaders()
      .set("Cache-Control", "public, max-age=31536000")
      .set("Authorization", "Bearer " + params.config.oAuthAccessToken);

      let responseType: "arraybuffer" = "arraybuffer";
      let options = {
        responseType: responseType,
        headers: head
      };

      this._get(url, options, delay);
    }
  }
}


type GeotiffParams = {
  config: Config,
  data: StringMap
};

interface MetadataParams {
  query: string,
  config: Config,
  offset: number
}


export interface RequestReject {
  cancelled: boolean,
  reason: any
}
