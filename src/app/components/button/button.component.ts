import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { fromEvent } from 'rxjs';

@Component({
  selector: 'app-button',
  templateUrl: './button.component.html',
  styleUrls: ['./button.component.scss'],
})
export class ButtonComponent implements AfterViewInit {
  @Input() imageSrc: string;
  @Input() useAnimation = false;
  @Output() clickEmitter = new EventEmitter();

  rotateImageStyling: string = '';
  rotationCount = 0;

  @ViewChild('button') button: ElementRef;

  constructor() {}

  ngAfterViewInit() {
    if (this.useAnimation) {
      fromEvent(this.button.nativeElement, 'click').subscribe(() => {
        this.rotationCount = this.rotationCount - 180;
        this.rotateImageStyling = `rotate(${this.rotationCount}deg)`;
      });
    }
  }

  clickHandler() {
    this.clickEmitter.emit();
  }
}
