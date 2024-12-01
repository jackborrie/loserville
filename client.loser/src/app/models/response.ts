import {User} from "./user";

export class ResponseModel {
    id!: string;
    players: User[] = [];
    user!: User;
    gameLog: string[] = [];
    commanderImages: string[] = [];
    otherImages: string[] = [];

    public constructor(data: any) {
        this.id = data.id;

        for (let p of data.players) {
            let player = new User(p);

            this.players.push(player);
        }

        this.user = new User(data.user);
        this.commanderImages = data.commander_images;
        this.otherImages = data.other_images;
        this.gameLog = data.game_log;
    }

}
