import { Component } from '@angular/core';
import * as allSettled from "promise.allsettled";
allSettled.shim();

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  bannerOpen: boolean = false;
  supportedBrowsers: Set<string> = new Set(["opera", "chromium_edge", "firefox", "chrome"]);

  constructor() {
    //suppress warnings
    console.warn = () => {};
    this.checkBrowser();
  }

  checkBrowser() {
    let agent = navigator.userAgent.toLowerCase();
    let browser = "";
    //if none of the supported browsers are found in the user agent then open banner
    if(agent.indexOf("opera") >= 0 || agent.indexOf("opr") >= 0) {
      browser = "opera"
    }
    else if(agent.indexOf("edge") >= 0) {
      browser = "edge"
    }
    else if(agent.indexOf("edg/") >= 0) {
      browser = "chromium_edge"
    }
    else if(agent.indexOf("chrome") >= 0) {
      browser = "chrome"
    }
    else if(agent.indexOf("safari") >= 0) {
      browser = "safari";
    }
    else if(agent.indexOf("firefox") >= 0) {
      browser = "firefox"
    }
    else if(agent.indexOf("msie") >= 0) {
      browser = "ie"
    }
    console.log(browser);
    if(!this.supportedBrowsers.has(browser)) {
      this.bannerOpen = true;
    }
  }

  closeBanner() {
    this.bannerOpen = false;
  }
}
