import { Component } from '@angular/core';
import * as allSettled from "promise.allsettled";
allSettled.shim();

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  component: string = "nav";

  constructor() {
    //suppress warnings
    console.warn = () => {};
  }
}
