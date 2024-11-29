export class User {

    public id: string;
    public life: number = 40;
    public monarch: boolean = false;
    public name: string;
    public order: boolean = false;
    public blue: boolean = false;
    public red: boolean = false;
    public green: boolean = false;
    public black: boolean = false;
    public white: boolean = false;
    public colorless: boolean = false;
    public commanderImages: string[] = [];

    public commanderDamage: {[key: string]: number} = {}

    public constructor(data: any) {
        this.id = data.id;
        this.life = data.life;
        this.monarch = data.monarch;
        this.name = data.name;
        this.order = data.order;
        this.blue = data.blue;
        this.red = data.red;
        this.green = data.green;
        this.black = data.black;
        this.white = data.white;
        this.colorless = data.colorless;
        this.commanderDamage = data.commander_damage;
        this.commanderImages = data.commander_images;

        this.genColors();
    }

    private genColors () {
        this.genColor('red');
        this.genColor('blue');
        this.genColor('green');
        this.genColor('black');
        this.genColor('white');
        this.genColor('white');
    }

    private genColor (color: string) {
        let result = Math.floor(Math.random() * (100 - 0 + 1) + 0);

        // @ts-ignore
        this[color] = result < 50;
    }
}
