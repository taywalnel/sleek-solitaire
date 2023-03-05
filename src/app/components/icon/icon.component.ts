import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-icon',
  templateUrl: './icon.component.html',
  styleUrls: ['./icon.component.scss'],
})
export class IconComponent implements OnInit {
  @Input() imageSrc: string;
  @Input() imageRotation = 0;
  @Input() invertColors = false;

  get rotationElementStyle() {
    return `rotate(${this.imageRotation}deg)`;
  }

  constructor() {}

  ngOnInit(): void {}
}
