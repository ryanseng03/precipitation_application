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

    let r = this.earthRadiusAtLat(lat_avg);

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

  pointInsideGeojson(geojson: any, point: L.LatLng): boolean {
    let internal = false;
    //geojson can be null in some cases on recursion
    if(geojson) {
      /*
      A GeoJSON object represents a Geometry, Feature, or collection of Features.
      Types must be part of the non-extensible set:
      FeatureCollection, Feature, Point, LineString, MultiPoint, Polygon, MultiLineString, MultiPolygon, and GeometryCollection
      */
      //must be a closed shape so only handle Polygons and MultiPolygons as base geometries
      //non-geometry types, FeatureCollection and Feature, can be handled recursively, as can GeometryCollections
      switch(geojson.type) {
        //feature types
        case "FeatureCollection": {
          /*
          A GeoJSON object with the type "FeatureCollection" is a
          FeatureCollection object.  A FeatureCollection object has a member
          with the name "features".  The value of "features" is a JSON array.
          Each element of the array is a Feature object as defined above.  It
          is possible for this array to be empty.
          */
          //everything should be features, can just handle recursively
          for(let feature of geojson.features) {
            //if point in any of the features set internal to true
            if(this.pointInsideGeojson(feature, point)) {
              internal = true;
              break;
            }
          }
          break;
        }
        case "Feature": {
          /*
          A Feature object has a member with the name "geometry".  The value
          of the geometry member SHALL be either a Geometry object as
          defined above or, in the case that the Feature is unlocated, a
          JSON null value.
          */
          //can handle geometry recursively, remember to catch null (return false if geojson null)
          internal = this.pointInsideGeojson(geojson.geometry, point);
          break;
        }
        //geometry types
        case "GeometryCollection": {
          /*
          A GeoJSON object with type "GeometryCollection" is a Geometry object. 
          A GeometryCollection has a member with the name "geometries". 
          The value of "geometries" is an array.  Each element of this array is a
          GeoJSON Geometry object.  It is possible for this array to be empty.
          */

          for(let geometry of geojson.geometries) {
            //if internal to any of the geometries in the collection then mark as internal
            if(this.pointInsideGeojson(geometry, point)) {
              internal = true;
              break;
            }
          }

          break
        }
        case "Polygon": {
          /*
          For type "Polygon", the "coordinates" member MUST be an array of
          linear ring coordinate arrays.

          For Polygons with more than one of these rings, the first MUST be
          the exterior ring, and any others MUST be interior rings.  The
          exterior ring bounds the surface, and the interior rings (if
          present) bound holes within the surface.
          */
          let coords = geojson.coordinates;
          internal = this.isInternal(coords, point);
          break;
        }
        case "MultiPolygon": {
          /*
          For type "MultiPolygon", the "coordinates" member is an array of
          Polygon coordinate arrays.
          */
          for(let coords of geojson.coordinates) {
            //if internal to one then internal to the multipolygon
            if(this.isInternal(coords, point)) {
              internal = true;
              break;
            }
          }
          break;
        }
        //any other geometry types are not closed polygons, just return false
      }
  
    }
    return internal;
  }


  //I believe the set of segments is defined as a[i] -> b[i]

  //can specify origin if 0, 0 is in range, not necessary for cover being used (0,0 not in range)
  private isInternal(rings: number[][][], point: L.LatLng, origin: L.LatLng = L.latLng(0, 0)): boolean {
    /*
    A linear ring is a closed LineString with four or more positions.

    The first and last positions are equivalent, and they MUST contain
    identical values; their representation SHOULD also be identical.

    A linear ring is the boundary of a surface or the boundary of a
    hole in a surface.

    A linear ring MUST follow the right-hand rule with respect to the
    area it bounds, i.e., exterior rings are counterclockwise, and
    holes are clockwise.
    */

    //raycasting algorithm, point is internal if intersects an odd number of edges
    let internal = false
    for(let ring of rings) {
      //segments are ring[i] -> ring[i + 1], last point in ring is equal to first
      for(let i = 0; i < ring.length - 1; i++) {
        /*
        A position is an array of numbers.  There MUST be two or more
        elements.  The first two elements are longitude and latitude, or
        easting and northing, precisely in that order and using decimal
        numbers.  Altitude or elevation MAY be included as an optional third
        element.
        */
        let c1 = ring[i];
        let c2 = ring[i + 1]
        let p1 = L.latLng(c1[1], c1[0]);
        let p2 = L.latLng(c2[1], c2[0]);

        if(this.ccw(p1, origin, point) != this.ccw(p2, origin, point) && this.ccw(p1, p2, origin) != this.ccw(p1, p2, point)) {
          internal = !internal
        }
      }
    }

    return internal;
  }

  //determinant formula yields twice the signed area of triangle formed by 3 points
  //counterclockwise if negative, clockwise if positive, collinear if 0
  private ccw(p1: L.LatLng, p2: L.LatLng, p3: L.LatLng): boolean {
    //if on line counts, both will be 0, probably need to add special value (maybe return -1, 0, or 1)
    //lng is x, lat is y
    return ((p2.lng - p1.lng) * (p3.lat - p1.lat) - (p3.lng - p1.lng) * (p2.lat - p1.lat)) > 0;
  }
}
