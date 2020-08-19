import { Injectable, NgZone } from '@angular/core';
import { Subject, merge, Observable, Subscribable, Subscription, ReplaySubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ParameterStoreService {

  private parametersSubjects: {[name: string]: ReplaySubject<any>};
  private parametersState: {[name: string]: any};

  constructor(private ngZone: NgZone) {
    this.parametersSubjects = {};
    this.parametersState = {};
  }

  public registerParameter<T>(name: string, initValue: T = null): ReplaySubject<T> {
    let paramSubject = null;
    //ensure this parameter does not already exist
    if(this.parametersSubjects[name] == undefined) {
      paramSubject = new ReplaySubject<T>();
      this.parametersSubjects[name] = paramSubject;
      this.parametersState[name] = initValue;
    }
    return paramSubject;
  }



  // public getParametersListener(paramNames?: string[]): Observable<ParameterEvent<any>> {
  //   let observables = [];
  //   if(paramNames == undefined) {
  //     let subjects = Object.values(this.parametersSubjects);
  //     subjects.forEach((subject: ReplaySubject<ParameterEvent<any>>) => {
  //       observables.push(subject.asObservable());
  //     });
  //   }
  //   else {
  //     paramNames.forEach((name: string) => {
  //       let subject = this.parametersSubjects[name];
  //       if(subject != undefined) {
  //         observables.push(subject.asObservable());
  //       }
  //     });
  //   }
  //   return merge(...observables);
  // }

  public createParameterHook(paramName: string, cb: (value: any) => void, install: boolean = true): ParameterHook {
    let hook: ParameterHook = null;
    let subject: ReplaySubject<any> = this.parametersSubjects[paramName];
    if(subject != undefined) {
      //use ngZone.run to execute callback, triggers change detection, functions called in rxjs subscriptions don't trigger by default
      let zonedCB = (value) => {
        this.ngZone.run(() => {
          cb(value);
        });
      };
      hook = new ParameterHook(subject, zonedCB);
      if(install) {
        hook.install();
      }
    }

    return hook;
  }

  public getParameters(paramNames?: string[]): {[name: string]: any} {
    let params: {[name: string]: any} = {}
    if(paramNames == undefined) {
      params = this.parametersState;
    }
    else {
      paramNames.forEach((name: string) => {
        params[name] = this.parametersState[name];
      });
    }

    return params;
  }


}



// interface ParameterEvent<T> {
//   name: string,
//   value: T
// }

export class ParameterHook {
  private active: boolean;
  private sub: Subscription;
  private source: ReplaySubject<any>;
  private cb: (value: any) => void;

  constructor(source: ReplaySubject<any>, cb: (value: any) => void) {
    this.source = source;
    this.cb = cb;
  }

  install(): boolean {
    let installed = true;
    if(!this.active) {
      this.active = true;
      this.sub = this.source.subscribe((value: any) => {
        this.cb(value);
      });
    }
    return installed;
  }

  uninstall(): boolean {
    let uninstalled = true;
    if(this.active) {
      this.active = false;
      this.sub.unsubscribe();
    }
    return uninstalled;
  }
}
