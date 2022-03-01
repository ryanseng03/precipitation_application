import { Component, Input, OnInit } from '@angular/core';
import { trigger, state, style, transition, animate } from "@angular/animations";

@Component({
  selector: 'app-loading-component',
  templateUrl: './loading-component.component.html',
  styleUrls: ['./loading-component.component.scss'],
  animations: [trigger("fadeCycle", [
    state("fade", style({
      opacity: 0.2
    })),
    state("full", style({
      opacity: 1
    })),
    transition("* <=> *", [
      animate("2.0s")
    ])
  ])]
})
export class LoadingComponentComponent implements OnInit {
  
  @Input() diameter: number = 50;

  fadeState = "full";

  constructor() { }

  ngOnInit() {
  }

  fontSize(): string {
    let size = this.diameter / 2;
    return size + "px";
  }

  fadeTrans() {
    this.fadeState = this.fadeState == "full" ? "fade" : "full";
  }

}
