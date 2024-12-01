import {Injectable} from '@angular/core';
import {BehaviorSubject, Subject} from "rxjs";
import {webSocket, WebSocketSubject} from "rxjs/webSocket";
import {Router} from "@angular/router";
import {ResponseModel} from "../models/response";
import {User} from "../models/user";
import {environment} from "../../environments/environment";

@Injectable({
    providedIn: 'root'
})
export class WebsocketService {

    public $loginFailed: Subject<boolean> = new BehaviorSubject(false);

    public $gameState: Subject<any> = new BehaviorSubject(false);

    private websocket: WebSocketSubject<any> | null = null;

    private apiUrl: string;

    private players: User[] = [];

    private _loggedIn: boolean = false;

    constructor(
        private _router: Router
    ) {
        this.apiUrl = environment.apiUrl;
    }

    public attemptJoin(name: string) {
        this.websocket = webSocket(this.apiUrl + 'game/ws');

        this.websocket.subscribe ({
            next: (msg: any) => this.handleMessage(msg),
            error: err => {
                this.websocket?.complete();
                this.websocket = null;
                this.$loginFailed.next(true);
            },
            complete: () => {
                this.websocket = null;
            }
        });

        const nameMessage = {
            type: 'name',
            name: name
        }

        this.websocket.next(nameMessage);
    }

    public getPlayerById (userId: string): User | undefined {
        return this.players.find(p => p.id == userId);
    }

    public getAllPlayers () : User[] {
        return this.players;
    }

    private handleMessage (msg: any) {
        if (!this._loggedIn) {
            this.$loginFailed.next(false);
            this._router.navigate(['game']);
            this._loggedIn = true;
        }

        let message = new ResponseModel(msg);

        this.players = [];
        this.players.push(message.user);

        this.players.push(...message.players);

        this.$gameState.next(message);
    }

    public sendMessage (message: any) {
        if (message.type == null) {
            return;
        }

        if (this.websocket == null) {
            return;
        }

        this.websocket.next(message);
    }

    public get loggedIn () {
        return this._loggedIn;
    }
}
