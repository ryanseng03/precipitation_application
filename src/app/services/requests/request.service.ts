import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Subscription, throwError, Observable } from 'rxjs';
import { retry, catchError, take, map } from 'rxjs/operators';
import { AssetManagerService } from 'src/app/services/util/asset-manager.service';
import { StringMap } from 'src/app/models/types';
import { ErrorPopupService } from 'src/app/services/errorHandling/error-popup.service';

@Injectable({
  providedIn: 'root'
})
export class RequestService {
  private static readonly CONFIG_FILE = "api_config.json";
  static readonly MAX_URI = 2000;
  static readonly MAX_POINTS = 10000;
  

  private initPromise: Promise<Config>;

  constructor(private http: HttpClient, assetService: AssetManagerService, private errorPop: ErrorPopupService) {
    let url = assetService.getAssetURL(RequestService.CONFIG_FILE);
    this.initPromise = <Promise<Config>>(this.http.get(url, { responseType: "json" }).toPromise())
    .catch((e) => {
      console.error(`Loading this project for the first time? You need a configuration file with connection information. Please contact the developers at hcdp@hawaii.edu for help setting this up.\n\nError getting config: ${e}`);
      errorPop.notify("error", `An unexpected error occured. Unable to retrieve API config.`);
    });
  }

  private constructURL(api: string, endpoint: string, port?: number, params?: Object) {
    let urlParams = [];
    if(params) {
      for(let key in params) {
        let value = params[key];
        urlParams.push(`${key}=${value}`);
      }
    }
    let url = api;
    if(port !== undefined) {
      url += `:${port}`;
    }
    url += endpoint;
    if(urlParams.length > 0) {
      let urlParamString = urlParams.join("&");
      url += `?${urlParamString}`;
    }
    return encodeURI(url);
  }

  private constructHeaders(token: string, headerData?: StringMap) {
    let headers = new HttpHeaders()
    .set("Authorization", "Bearer " + token);
    if(headerData) {
      for(let key in headerData) {
        headers.set(key, headerData[key]);
      }
    }
    return headers;
  }

  private async getAPIData(apiID: string) {
    let config = await this.initPromise;
    let apiData = config[apiID];
    //if api ID is not recognized throw an error
    if(!apiData) {
      console.error(`Unrecognized api ID ${apiID}. Please check that this API exists in your config file.`);
      throw new Error("Invalid API data");
    }
    return apiData;
  }

  async post(apiID: string, endpoint: string, responseType: string, body: Object, headerData: StringMap = {}, retry: number = 3, delay: number = 0): Promise<RequestResults> {
    let apiData = await this.getAPIData(apiID);
    //check list of endpoints, if string is not an id in the list, attempt to use as endpoint string directly
    endpoint = apiData.endpoints[endpoint] ?? endpoint;
    
    let url = this.constructURL(apiData.url, endpoint, apiData.port);
    let headers = this.constructHeaders(apiData.token, headerData);
    let options = {
      responseType: responseType,
      headers
    };

    let reqData: RequestData = {
      url,
      options,
      headers,
      body
    };

    let res = new RequestResults(this.http, ReqType.POST, reqData, retry, delay);
    return res;
  }

  async get(apiID: string, endpoint: string, responseType: string, params: Object = {}, headerData: StringMap = {}, retry: number = 3, delay: number = 0): Promise<RequestResults> {
    let apiData = await this.getAPIData(apiID);
    //check list of endpoints, if string is not an id in the list, attempt to use as endpoint string directly
    endpoint = apiData.endpoints[endpoint] ?? endpoint;
    let url = this.constructURL(apiData.url, endpoint, apiData.port, params);
    let headers = this.constructHeaders(apiData.token, headerData);
    let options = {
      responseType: responseType,
      headers
    };

    let reqData: RequestData = {
      url,
      options,
      headers
    };

    let res = new RequestResults(this.http, ReqType.GET, reqData, retry, delay);
    return res;
  }
}

enum ReqType {
  POST,
  GET
}

interface ReqHandle<T> {
  promise: Promise<T>,
  resolve: (value: any) => void,
  reject: (value: any) => void
}

export class RequestResults {
  protected sub: Subscription;
  protected timeout: NodeJS.Timeout;
  private data: ReqHandle<any>;
  private http: HttpClient;
  private retry: number;

  cancelled: boolean;

  constructor(http: HttpClient, type: ReqType, requestData: RequestData, retry: number = 3, delay: number = 0) {
    this.http = http;
    this.retry = retry;
    this.cancelled = false;
    this.data = {
      promise: null,
      resolve: null,
      reject: null
    };
    this.data.promise = new Promise<any>((resolve, reject) => {
      this.data.resolve = resolve;
      this.data.reject = reject;
    })
    let start = new Date().getTime();
    setTimeout(() => {
      switch(type) {
        case ReqType.GET: {
          this.wrapReq(this.http.get(requestData.url, requestData.options), start);
          break;
        }
        case ReqType.POST: {
          this.sub = this.wrapReq(this.http.post(requestData.url, requestData.body, requestData.options), start);
          break;
        }
      }
    }, delay);
  }

  private wrapReq(res: Observable<any>, startTime: number): Subscription {
    
    let obs = res.pipe(
      retry(this.retry),
      take(1),
      catchError((e: HttpErrorResponse) => {
        return throwError(e);
      })
    )

    return obs.subscribe((response) => {
      this.data.resolve(response);
    }, (error: HttpErrorResponse) => {
      let reject: RequestReject = {
        cancelled: this.cancelled,
        reason: `Error in query, status: ${error.status}, message: ${error.message}`
      };
      this.data.reject(reject);
    });
  }

  cancel(): void {
    this.cancelled = true;
    if(this.sub) {
      //does this complete the stream?
      this.sub.unsubscribe();
    }

    let reject: RequestReject = {
      cancelled: true,
      reason: null
    }
    this.data.reject(reject);
    clearTimeout(this.timeout);
  }

  transformData(transform: (value: any) => any) {
    //transform and reemit errors
    this.data.promise = this.data.promise.then(transform).catch((e) => {throw e;});
  }

  async toPromise(): Promise<any> {
    return this.data.promise;
  }
}

interface Config {
  [id: string]: APIData
}

interface RequestData {
  url: string,
  options: any,
  headers: HttpHeaders,
  body?: Object
}

interface APIData {
  url: string,
  port?: number,
  endpoints: StringMap,
  token: string
}

export interface RequestReject {
  cancelled: boolean,
  reason: any
}
