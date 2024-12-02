import {Component, Input, OnDestroy, OnInit, Output, EventEmitter} from '@angular/core';
import {User} from "../../models/user";
import {NgClass, NgForOf, NgIf, NgOptimizedImage, NgStyle} from "@angular/common";
import {WebsocketService} from "../../services/websocket.service";
import {Subscription} from "rxjs";
import {environment} from "../../../environments/environment";
import {StateService} from "../../services/state.service";


@Component({
  selector: 'app-user[user]',
  standalone: true,
    imports: [
        NgClass,
        NgStyle,
        NgForOf,
        NgIf,
        NgOptimizedImage
    ],
  templateUrl: './user.component.html',
  styleUrl: './user.component.scss'
})
export class UserComponent implements OnInit, OnDestroy {

    @Input()
    public user!: User;

    @Input()
    public currentUser: boolean = false;

    @Output()
    public changeCommanderClick = new EventEmitter<User>();

    protected players: User[] = [];

    protected apiUrl: string;

    protected currentCommanderIdx = 0;

    private _subscription: Subscription = new Subscription();

    public constructor(
        private _websocket: WebsocketService,
        private _state: StateService
    ) {
        this.apiUrl = environment.apiUrl;
    }

    public genBackground () {
        let gradient = [];if (this.user.red) {
            gradient.push('#f9aa8f');
        }
        if (this.user.black) {
            gradient.push('black');
        }
        if (this.user.blue) {
            gradient.push('#aae0fa');
        }
        if (this.user.white) {
            gradient.push('#fffbd5');
        }
        if (this.user.green) {
            gradient.push('#9bd3ae');
        }

        if (this.user.colorless) {
            gradient.push('#ccc2c0');
        }

        if (gradient.length > 1) {

            let output = 'linear-gradient(to bottom, ';

            for (let gIdx = 0; gIdx < gradient.length; gIdx++) {
                output += gradient[gIdx];

                if (gIdx < gradient.length - 1) {
                    output += ',';
                }
            }

            output += ')';
            return output;
        } else if (gradient.length == 1) {
            return gradient;
        } else {
            // return 'var(--foreground-0)';
            return ''
        }
    }

    protected toggleMana (manaColor: string) {
        let message = {
            type: 'color',
            target_id: this.user.id
        }

        // @ts-ignore
        message[manaColor] = !this.user[manaColor];

        this._websocket.sendMessage(message);
    }

    protected changeLife (amount: number) {
        let lifeMessage = {
            amount: amount,
            target_id: this.user.id,
            type: 'life'
        }

        this._state.addAmount(amount, this.user.id);

        this._websocket.sendMessage(lifeMessage);
    }

    protected changeCommander (commanderId: string, amount: number) {
        let message = {
            type: 'commander',
            target_id: this.user.id,
            commander_id: commanderId,
            amount: amount
        }

        this._state.addAmount(amount, this.user.id, true);

        this._websocket.sendMessage(message);
    }

    ngOnDestroy(): void {
        this._subscription.unsubscribe();
    }

    ngOnInit(): void {
        const s = this._websocket.$gameState.subscribe(() => {
            this.players = this._websocket.getAllPlayers().filter(s => s.id != this.user.id);
        });

        this._subscription.add(s);
    }

    protected takeMonarch () {
        this._websocket.sendMessage({type: 'monarch', target_id: this.user?.id});
    }

    protected handleChangeCommanderImages () {
        this.changeCommanderClick.emit(this.user);
    }

    protected changeCurrentCommander (by: number) {
        this.currentCommanderIdx += by;

        if (this.currentCommanderIdx <= 0) {
            this.currentCommanderIdx = 0;
        }

        if (this.currentCommanderIdx > this.user.commanderImages.length - 1) {
            this.currentCommanderIdx = this.user.commanderImages.length - 1;
        }
    }
}
