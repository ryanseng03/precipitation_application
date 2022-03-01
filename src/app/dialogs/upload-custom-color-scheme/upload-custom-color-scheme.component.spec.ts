import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { UploadCustomColorSchemeComponent } from './upload-custom-color-scheme.component';

describe('UploadCustomColorSchemeComponent', () => {
  let component: UploadCustomColorSchemeComponent;
  let fixture: ComponentFixture<UploadCustomColorSchemeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ UploadCustomColorSchemeComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UploadCustomColorSchemeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
