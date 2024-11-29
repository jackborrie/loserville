import {Component, Input, OnDestroy, OnInit, output} from '@angular/core';
import {User} from "../../models/user";
import {NgClass, NgForOf, NgIf, NgStyle} from "@angular/common";
import {WebsocketService} from "../../services/websocket.service";

@Component({
  selector: 'app-user[user]',
  standalone: true,
    imports: [
        NgClass,
        NgStyle,
        NgForOf,
        NgIf
    ],
  templateUrl: './user.component.html',
  styleUrl: './user.component.scss'
})
export class UserComponent implements OnInit, OnDestroy {

    @Input()
    public user!: User;

    @Input()
    public currentUser: boolean = false;

    protected players: User[] = [];

    protected currentCommanderIdx = 0;

    public constructor(
        private _websocket: WebsocketService
    ) {
    }

    public genBackground () {
        let gradient = [];if (this.user.red) {
            gradient.push('#f9aa8f');
        }
        if (this.user.white) {
            gradient.push('#fffbd5');
        }
        if (this.user.black) {
            gradient.push('black');
        }
        if (this.user.blue) {
            gradient.push('#aae0fa');
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
            return 'var(--foreground-0)';
        }
    }

    protected changeLife (amount: number) {
        let lifeMessage = {
            amount: amount,
            target_id: this.user.id,
            type: 'life'
        }

        this._websocket.sendMessage(lifeMessage);
    }

    protected changeCommander (commanderId: string, amount: number) {
        let message = {
            type: 'commander',
            target_id: this.user.id,
            commander_id: commanderId,
            amount: amount
        }

        this._websocket.sendMessage(message);
    }

    ngOnDestroy(): void {
    }

    ngOnInit(): void {
        this._websocket.$gameState.subscribe(() => {
            this.players = this._websocket.getAllPlayers().filter(s => s.id != this.user.id);
        })
    }

    protected takeMonarch () {
        this._websocket.sendMessage({type: 'monarch', target_id: this.user?.id});
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
