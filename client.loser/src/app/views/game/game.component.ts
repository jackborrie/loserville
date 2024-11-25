import {Component, OnDestroy, OnInit} from '@angular/core';
import {WebsocketService} from "../../services/websocket.service";
import {Router} from "@angular/router";
import {User} from "../../models/user";
import {ResponseModel} from "../../models/response";
import {Subscription} from "rxjs";
import {NgForOf, NgIf} from "@angular/common";
import {UserComponent} from "../../components/user/user.component";

@Component({
  selector: 'app-game',
  standalone: true,
    imports: [
        NgIf,
        UserComponent,
        NgForOf
    ],
  templateUrl: './game.component.html',
  styleUrl: './game.component.scss'
})
export class GameComponent implements OnInit, OnDestroy {

    protected user: User | undefined;
    protected players: User[] | undefined;
    protected log: string[] = [];
    protected images: string[] = [];

    private _subscriptions: Subscription = new Subscription();

    public constructor(
        private _websocket: WebsocketService,
        private _router: Router
    ) {

    }

    ngOnInit() {
        if (!this._websocket.loggedIn) {
            this._router.navigate(['']);
            return;
        }

        let sub = this._websocket.$gameState.subscribe((data: ResponseModel) => {
            this.user = data.user;
            this.players = data.players;
            this.log = data.gameLog;
            this.images = data.images;
        });

        this._subscriptions.add(sub);
    }

    ngOnDestroy() {
        this._subscriptions.unsubscribe();
    }

    protected restartGame () {
        this._websocket.sendMessage({type: 'restart'});
    }

    protected takeMonarch () {
        this._websocket.sendMessage({type: 'monarch', target_id: this.user?.id});
    }
}
