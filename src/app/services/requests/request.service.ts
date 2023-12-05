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
  private static readonly MAX_REQS = 5;
  static readonly MAX_URI = 2000;
  static readonly MAX_POINTS = 10000;


  private initPromise: Promise<Config>;
  private reqQueue: Queue<RequestExecutor>;
  private reqs: Set<RequestExecutor>;


  constructor(private http: HttpClient, assetService: AssetManagerService, private errorPop: ErrorPopupService) {
    let url = assetService.getAssetURL(RequestService.CONFIG_FILE);
    this.initPromise = <Promise<Config>>(this.http.get(url, { responseType: "json" }).toPromise())
    .catch((e) => {
      console.error(`Loading this project for the first time? You need a configuration file with connection information. Please contact the developers at hcdp@hawaii.edu for help setting this up.\n\nError getting config: ${e}`);
      this.errorPop.notify("error", `An unexpected error occured. Unable to retrieve API config.`);
    });

    this.reqQueue = new Queue<RequestExecutor>();
    this.reqs = new Set<RequestExecutor>();
  }

  private exec(req: RequestExecutor) {
    //execute the request
    req.exec();
    //put request in the execution set
    this.reqs.add(req);
    //when request completes remove from execution set and replace if there are items in the queue
    req.toPromise().finally(() => {
      //remove this request from the set of executing requests, and pull the next request from the queue
      this.reqs.delete(req)
      this.next();
    });
  }

  private next() {
    let nextReq = this.reqQueue.dequeue();
    //if nextReq is not null execute the request and add to execution set
    if(nextReq) {
      this.exec(nextReq);
    }
  }


  private queue(req: RequestExecutor) {
    
    //if the execution set has room execute the request
    if(this.reqs.size < RequestService.MAX_REQS) {
      this.exec(req);
    }
    //otherwise put in queue
    else {
      this.reqQueue.enqueue(req);
    }
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
    let apiData: APIData;
    if(config) {
      apiData = config[apiID];
    }
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

    let executor = new RequestExecutor(this.http, ReqType.POST, reqData, retry);
    return this.handleExecutor(executor, delay);
  }

  async get(apiID: string, endpoint: string, responseType: string, params: Object = {}, headerData: StringMap = {}, retry: number = 3, delay: number = 0): Promise<RequestResults> {
    console.log(params);
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

    let executor = new RequestExecutor(this.http, ReqType.GET, reqData, retry);
    return this.handleExecutor(executor, delay);
  }

  handleExecutor(executor: RequestExecutor, delay: number): RequestResults {
    let timeout = setTimeout(() => {
      this.queue(executor);
    }, delay);
    let res = new RequestResults(executor);
    //if the request is cancelled stop timeout to prevent buildup if rapidly creating requests with delays (should have no effect if timeout already completed)
    res.toPromise().finally(() => {
      clearTimeout(timeout);
    });
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

//public version of RequestResults (fix naming)
export class RequestResults {
  private res: RequestExecutor;

  constructor(res: RequestExecutor) {
    this.res = res;
  }

  get cancelled(): boolean {
    return this.res.cancelled;
  }

  get complete(): boolean {
    return this.res.complete;
  }

  public cancel(): void {
    this.res.cancel();
  }

  transformData(transform: (value: any) => any) {
    //transform and reemit errors
    this.res.transformData(transform);
  }

  async toPromise(): Promise<any> {
    return this.res.toPromise();
  }
}

class RequestExecutor {
  protected sub: Subscription;
  private data: ReqHandle<any>;
  private http: HttpClient;
  private retry: number;
  private type: ReqType;
  private requestData: RequestData;
  private _complete: boolean;
  private _cancelled: boolean;

  constructor(http: HttpClient, type: ReqType, requestData: RequestData, retry: number = 3) {
    this.http = http;
    this.retry = retry;
    this.type = type;
    this.requestData = requestData;
    this._cancelled = false;
    this.data = {
      promise: null,
      resolve: null,
      reject: null
    };
    this._complete = false;
    this.data.promise = new Promise<any>((resolve, reject) => {
      this.data.resolve = resolve;
      this.data.reject = reject;
    });
    this.data.promise.finally(() => {
      this._complete = true;
    });
  }

  exec() {
    //if completed before executed (i.e. if cancelled) don't exec
    if(!this._complete) {
      switch(this.type) {
        case ReqType.GET: {
          this.wrapReq(this.http.get(this.requestData.url, this.requestData.options));
          break;
        }
        case ReqType.POST: {
          this.sub = this.wrapReq(this.http.post(this.requestData.url, this.requestData.body, this.requestData.options));
          break;
        }
      }
    }
  }

  private wrapReq(res: Observable<any>): Subscription {
    let obs = res.pipe(
      retry(this.retry),
      take(1),
      catchError((e: HttpErrorResponse) => {
        return throwError(e);
      })
    );

    return obs.subscribe((response) => {
      this.data.resolve(response);
    }, (error: HttpErrorResponse) => {
      let reject: RequestReject = {
        cancelled: this._cancelled,
        reason: `Error in query, status: ${error.status}, message: ${error.message}`
      };
      this.data.reject(reject);
    });
  }

  cancel(): void {
    this._cancelled = true;
    if(this.sub) {
      //does this complete the stream?
      this.sub.unsubscribe();
    }

    let reject: RequestReject = {
      cancelled: true,
      reason: null
    }
    this.data.reject(reject);
  }

  transformData(transform: (value: any) => any) {
    //transform and reemit errors
    this.data.promise = this.data.promise.then(transform);
  }

  async toPromise(): Promise<any> {
    return this.data.promise;
  }

  get cancelled(): boolean {
    return this._cancelled;
  }

  get complete(): boolean {
    return this._complete;
  }
}

class Queue<T> {
  private _size: number;
  private head: QueueNode<T>;
  private tail: QueueNode<T>;

  constructor() {
    this._size = 0;
    this.head = this.tail = null;
  }

  enqueue(value: T) {
    let node: QueueNode<T> = {
      value,
      next: null
    }
    if(this.tail) {
      this.tail.next = node;
    }
    else {
      this.head = node;
    }
    this.tail = node;
    this._size++;
  }

  dequeue(): T {
    let node = this.head;
    let value = null;
    if(node) {
      this.head = node.next;
      this._size--;
      value = node.value;
    }
    if(!this.head) {
      this.tail = null;
    }
    return value;
  }

  get size(): number {
    return this._size;
  }
}

interface QueueNode<T> {
  value: T,
  next: QueueNode<T>
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
