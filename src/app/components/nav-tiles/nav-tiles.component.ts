import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { trigger, state, style, transition, animate } from "@angular/animations"


@Component({
  selector: 'app-nav-tiles',
  templateUrl: './nav-tiles.component.html',
  styleUrls: ['./nav-tiles.component.scss'],
  animations: [
    trigger("selectColor", [
      state("selected", style({
        backgroundColor: "#175db6",
        color: "white"
      })),
      state("deselected", style({})),
      transition("selected <=> deselected", [
        animate("0.2s")
      ])
    ])
  ]
})
export class NavTilesComponent implements OnInit {


  @Output() componentChange: EventEmitter<string> = new EventEmitter<string>();
  @Input() component: string

  constructor() { }

  ngOnInit() {
  }

  setComponent(component: string) {
    this.component = component;
    this.componentChange.emit(component);
  }

}
