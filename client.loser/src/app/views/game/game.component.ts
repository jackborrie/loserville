import {Component, OnDestroy, OnInit} from '@angular/core';
import {WebsocketService} from "../../services/websocket.service";
import {Router} from "@angular/router";
import {User} from "../../models/user";
import {ResponseModel} from "../../models/response";
import {Subscription} from "rxjs";
import {NgForOf, NgIf} from "@angular/common";
import {UserComponent} from "../../components/user/user.component";
import {HttpClient} from "@angular/common/http";
import {FormsModule} from "@angular/forms";

@Component({
  selector: 'app-game',
  standalone: true,
    imports: [
        NgIf,
        UserComponent,
        NgForOf,
        FormsModule
    ],
  templateUrl: './game.component.html',
  styleUrl: './game.component.scss'
})
export class GameComponent implements OnInit, OnDestroy {

    protected user: User | undefined;
    protected players: User[] | undefined;
    protected log: string[] = [];
    protected commanderImages: string[] = [];

    protected isCommander: boolean = false;

    protected image: string = '';

    protected showAddNewModal: boolean = false;

    private formData: FormData | null = null;

    private _subscriptions: Subscription = new Subscription();

    public constructor(
        private _websocket: WebsocketService,
        private _router: Router,
        private _request: HttpClient
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
            this.commanderImages = data.commanderImages;
        });

        this._subscriptions.add(sub);
    }

    ngOnDestroy() {
        this._subscriptions.unsubscribe();
    }

    protected restartGame () {
        this._websocket.sendMessage({type: 'restart'});
    }

    protected getPlayersInOrder () {
        let players = this._websocket.getAllPlayers();
        if (players == null) {
            return;
        }
        let sorted = players.sort ((a, b) => a.order - b.order);

        return sorted;
    }

    protected replaceIds (logItem: string) {
        for (let player of this._websocket.getAllPlayers()) {
            logItem = logItem.replace(`[${player.id}]`, player.name);
        }

        return logItem;
    }

    protected handleImageUpload (event: any) {

        const file:File = event.target.files[0];

        this.formData = new FormData();

        this.formData.append("file", file);
    }

    protected handleHover(image: string) {
        this.image = image;
    }

    protected uploadImage () {
        let url = 'http://163.47.239.93:5271/game/image/';

        url += this.isCommander ? 'commander' : 'notable';

        const upload$ = this._request.post(url, this.formData);

        upload$.subscribe(() => {
            this.formData = null;
            this.isCommander = false;
            this.showAddNewModal = false;
        });
    }
}
