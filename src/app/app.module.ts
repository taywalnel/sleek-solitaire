import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { CardPileComponent } from './components/card-pile/card-pile.component';
import { CardComponent } from './components/card/card.component';
import { HeaderBarComponent } from './components/header-bar/header-bar.component';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { GameWonModalComponent } from './components/game-won-modal/game-won-modal.component';

@NgModule({
  declarations: [
    AppComponent,
    CardPileComponent,
    CardComponent,
    HeaderBarComponent,
    GameWonModalComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    MatSlideToggleModule,
    BrowserAnimationsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
