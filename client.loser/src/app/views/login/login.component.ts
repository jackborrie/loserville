import {Component, OnDestroy, OnInit} from '@angular/core';
import {FormsModule} from "@angular/forms";
import {NgIf} from "@angular/common";
import {WebsocketService} from "../../services/websocket.service";
import {Subscription} from "rxjs";

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [
        FormsModule,
        NgIf
    ],
    templateUrl: './login.component.html',
    styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit, OnDestroy {

    protected name: string = '';

    protected loginFailed: boolean = false;

    private subscriptions: Subscription = new Subscription();

    public constructor(
        private _websocket: WebsocketService
    ) {

    }

    ngOnInit() {
        let ws = this._websocket.$loginFailed.subscribe(d => {
            this.loginFailed = d;
        })

        this.subscriptions.add(ws);
    }

    ngOnDestroy() {
        this.subscriptions.unsubscribe();
    }


    protected joinGame() {
        this._websocket.attemptJoin(this.name);
    }
}
