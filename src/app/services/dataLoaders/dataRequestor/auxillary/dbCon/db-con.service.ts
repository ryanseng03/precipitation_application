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

  query<T>(query: string, resultHandler: (result: any) => T, offset: number = 0): Promise<T> {
    interface ResponseResults {
      result: any
    }

    return this.initPromise.then(() => {
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

      let results = this.http.get(url, options)
      .pipe(
        retry(3),
        take(1),
        catchError((e) => {
          return Observable.throw(e);
        })
      ).toPromise().then((response: any) => {
        return resultHandler(response.result);
      });

      return results;

    });
  }
}

class CancellableRequest<T> {
  resultSub: Subscription;
  resultPromise: Promise<ResponseResults>;
  resolver: (result: any) => void;
  //interesting syntax (looks like this grabs the type of the prototype function given it's name as the index)
  then: Promise<T>["then"];

  constructor(url, options, resultHandler, http: HttpClient) {
    this.resultPromise = new Promise((resolve, reject) => {
      this.resolver = resolve;
      let results = http.get(url, options)
        .pipe(
          retry(3),
          take(1),
          catchError((e) => {
            return Observable.throw(e);
          })
        );
        this.resultSub = results.subscribe((response: any) => {
          let res = resultHandler(response.result);
          resolve(res);
        });
      });



    this.then = this.resultPromise.then((response: ResponseResults) => {
      return resultHandler(response.result);
    }).then;
  }

  toPromise() {
    return this.resultPromise;
  }

  cancel(): void {
    this.resolver(null);
    this.resultSub.unsubscribe();
  }


}

interface ResponseResults {
  result: any
}
