import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpEvent, HttpResponse } from '@angular/common/http';
import { Observable, merge, of, Subscription } from 'rxjs';
import { map, retry, catchError, mergeMap, take } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class DbConService {

  static readonly TOKEN_FILE = "/assets/APIToken.txt";
  static readonly MAX_URI = 2000;
  static readonly MAX_POINTS = 10000;

  private oAuthAccessToken = "token";
  private initPromise;

  constructor(private http: HttpClient) {

    this.initPromise = this.http.get(DbConService.TOKEN_FILE, { responseType: "text" }).toPromise().then((data) => {
      this.oAuthAccessToken = data;
    });
  }

  //at some point may be cleaner to rework this a bit so don't have to wrap RequestResult in a promise, allow for RequestResult to be initialized before request initialized, then if cancelled before initialization just never execute the transfer (keep cancelled variable or something)
  query(query: string, offset: number = 0): Promise<RequestResults> {
    interface ResponseResults {
      result: any
    }

    let r =  this.initPromise.then(() => {
      let url = `https://agaveauth.its.hawaii.edu/search/v2/data?q=${encodeURI(query)}&limit=${DbConService.MAX_POINTS}&offset=${offset}`;

      if(url.length > DbConService.MAX_URI) {
        throw new Error("Query too long.");
      }

      let head = new HttpHeaders()
      .set("Authorization", "Bearer " + this.oAuthAccessToken)
      .set("Content-Type", "application/x-www-form-urlencoded");
      let options = {
        headers: head
      };

      let resultPromise = null;
      let resultSub = null;
      let resolver = null;

      resultPromise = new Promise((resolve, reject) => {
        resolver = resolve;
        console.log(this.http);
        let results = this.http.get(url, options)
        .pipe(
          retry(3),
          take(1),
          catchError((e) => {
            return Observable.throw(e);
          })
        );
        resultSub = results.subscribe((response: any) => {
          resolve(response);
        });
      });

      // let results = this.http.get(url, options)
      // .pipe(
      //   retry(3),
      //   take(1),
      //   catchError((e) => {
      //     return Observable.throw(e);
      //   })
      // ).toPromise().then((response: any) => {
      //   return resultHandler(response.result);
      // });

      let request = new RequestResults(resultPromise, resolver, resultSub);
      console.log(request);
      return request;

    });

    console.log(r);

    return r;
  }
}

// class CancellableRequest {
//   resultSub: Subscription;
//   resultPromise: Promise<any>;
//   resolver: (result: any) => void;
//   //interesting syntax (looks like this grabs the type of the prototype function given it's name as the index)
//   // then: Promise<any>["then"];

//   //what is the tpye for options? just use any for now, not super important
//   constructor(url: string, options: any, http: HttpClient) {
//     console.log(http);
//     this.resultPromise = new Promise((resolve, reject) => {
//       this.resolver = resolve;
//       console.log(http);
//       let results = http.get(url, options)
//         .pipe(
//           retry(3),
//           take(1),
//           catchError((e) => {
//             return Observable.throw(e);
//           })
//         );
//         this.resultSub = results.subscribe((response: any) => {
//           console.log(response);
//           let res = response.result;
//           resolve(res);
//         });
//       });


//     // //allow chaining of internal promise by setting internal promise to result of any then calls actually make modified method so have choice)
//     // this.then = this.resultPromise.then;
//   }

//   toRequestResult(): RequestResults {
//     return new RequestResults(this.resultPromise, this.resolver, this.resultSub);
//   }


// }

export class RequestResults {
  result: Promise<any>;
  resultSub: Subscription;
  resolver: (result: any) => void;

  constructor(result: Promise<any>, resolver: (result: any) => void, resultSub: Subscription) {
    this.result = result;
    this.resultSub = resultSub;
    this.resolver = resolver;
  }

  transform(onfulfilled?: (value: any) => any, onrejected?: (reason: any) => any): RequestResults {
    return new RequestResults(this.result.then(onfulfilled, onrejected), this.resolver, this.resultSub);
  }

  cancel(): void {
    console.log(this);
    this.resolver(null);
    this.resultSub.unsubscribe();
  }

  toPromise(): Promise<any> {
    return this.result;
  }
}
