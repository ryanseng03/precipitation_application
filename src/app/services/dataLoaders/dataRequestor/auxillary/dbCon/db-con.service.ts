import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpEvent, HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { Observable, merge, of, Subscription, throwError, Subject, observable } from 'rxjs';
import { map, retry, catchError, mergeMap, take } from 'rxjs/operators';
import { AssetManagerService } from 'src/app/services/util/asset-manager.service';


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

  initPromise: Promise<Config>;

  constructor(private http: HttpClient, assetService: AssetManagerService) {
    let url = assetService.getAssetURL(DbConService.CONFIG_FILE);
    this.initPromise = <Promise<Config>>(this.http.get(url, { responseType: "json" }).toPromise());
  }

  //at some point may be cleaner to rework this a bit so don't have to wrap RequestResult in a promise, allow for RequestResult to be initialized before request initialized, then if cancelled before initialization just never execute the transfer (keep cancelled variable or something)
  query(query: string, offset: number = 0): RequestResults {

    //mirror results through external subject to avoid issues with promise wrapper
    let response = new RequestResults(this.http);
    this.initPromise.then((config: Config) => {
      response.get(query, config, offset);
    })
    .catch((e: any) => {
      console.error(`Error getting config: ${e}`);
    });


    return response;

  }
}



export class RequestResults {
  private sub: Subscription;
  private data: Promise<any>;
  private http: HttpClient;
  private retry: number;
  private resolve: (value: any) => void;
  private reject: (reason: any) => void;
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

  get(query: string, config: Config, offset: number) {
    console.log(query);
    //if cancelled or already called ignore
    if(!this.cancelled && !this.sub) {
      let url = `${config.queryEndpoint}?q=${encodeURI(query)}&limit=${DbConService.MAX_POINTS}&offset=${offset}`;

      if(url.length > DbConService.MAX_URI) {
        let reject: RequestReject = {
          cancelled: this.cancelled,
          reason: `Query too long: max length: ${DbConService.MAX_URI}, query length: ${url.length}`
        };
        this.reject(reject);
      }

      let head = new HttpHeaders()
      .set("Authorization", "Bearer " + config.oAuthAccessToken)
      .set("Content-Type", "application/x-www-form-urlencoded");
      let options = {
        headers: head
      };

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
        console.log(error);
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

export interface RequestReject {
  cancelled: boolean,
  reason: any
}



// class SubjectChain {
//   head: SubjectChainNode;
//   tail: SubjectChainNode;

//   constructor(root: Subject<any>) {
//     let head: SubjectChainNode = {
//       subject: root,
//       next: null
//     };
//     this.head = head;
//     this.tail = head;
//   }

//   link(obs: Subject<any>) {
//     let tail: SubjectChainNode = {
//       subject: obs,
//       next: null
//     };
//     this.tail.next = tail;
//     this.tail = tail;
//   }

//   complete() {
//     let node: SubjectChainNode = this.head;
//     while(node) {
//       node.subject.complete();
//       node = node.next;
//     }
//   }
// }

// interface SubjectChainNode {
//   subject: Subject<any>;
//   next: SubjectChainNode
// }
