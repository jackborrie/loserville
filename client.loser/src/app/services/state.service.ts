import {EventEmitter, Injectable} from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class StateService {

    public runningTotal = 0;
    private currentUserId: string | null = null;

    private wasCommanderDamage: boolean = false;

    protected timeout: any;

    public $onRunningTotalChanged: EventEmitter<number> = new EventEmitter();

    constructor() {
    }

    public addAmount (amount: number, against: string, commander: boolean = false) {
        if (this.wasCommanderDamage != commander || (this.currentUserId != null && this.currentUserId != against)) {
            this.runningTotal = amount;
        } else {
            this.runningTotal += amount;
        }
        
        this.wasCommanderDamage = commander;
        this.currentUserId = against;

        this.$onRunningTotalChanged.emit(this.runningTotal);

        if (this.timeout != null) {
            clearTimeout(this.timeout);
        }

        this.timeout = setTimeout(() => {
            this.runningTotal = 0;
            this.$onRunningTotalChanged.emit(this.runningTotal);
        }, 2000)
    }


}
