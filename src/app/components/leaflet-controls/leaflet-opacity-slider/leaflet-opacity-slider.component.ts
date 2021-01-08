import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import {Map, Control, DomUtil, DomEvent, Layer} from 'leaflet';
import { MatSliderChange } from '@angular/material/slider';
import { FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import {UploadCustomColorSchemeComponent} from "../../../dialogs/upload-custom-color-scheme/upload-custom-color-scheme.component";
import { ColorGeneratorService, XMLColorSchemeData } from 'src/app/services/rasterLayerGeneration/color-generator.service';
import { ColorScale } from 'src/app/models/colorScale';
import { CustomColorSchemeService } from 'src/app/services/helpers/custom-color-scheme.service';

@Component({
  selector: 'app-leaflet-opacity-slider',
  templateUrl: './leaflet-opacity-slider.component.html',
  styleUrls: ['./leaflet-opacity-slider.component.scss']
})
export class LeafletOpacitySliderComponent implements OnInit {

  private _map: Map;
  public control: Control.Layers;
  private layers: Layer;
  public schemeControl: FormControl;
  //change to input?
  private defaultScheme: string = "mono";
  baseColorSchemes = {
    mono: "Monochromatic",
    usgs: "USGS",
    viridus: "Viridis",
    turbo: "Turbo",
    tacc3: "TACC 3-wave",
    tacc4: "TACC 4-wave",
    tacc5: "TACC 5-wave"
  };
  //use separate tag so no conflict with values, only have to restrict by public name
  customColorSchemes: {[tag: string]: XMLColorSchemeData};
  private forbiddenNames: Set<string>;
  private debounce: boolean;

  @Output() opacity: EventEmitter<number>;
  @Output() colorScheme: EventEmitter<ColorScale>;

  //should probably replace these with simple value inputs
  @Input() mapGetOpacity: () => number;
  @Input() mapLayerReady: () => boolean;
  //
  @Input() set map(map: Map) {
    if(map) {
      //console.log(map);
      this._map = map;
      let LayerControl = <any>Control.Layers.extend({
        onAdd: function() {
          this._initLayout();
          this._addOpacitySlider();
          this._addColorSchemeSelector();
          this._update();
          return this._container;
        },
        _addOpacitySlider: function() {
          let controlContainer = this._addContainer();
          let control = DomUtil.get("opacity-control");
          controlContainer.appendChild(control);
          DomEvent.disableClickPropagation(controlContainer);
        },
        _addColorSchemeSelector: function() {
          let controlContainer = this._addContainer();
          let control = DomUtil.get("color-control");
          controlContainer.appendChild(control);
          DomEvent.disableClickPropagation(controlContainer);
          //reopen control on click after close (selectors new context causes the control to close, need timeout 0 to delegate to after control closure)
          DomEvent.addListener(control, "click", () => {
          //note setimmediate is non-standard and is not defined naturally
          setTimeout(() => {
            this.expand();
          }, 0);

          });
        },
        _addContainer: function() {
          let elements = this._container.getElementsByClassName('leaflet-control-layers-list');
          let controlContainer = DomUtil.create("div", "", elements[0]);
          return controlContainer;
        }
      });
      this.control = new LayerControl(this.layers).addTo(map);
    }

  }
  get map(): Map {
    return this._map
  }

  constructor(public helper: CustomColorSchemeService, public dialog: MatDialog, private colors: ColorGeneratorService) {
    this.opacity = new EventEmitter<number>();
    this.colorScheme = new EventEmitter<ColorScale>();
    this.schemeControl = new FormControl(this.defaultScheme);
    this.customColorSchemes = {};
    this.forbiddenNames = new Set<string>(Object.values(this.baseColorSchemes));
    this.debounce = false;
  }

  removeCustomColorScheme(tag: string) {
    let name = this.customColorSchemes[tag].name;
    delete this.customColorSchemes[tag];
    this.forbiddenNames.delete(name);
    //if deleting the active color scheme reset to the default scheme
    if(this.schemeControl.value == tag) {
      this.schemeControl.setValue(this.defaultScheme);
    }
  }

  ngOnInit() {
    let chain = new RevertableCancellationChain();
    //seed chain with first value and dummy promise
    chain.addNode(() => {return this.schemeControl.value}, new CancellablePromise(Promise.resolve()));
    this.schemeControl.valueChanges.subscribe((scheme: string) => {
      //if debounce set just reset debounce flag
      if(this.debounce) {
        this.debounce = false;
      }
      else {
        let p = this.getColorScheme(scheme);
        let cancellablePromise = new CancellablePromise(p);
        let valueF = scheme == "custom" ? (result: [string, ColorScale]) => {return result[0];} : () => {return scheme;}
        chain.addNode(valueF, cancellablePromise);
        cancellablePromise.then((colorSchemeData: [string, ColorScale]) => {
          let tag = colorSchemeData[0];
          //tag is the currently active scheme value, if the value was set to something else while processing reset to this now (adn debounce)
          //also handles setting to new value for custom uploads
          //handles cases where reverted to last valid while this item (upchain) was processing
          //if upchain valid item the value will be reset to that item when its processing is complete
          if(this.schemeControl.value != tag) {
            this.debounce = true;
            this.schemeControl.setValue(tag);
          }
          let colorScheme = colorSchemeData[1];
          console.log(scheme, colorScheme);
          this.colorScheme.emit(colorScheme);
        })
        .catch((reason: {cancelled: boolean, reason: any}) => {
          //if not cancelled came back invalid, revert control to last valid value
          if(!reason.cancelled) {
            //dont debounce, want to add to chain in case other items still in process (this should be added to the chain)
            //this.debounce = true;
            let reversionValue = chain.getLastValidValue();
            //no valid value, revert to defualt, should be impossible
            if(reversionValue === null) {
              reversionValue = this.defaultScheme
            }
            console.log(reversionValue);
            this.schemeControl.setValue(reversionValue);
          }
        });
      }

    });
  }

  ngOnDestroy() {
    this._map.removeControl(this.control);
  }

  setOpacity(event: MatSliderChange): void {
    this.opacity.emit(event.value);
  }

  getOpacity(): number {
    return this.mapGetOpacity();
  }

  layerReady(): boolean {
    return this.mapLayerReady();
  }

  addLayers(layers: Layer) {
    this.layers = layers;

  }

  addOverlay(overlay: Layer, name: string) {
    this.control.addOverlay(overlay, name);
  }

  removeLayer(layer: Layer) {
    this.control.removeLayer(layer);
  }

  //returns tag that references the color scheme and the ColorScale object
  getCustomColorScheme(): Promise<[string, ColorScale]> {
    return new Promise((resolve, reject) => {
      let dialogRef = this.dialog.open(UploadCustomColorSchemeComponent, {
        data: this.forbiddenNames
      });
      dialogRef.afterClosed().toPromise().then((data: XMLColorSchemeData) => {

        if(data) {
          let colorScheme = data.colors;
          let name = data.name;
          let tag = this.helper.generateTag();
          this.forbiddenNames.add(name);
          this.customColorSchemes[tag] = data;
          console.log(name);
          resolve([tag, colorScheme]);
        }
        else {
          reject();
        }
      });
    });

  }

  getColorScheme(scheme: string): Promise<[string, ColorScale]> {

    let getColorSchemeFromAssetFile = (fname: string, reverse?: boolean): Promise<ColorScale> => {
      return this.colors.getColorSchemeFromAssetFile(fname, reverse).then((data: XMLColorSchemeData) => {
        return data.colors;
      });
    }

    let p: Promise<[string, ColorScale]>;
    switch(scheme) {
      case "mono": {
        let colorScheme = this.colors.getDefaultMonochromaticRainfallColorScale();
        p = Promise.resolve([scheme, colorScheme]);
        break;
      }
      case "rainbow": {
        let colorScheme = this.colors.getDefaultRainbowRainfallColorScale();
        p = Promise.resolve([scheme, colorScheme]);
        break;
      }
      case "turbo": {
        let colorScheme = this.colors.getTurboColorScale();
        p = Promise.resolve([scheme, colorScheme]);
        break;
      }
      case "usgs": {
        let colorScheme = this.colors.getUSGSColorScale();
        p = Promise.resolve([scheme, colorScheme]);
        break;
      }
      case "viridus": {
        let colorScheme = this.colors.getViridusColorScale();
        p = Promise.resolve([scheme, colorScheme]);
        break;
      }
      case "tacc1": {
        p = getColorSchemeFromAssetFile("/assets/colorschemes/1-3wbgy.xml", true).then((colorScale: ColorScale) => {
          return [scheme, colorScale];
        });
        break;
      }
      case "tacc2": {
        p = getColorSchemeFromAssetFile("/assets/colorschemes/1-bluegary1.xml").then((colorScale: ColorScale) => {
          return [scheme, colorScale];
        });
        break;
      }
      case "tacc3": {
        p = getColorSchemeFromAssetFile("/assets/colorschemes/4-3wbgy.xml", true).then((colorScale: ColorScale) => {
          return [scheme, colorScale];
        });
        break;
      }
      case "tacc4": {
        p = getColorSchemeFromAssetFile("/assets/colorschemes/13-4w_grphgrnl.xml").then((colorScale: ColorScale) => {
          return [scheme, colorScale];
        });
        break;
      }
      case "tacc5": {
        p = getColorSchemeFromAssetFile("/assets/colorschemes/17-5wdkcool.xml").then((colorScale: ColorScale) => {
          return [scheme, colorScale];
        });
        break;
      }
      case "tacc6": {
        p = getColorSchemeFromAssetFile("/assets/colorschemes/18-5w_coolcrisp2.xml").then((colorScale: ColorScale) => {
          let res: [string, ColorScale] = [scheme, colorScale];
          return res;
        });
        break;
      }
      case "custom": {
        p = this.getCustomColorScheme();
        break
      }
      //any other value should be custom color scheme
      default: {
        //get color scheme from map
        let colorScheme = this.customColorSchemes[scheme].colors;
        //failsafe, should never happen (should only happen if reverting after deletion, before default loads, which should be pretty much impossible in practice), but keep just in case
        //just return recursive call with default scheme
        if(colorScheme === undefined) {
          p = this.getColorScheme(this.defaultScheme);
        }
        let res: [string, ColorScale] = [scheme, colorScheme];
        p = Promise.resolve(res);
      }
    }

    return p;
  }

}

//simple cancellable promise wrapper allows cancel flag to be set and checked when running callbacks
class CancellablePromise<T> {
  private _cancelled: boolean
  public then;
  get cancelled(): boolean {
    return this._cancelled;
  }
  promise: Promise<T>;
  private wrappedPromise: Promise<T>;
  private reject: (reason?: any) => void;


  constructor(promise: Promise<T>) {
    this.promise = promise;
    this._cancelled = false;

    this.wrappedPromise = new Promise<T>((resolve, reject) => {
      this.reject = reject;
      this.promise.then((value: T) => {
        //if cancelled promise was already rejected, shouldn't do anything
        if(!this.cancelled) {
          resolve(value);
        }
      })
      .catch((reason: any) => {
        //if cancelled promise was already rejected, shouldn't do anything
        if(!this.cancelled) {
          console.log("here???", reason);
          //propogate reject
          reject({
            cancelled: false,
            reason: reason
          });
        }
      });
    });


    //then uses "this.constructor", so need to use bind to keep it as a standard promise, otherwise will create an instance of CancellablePromise
    this.then = this.wrappedPromise.then.bind(this.wrappedPromise);
  }

  cancel() {
    this._cancelled = true;
    //if cancelled can reject immediately
    this.reject({
      cancelled: true,
      reason: null
    });
  }
}




//tail node is last valid, on issue revert to tail node, don't cancel anything
//on valid cancel everything down chain, set valid item last to null, and set as new tail
class RevertableCancellationChain {
  //keep ref to tail for efficency on reversion (no need to iterate chain)
  private tail: RevertableCancellationChainNode;
  private head: RevertableCancellationChainNode;

  //just give this the form control and let it do everything
  //remember to debounce
  constructor() {
    this.tail = null;
    this.head = null;
  }

  public getLastValidValue(): any {
    return this.tail ? this.tail.value : null;
  }

  //cancellable promise should be valid if promise resolves, otherwise invalid/cancelled
  //result function will be called with the promise result, value not needed until set as valid
  public addNode(value: (result: any) => any, promise: CancellablePromise<any>) {

    let node = new RevertableCancellationChainNode(value, promise, this.head);
    this.head = node;
    //first node, initialize tail
    if(this.tail === null) {
      this.tail = node;
    }
    promise.then(() => {
      //node got result, set as valid
      this.setNodeValid(node);
    })
    //invalid or cancelled, do nothing
    .catch(() => {});
  }


  private setNodeValid(node: RevertableCancellationChainNode) {
    node.setValid();
    //this is now the last valid entry and should be the tail of the chain
    this.tail = node;
  }

}

class RevertableCancellationChainNode {
  previous: RevertableCancellationChainNode;
  value: any;
  promise: CancellablePromise<any>;

  constructor(value: (result: any) => any, promise: CancellablePromise<any>, previous: RevertableCancellationChainNode = null) {
    this.value = null;
    this.previous = previous;
    this.promise = promise;
    //set value with function on promise completion
    promise.then((result: any) => {
      this.value = value(result);
    })
    //cancelled or invalid, no need to set node value
    .catch(() => {});
  }

  public setValid() {
    let node: RevertableCancellationChainNode = this;
    //cancel all previous promises
    while(node.previous) {
      node = node.previous;
      node.promise.cancel();
    }
    //cut off chain here, this is now the last node to return valid
    this.previous = null;
  }


}
