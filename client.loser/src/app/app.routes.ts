import { Routes } from '@angular/router';
import {LoginComponent} from "./views/login/login.component";
import {GameComponent} from "./views/game/game.component";

export const routes: Routes = [
  {
    path: '',
    component: LoginComponent,
    pathMatch: 'full'
  },
  {
    path: 'game',
    component: GameComponent
  }
];
