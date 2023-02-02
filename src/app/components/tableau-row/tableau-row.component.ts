import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-tableau-row',
  templateUrl: './tableau-row.component.html',
  styleUrls: ['./tableau-row.component.scss']
})
export class TableauRowComponent implements OnInit {
  @Input() cards: { suit: string, value: string, location: string }[] = [];

  constructor() { }

  ngOnInit(): void {
  }

}
