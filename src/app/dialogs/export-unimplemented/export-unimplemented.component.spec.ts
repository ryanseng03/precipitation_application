import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ExportUnimplementedComponent } from './export-unimplemented.component';

describe('ExportUnimplementedComponent', () => {
  let component: ExportUnimplementedComponent;
  let fixture: ComponentFixture<ExportUnimplementedComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ExportUnimplementedComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ExportUnimplementedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
