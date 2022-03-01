import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LeafletImageExportComponent } from './leaflet-image-export.component';

describe('LeafletImageExportComponent', () => {
  let component: LeafletImageExportComponent;
  let fixture: ComponentFixture<LeafletImageExportComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ LeafletImageExportComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LeafletImageExportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
