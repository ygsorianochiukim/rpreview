import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Templogin } from './templogin';

describe('Templogin', () => {
  let component: Templogin;
  let fixture: ComponentFixture<Templogin>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Templogin]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Templogin);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
