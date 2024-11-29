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
            this.images = data.images;

            this.addLog(data.gameLog);
        });

        this._subscriptions.add(sub);
    }

    ngOnDestroy() {
        this._subscriptions.unsubscribe();
    }

    protected restartGame () {
        this._websocket.sendMessage({type: 'restart'});
    }

    protected getAllPlayers (): User[] {
        let output = [];

        if (this.user != null) {
            output.push(this.user);
        }

        if (this.players != null) {
            output.push(...this.players);
        }

        return output;
    }

    protected getUsersInOrder (): User[] {
        if (this.players == null || this.user == null) {
            return [];
        }
        let toSort: User[] = [this.user];

        toSort.push(...this.players)

        return toSort.sort((a, b) => a.order > b.order ? 1 : -1);
    }

    private addLog (gameLog: string[]) {
        this.log = [];

        for (let i = gameLog.length - 1; i >= 0; i--) {
            this.log.push(this.replaceIds(gameLog[i]));
        }
    }

    private replaceIds (text: string): string {
        const idRegex = /\[.*?\]/g

        if (!idRegex.test(text) || this.user == null || this.players == null) {
            return text;
        }

        text = text.replaceAll(`[${this.user.id}]`, this.user.name);

        for (let player of this.players) {
            text = text.replaceAll(`[${player.id}]`, player.name);
        }

        return text;
    }
}
