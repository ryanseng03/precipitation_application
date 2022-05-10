import { Component, OnInit, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { trigger, state, style, transition, animate } from "@angular/animations"

@Component({
  selector: 'app-nav-base',
  templateUrl: './nav-base.component.html',
  styleUrls: ['./nav-base.component.scss'],
  animations: [
    trigger("navSize", [
      state("fullscreen", style({
        width: "100%"
      })),
      state("expand", style({
        width: "275px",
        minWidth: "275px"
      })),
      state("collapse", style({
        width: "30px",
        minWidth: "30px"
      })),
      transition("expand <=> collapse", [
        animate("0.2s")
      ]),
      transition("fullscreen => *", [
        animate("0.3s")
      ])
    ]),
    trigger("selectColor", [
      state("selected", style({
        backgroundColor: "#175db6",
        fill: "white"
    })),
      state("deselected", style({})),
      transition("selected <=> deselected", [
        animate("0.2s")
      ])
    ])
  ]
})
export class NavBaseComponent implements OnInit, OnChanges {

  @Output() componentChange: EventEmitter<string> = new EventEmitter<string>();
  @Input() component: string;

  
  navCollapsed: boolean = false;
  collapseTimer: NodeJS.Timer = null;

  constructor() {}


  ngOnInit() {
    this.componentChange.subscribe((value) => {
      console.log(value);
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    console.log(changes);
  }

  changeNavExpand(event: PointerEvent, value: boolean) {
    //if nav component (initial state) ignore this
    if(this.component != "nav") {
      
      if(this.collapseTimer) {
        clearTimeout(this.collapseTimer);
      }
      let timeout = value ? 0 : 500;
      this.collapseTimer = setTimeout(() => {
        this.navCollapsed = value;
        this.collapseTimer = null;
      }, timeout);
    }


  }

  selectComponent(component: string) {
    if(this.component == "nav") {
      this.navCollapsed = true;
    }
    
    this.component = component;
  }


  getNavState() {
    let expandState = null;
    if(this.component == "nav") {
      expandState = "fullscreen";
    }
    else {
      expandState = this.navCollapsed ? "collapse" : "expand";
    }
    return expandState;
  }

  getNavExpanded() {
    let expanded = true;
    if(this.component == "nav") {
      expanded = true;
    }
    else {
      expanded = this.navCollapsed ? false : true;
    }
    return expanded;
  }

}
