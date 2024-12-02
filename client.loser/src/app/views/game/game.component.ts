import {Component, OnDestroy, OnInit} from '@angular/core';
import {WebsocketService} from "../../services/websocket.service";
import {Router} from "@angular/router";
import {User} from "../../models/user";
import {ResponseModel} from "../../models/response";
import {Subscription} from "rxjs";
import {NgForOf, NgIf} from "@angular/common";
import {UserComponent} from "../../components/user/user.component";
import {environment} from "../../../environments/environment";
import {DragDropnDirective, FileHandle} from "../../directives/drag-dropn.directive";
import {HttpClient} from "@angular/common/http";
import {StateService} from "../../services/state.service";

@Component({
    selector: 'app-game',
    standalone: true,
    imports: [
        UserComponent,
        NgForOf,
        NgIf,
        DragDropnDirective
    ],
    templateUrl: './game.component.html',
    styleUrl: './game.component.scss'
})
export class GameComponent implements OnInit, OnDestroy {

    protected user: User | undefined;
    protected players: User[] | undefined;
    protected log: string[] = [];
    protected commanderImages: string[] = [];
    protected apiUrl: string;

    protected showChangeCommanderModal: boolean = false;
    protected currentModalUser: User | null = null;
    protected showUploadModal: boolean = false;
    protected showCardModal: boolean = false;

    protected currentUserCommanders: { [key: string]: boolean } = {};

    protected files: FileHandle[] = [];

    protected runningTotal: number = 0;

    private _subscriptions: Subscription = new Subscription();


    public constructor(
        private _websocket: WebsocketService,
        private _router: Router,
        private _http: HttpClient,
        private _state: StateService
    ) {
        this.apiUrl = environment.apiUrl;
    }

    ngOnInit() {
        if (!this._websocket.loggedIn) {
            this._router.navigate(['']);
            return;
        }

        let sub = this._websocket.$gameState.subscribe((data: ResponseModel) => {
            this.user = data.user;
            this.players = data.players;
            this.commanderImages = data.commanderImages;

            this.addLog(data.gameLog);
        });

        let state = this._state.$onRunningTotalChanged
            .subscribe(runningTotal => {
                this.runningTotal = runningTotal;
            })

        this._subscriptions.add(sub);
        this._subscriptions.add(state);
    }

    ngOnDestroy() {
        this._subscriptions.unsubscribe();
    }

    protected restartGame() {
        this._websocket.sendMessage({type: 'restart'});
    }

    protected getAllPlayers(): User[] {
        let output = [];

        if (this.user != null) {
            output.push(this.user);
        }

        if (this.players != null) {
            output.push(...this.players);
        }

        return output;
    }

    protected getUsersInOrder(): User[] {
        if (this.players == null || this.user == null) {
            return [];
        }
        let toSort: User[] = [this.user];

        toSort.push(...this.players)

        return toSort.sort((a, b) => a.order > b.order ? 1 : -1);
    }

    protected handleUserCommanderClick(user: User) {
        this.clearModals();

        this.showChangeCommanderModal = true;
        this.currentModalUser = user;
        this.currentUserCommanders = {};

        for (let img of user.commanderImages) {
            this.currentUserCommanders[img] = true;
        }
    }

    protected clearModals() {
        this.showChangeCommanderModal = false;
        this.currentModalUser = null;
        this.showCardModal = false;
        this.showUploadModal = false;
    }

    protected saveChanges() {
        if (this.currentModalUser == null) {
            return;
        }

        let message = {
            type: 'commander_change',
            target_id: this.currentModalUser.id,
            commander_images: Object.keys(this.currentUserCommanders)
        }

        this._websocket.sendMessage(message);
    }

    protected toggleCommander(event: Event, image: string) {
        event.stopPropagation();

        if (this.currentUserCommanders[image]) {
            delete this.currentUserCommanders[image];
        } else {
            this.currentUserCommanders[image] = true;
        }
    }

    protected filesDropped(files: FileHandle[]) {
        this.files = files;
    }

    protected uploadImages (event: Event, type: string) {
        event.stopPropagation();
        for (let file of this.files) {
            this.uploadImage(file.file, type);
        }
    }

    protected uploadImage (file: File, type: string) {
        const formData = new FormData();

        formData.append('file', file);
        this._http.post(this.apiUrl + 'game/image/' + type, formData)
            .subscribe(() => {
                this.showUploadModal = false;
                this.files = [];
            }, () => {
                this.showUploadModal = false;
                this.files = [];
            })
    }

    private addLog(gameLog: string[]) {
        this.log = [];

        for (let i = gameLog.length - 1; i >= 0; i--) {
            this.log.push(this.replaceIds(gameLog[i]));
        }
    }

    private replaceIds(text: string): string {
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
