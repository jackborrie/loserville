import {EventEmitter, Injectable} from '@angular/core';
import {WebsocketService} from "./websocket.service";

export type CommanderRunningTotal = {
    runningTotal: number,
    timeout?: NodeJS.Timeout
}

export type UserLifeRunningTotal = {
    runningTotal: number,
    timeout?: NodeJS.Timeout,
    commander?: {[key: string]: CommanderRunningTotal}
}

export type RunningTotal = {
    [key: string]: UserLifeRunningTotal
}

export type RunningTotalEvent = {
    targetId: string,
    commanderId?: string | null,
    amount: number,
    isCommander: boolean
}

@Injectable({
    providedIn: 'root'
})
export class StateService {

    private damage: RunningTotal = {};

    public $onRunningTotalChanged: EventEmitter<RunningTotalEvent> = new EventEmitter();

    constructor(
        private _websocket: WebsocketService
    ) {
    }

    public addCommanderDamage (amount: number, against: string, commanderId: string) {
        if (this.damage[against] == null) {
            this.damage[against] = {
                runningTotal: 0
            };
        }

        if (this.damage[against].commander == null) {
            this.damage[against].commander = {}
        }

        if (this.damage[against].commander[commanderId] == null) {
            this.damage[against].commander[commanderId] = {
                runningTotal: amount
            }
        } else {
            this.damage[against].commander[commanderId].runningTotal += amount;
        }

        if (this.damage[against].commander[commanderId].timeout != null) {
            clearTimeout(this.damage[against].commander[commanderId].timeout);
        }

        this.damage[against].commander[commanderId].timeout = setTimeout(() => {
            if (this.damage[against].commander == null || this.damage[against].commander[commanderId].runningTotal == 0) {
                return;
            }

            let message: any = {
                type: 'commander',
                target_id: against,
                commander_id: commanderId,
                amount: this.damage[against].commander[commanderId].runningTotal
            };

            this._websocket.sendMessage(message);

            this.damage[against].commander[commanderId].runningTotal = 0;
            this.$onRunningTotalChanged.emit({targetId: against, commanderId: commanderId, amount: 0, isCommander: true});
        }, 1000);


        return this.damage[against].commander[commanderId].runningTotal;
    }

    public addDamage (amount: number, against: string) {
        if (this.damage[against] == null) {
            this.damage[against] = {
                runningTotal: amount
            };
        } else {
            this.damage[against].runningTotal += amount;
        }

        if (this.damage[against].timeout != null) {
            clearTimeout(this.damage[against].timeout);
        }

        this.damage[against].timeout = setTimeout(() => {
            if (this.damage[against].runningTotal == 0) {
                return;
            }

            let message: any = {
                type: 'life',
                target_id: against,
                amount: this.damage[against].runningTotal
            };

            this._websocket.sendMessage(message);

            this.damage[against].runningTotal = 0;
            this.$onRunningTotalChanged.emit({targetId: against, amount: 0, isCommander: false});
        }, 1000);

        return this.damage[against].runningTotal;
    }

    public addAmount (amount: number, against: string, commander: boolean = false, commanderId: string | null = null) {
        let id = '';
        let cid: string | null = null;
        let running = 0;
        if (commander) {
            if (commanderId == null) {
                return;
            } else {
                running = this.addCommanderDamage(amount, against, commanderId);
                id = against;
                cid = commanderId
            }
        } else {
            running = this.addDamage(amount, against);
            id = against;
        }

        this.$onRunningTotalChanged.emit({targetId: id, commanderId: cid, amount: running, isCommander: commander});
    }


}
