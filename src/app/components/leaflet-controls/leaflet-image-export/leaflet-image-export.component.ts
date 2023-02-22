import { Component, OnInit, Input, ElementRef, ViewChild } from '@angular/core';
import {Map as LMap, Control, DomUtil, ControlPosition} from 'leaflet';
import * as rasterizeHTML from 'rasterizehtml';

@Component({
  selector: 'app-leaflet-image-export',
  templateUrl: './leaflet-image-export.component.html',
  styleUrls: ['./leaflet-image-export.component.scss']
})
export class LeafletImageExportComponent implements OnInit {
  @ViewChild("exportControl", {static: false}) exportControl: ElementRef;

  @Input() position: ControlPosition = "topleft";
  private _map: LMap;
  @Input() set map(map: LMap) {
    this._map = map;
    if(map) {
      let ExportControl = Control.extend({
        onAdd: function () {
          let control = DomUtil.get("export-control");
          return control;
        }
      });
      new ExportControl({position: this.position}).addTo(map);
    }
  }
  @Input() imageContainer: ElementRef;
  @Input() hiddenControls: string[] = [];

  constructor() {
  }

  ngOnInit() {

  }

  async exportImage() {
    this._map.dragging.disable();
    this._map.touchZoom.disable();
    this._map.doubleClickZoom.disable();
    this._map.scrollWheelZoom.disable();
    this._map.boxZoom.disable();
    this._map.keyboard.disable();
    if(this._map.tap) {
      this._map.tap.disable();
    }

    let canvas = document.createElement("canvas");
    let containerEl: HTMLElement = this.imageContainer.nativeElement;
    let nodeReplacements: HTMLNodeReplaceData[] = await this.prepareDOMForExport(containerEl);
    let mapBounds: DOMRect = containerEl.getBoundingClientRect();
    canvas.width = document.body.clientWidth;
    canvas.height = document.body.clientHeight;
    let ctx = canvas.getContext("2d");
    let defaultDisplays = new Map<HTMLElement, string>();
    rasterizeHTML.drawDocument(document, canvas).then(() => {
      //copy to a new canvas cut to the right size
      let croppedCanvas = document.createElement("canvas");
      croppedCanvas.width = mapBounds.width;
      croppedCanvas.height = mapBounds.height;
      let croppedCtx = croppedCanvas.getContext("2d");
      let imgData = ctx.getImageData(mapBounds.x, mapBounds.y, mapBounds.width, mapBounds.height);
      croppedCtx.putImageData(imgData, 0, 0);

      let link = document.createElement("a");
      link.download = "HCDP_map.png";
      link.href = croppedCanvas.toDataURL("image/png");
      document.body.appendChild(link);
      link.click();
      //cleanup
      document.body.removeChild(link);
      //reset control displays
      for(let data of defaultDisplays.entries()) {
        data[0].style.display = data[1];
      }
      //revert converted image nodes to canvas
      this.revertNodeReplacments(nodeReplacements);

      this._map.dragging.enable();
      this._map.touchZoom.enable();
      this._map.doubleClickZoom.enable();
      this._map.scrollWheelZoom.enable();
      this._map.boxZoom.enable();
      this._map.keyboard.enable();
      if(this._map.tap) {
        this._map.tap.enable();
      }
    });

    for(let className of this.hiddenControls) {
      for(let element of <any>document.getElementsByClassName(className)) {
        defaultDisplays.set(element, element.style.display);
        element.style.display = "none";
      }
    }
  }


  private revertNodeReplacments(replaceData: HTMLNodeReplaceData[]) {
    for(let item of replaceData) {
      for(let data of item.replacements) {
        item.root.removeChild(data.replacement);
        item.root.appendChild(data.original);
      }
    }
  }

  //cannot render canvases
  private async prepareDOMForExport(root: HTMLElement): Promise<HTMLNodeReplaceData[]> {
    return new Promise(async (resolve) => {
      let replaceData: HTMLNodeReplaceData[] = [];
      let replaceItem: HTMLNodeReplaceData = {
        root: root,
        replacements: []
      };
      //removing child nodes in forEach causes issues
      for(let child of Array.from(root.childNodes)) {
        let node = <HTMLElement>child;
        if(node.tagName == "IMG") {
          root.removeChild(node);
          let imageNode: HTMLImageElement = <HTMLImageElement>node;

          let sourceClone: HTMLImageElement = new Image;
          sourceClone.crossOrigin = "";
          sourceClone.src = imageNode.src;
  
          let canvasNode = document.createElement("canvas");
          let ctx = canvasNode.getContext("2d");
          canvasNode.width = imageNode.width;
          canvasNode.height = imageNode.height;
          let imageEl = document.createElement("img");
  
          let imageDrawn = new Promise<void>((resolve) => {
            let drawImageToContext = () => {
              ctx.drawImage(sourceClone, 0, 0);
              let dataURL = canvasNode.toDataURL();
              imageEl.src = dataURL;
              resolve();
            }
    
            sourceClone.addEventListener("load", drawImageToContext);
          });
  
          canvasNode.className = imageNode.className;
          for(let style in imageNode.style) {
            try {
              canvasNode.style[style] = imageNode.style[style];
            }
            catch {}
          }
  
          //set html props
          imageEl.className = imageNode.className;
          imageEl.width = imageNode.width;
          for(let style in imageNode.style) {
            try {
              imageEl.style[style] = imageNode.style[style];
            }
            catch {}
          }
          //append image node to root
          root.appendChild(imageEl);
          replaceItem.replacements.push({
            original: imageNode,
            replacement: imageEl
          });
  
          await imageDrawn;
        }
        if(node.tagName == "CANVAS") {
          root.removeChild(node);
          let canvasNode: HTMLCanvasElement = <HTMLCanvasElement>node;
          let dataURL = canvasNode.toDataURL("2d");
          let imageEl = document.createElement("img");
          imageEl.src = dataURL;
          //set html props
          imageEl.className = canvasNode.className;
          imageEl.width = canvasNode.width;
          for(let style in canvasNode.style) {
            try {
              imageEl.style[style] = canvasNode.style[style];
            }
            catch {}
          }
          //append image node to root
          root.appendChild(imageEl);
          replaceItem.replacements.push({
            original: canvasNode,
            replacement: imageEl
          });
        }
        replaceData = replaceData.concat(await this.prepareDOMForExport(node));
      }
      //only add the node if any replacements were made
      if(replaceItem.replacements.length > 0) {
        replaceData.push(replaceItem);
      }
  
      resolve(replaceData);
    });
    
  }

}

interface HTMLNodeReplaceData {
  root: HTMLElement,
  replacements: {
    original: HTMLElement,
    replacement: HTMLElement
  }[]
}