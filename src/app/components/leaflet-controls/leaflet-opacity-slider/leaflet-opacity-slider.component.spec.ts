import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LeafletOpacitySliderComponent } from './leaflet-opacity-slider.component';

describe('LeafletOpacitySliderComponent', () => {
  let component: LeafletOpacitySliderComponent;
  let fixture: ComponentFixture<LeafletOpacitySliderComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ LeafletOpacitySliderComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LeafletOpacitySliderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
