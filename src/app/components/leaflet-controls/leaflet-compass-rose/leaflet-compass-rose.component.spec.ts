import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LeafletCompassRoseComponent } from './leaflet-compass-rose.component';

describe('LeafletCompassRoseComponent', () => {
  let component: LeafletCompassRoseComponent;
  let fixture: ComponentFixture<LeafletCompassRoseComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ LeafletCompassRoseComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LeafletCompassRoseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
