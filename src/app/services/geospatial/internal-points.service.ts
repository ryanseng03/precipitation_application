import { Injectable } from '@angular/core';
import * as L from 'leaflet';

@Injectable({
  providedIn: 'root'
})
export class InternalPointsService {

  constructor() { }

  deg2rad(deg: number): number {
    return deg * Math.PI / 180;
  }

  //geocentric radius of earth at a geodetic latitude
  earthRadiusAtLat(lat: number): number {

    //semi-major (a) and semi-minor (b) earth axes in meters
    let a = 6378137.0;
    let b = 6356752.3142;
    //geocentric latitude, should be geodetic right?
    //yes, this formula is geodetic, geocentric would remove the bottom half of the fraction (derived)
    //Math.atan((1 - Math.pow(Math.E, 2)) * Math.tan(lat))
    //geodetic latitude
    let phi = lat;
    let top = Math.pow(Math.pow(a, 2) * Math.cos(phi), 2) + Math.pow(Math.pow(b, 2) * Math.sin(phi), 2);
    let bottom = Math.pow(a * Math.cos(phi), 2) + Math.pow(b * Math.sin(phi), 2);
    let r = Math.sqrt(top / bottom);
    return r;
  }

  //haversine formula
  haversineDistance(coord1: L.LatLng, coord2: L.LatLng): number {
    let lat_avg = (coord1.lat + coord2.lat) / 2
    console.log(lat_avg);

    let r = this.earthRadiusAtLat(lat_avg);
    console.log(r / 1000);

    //lambda and phi are in radians
    let lambda_1 = this.deg2rad(coord1.lng);
    let lambda_2 = this.deg2rad(coord2.lng);
    let phi_1 = this.deg2rad(coord1.lat);
    let phi_2 = this.deg2rad(coord2.lat);

    let lambda_theta = lambda_2 - lambda_1;
    let phi_theta = phi_2 - phi_1;

    let hav = (theta: number): number => {
      return Math.pow(Math.sin(theta / 2), 2);
    }

    let hav_lambda = hav(lambda_theta);
    let hav_phi = hav(phi_theta);

    let h = hav_phi + Math.cos(phi_1) * Math.cos(phi_2) * hav_lambda;

    let rooth = Math.sqrt(h);
    let d = 2 * r * Math.asin(rooth);
    console.log(d);
    return d;
  }


  pointInsideCircle(circleBounds: L.LatLngBounds, point: L.LatLng): boolean {
    let center = circleBounds.getCenter();
    let outerLat = circleBounds.getNorth();
    let outerPoint = L.latLng(outerLat, center.lng);
    let r = this.haversineDistance(center, outerPoint);
    let d = this.haversineDistance(center, point);
    return d < r;
  }

  pointInsideRectangle(rectangle: L.LatLngBounds, point: L.LatLng): boolean {
    //built in to LatLngBounds
    return rectangle.contains(point);
  }

  pointInsideGeojson(geojson: any, point: L.LatLng) {
    console.log(geojson);
  }



  private getInternalIndices(geojsonObjects: any, backgroundIndices?: number[]): number[] {
      let indices = [];

      geojsonObjects.features.forEach((feature) => {
        //if not a feature return
        if(feature.type.toLowerCase() != "feature") {
          return;
        }
        let geoType = feature.geometry.type.toLowerCase();
        switch(geoType) {
          case "polygon": {
            let coordinates = feature.geometry.coordinates;
            indices = indices.concat(this.getPolygonInternalIndices(coordinates, backgroundIndices));
            break;
          }
          case "multipolygon": {
            let coordinates = feature.geometry.coordinates;
            coordinates.forEach((polygon) => {
              indices = indices.concat(this.getPolygonInternalIndices(polygon, backgroundIndices));
            });
            break;
          }
        }
      });

      return indices;
    }


  //I believe the set of segments is defined as a[i] -> b[i]

  //can specify origin if 0, 0 is in range, not necessary for cover being used (0,0 not in range)
  private isInternal(a: any[], b: any[], point: any, origin: any = { x: 0, y: 0 }): boolean {
    //raycasting algorithm, point is internal if intersects an odd number of edges
    let internal = false;
    for(let i = 0; i < a.length; i++) {
      //segments intersect iff endpoints of each segment are on opposite sides of the other segment
      //check if angle formed is counterclockwise to determine which side endpoints fall on
      if(this.ccw(a[i], origin, point) != this.ccw(b[i], origin, point) && this.ccw(a[i], b[i], origin) != this.ccw(a[i], b[i], point)) {
        internal = !internal
      }

    }
    return internal;
  }

  //determinant formula yields twice the signed area of triangle formed by 3 points
  //counterclockwise if negative, clockwise if positive, collinear if 0
  private ccw(p1, p2, p3): boolean {
    //if on line counts, both will be 0, probably need to add special value (maybe return -1, 0, or 1)
    return ((p2.x - p1.x) * (p3.y - p1.y) - (p3.x - p1.x) * (p2.y - p1.y)) > 0;
  }
}
