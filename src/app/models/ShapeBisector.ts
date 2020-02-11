

export class ShapeBisector {

    constructor() {}


    public getBisectedShapes(source: any, bisector: any, options: BisectorOptions) {
        //check if source and bisector have multiples, package in array for consistency if not
        if(!Array.isArray(source)) {
            source = [source];
        }
        if(!Array.isArray(bisector)) {
            bisector = [bisector];
        }
    }

    
}

export interface BisectorOptions {
    cutoutMode: number //internal, external, both, only relevant for cutout polygons

}

