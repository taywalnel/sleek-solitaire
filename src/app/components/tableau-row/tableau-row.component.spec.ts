import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TableauRowComponent } from './tableau-row.component';

describe('TableauRowComponent', () => {
  let component: TableauRowComponent;
  let fixture: ComponentFixture<TableauRowComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TableauRowComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TableauRowComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
