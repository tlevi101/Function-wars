import FuncCalculator = require("./FuncCalculator");
import {FieldInterface, GameInterface, ObjectInterface, PlayerInterface, Point} from "./interfaces";
import {Primitive} from "sequelize/types/utils";

module.exports = class Game {
    private players: PlayerInterface[];
    private objects: ObjectInterface[];
    private currentPlayer: PlayerInterface;
    private lastFunction: string | undefined
    private field: FieldInterface;
    private uuid: string;
    private sockets: any[];
    constructor(
        players: PlayerInterface[],
        objects: ObjectInterface[],
        field: FieldInterface,
        sockets: any[],
        currentPlayer?: PlayerInterface,
    ) {
        //TODO sockets are not part of frontend, there is nothing to do with this on backend
        this.players = players;
        this.objects = objects;
        this.uuid = `game-${field.id}-${players.map(player => player.id).join('')}`;
        this.field = field;
        this.currentPlayer = currentPlayer || players[0];
        this.sockets = sockets;
    }



    public changeCurrentPlayer(): void {
        const currentPlayerIndex = this.players.findIndex(player => player.id === this.currentPlayer.id);
        this.currentPlayer = this.players[(currentPlayerIndex + 1) % this.players.length];
    }

    public async  submitFunction(func: string): Promise<void> {
        const funcCalculator = new FuncCalculator(func, this.currentPlayer.location.x, this.currentPlayer.location.y);
        if(!funcCalculator.isValidFunction()){
            throw new Error('Invalid function');
        }else{
            this.lastFunction = func;
        }
    }

     public async calculateFunctionPoints(): Promise<{leftSide: Point[], rightSide: Point[]}> {
        if(!this.lastFunction){
            throw new Error('No function were submitted');
        }
        const funcCalculator = new FuncCalculator(this.lastFunction, this.currentPlayer.location.x, this.currentPlayer.location.y);
        const leftSide = await funcCalculator.calculateLeftSidePoints();
        const rightSide = await funcCalculator.calculateRightSidePoints();
        return {leftSide, rightSide};
    }

    get prevPlayer() : PlayerInterface{
        const index = this.players.findIndex(player => player.id === this.currentPlayer.id);
        const prevPlayer  =  this.players[(index - 1 + this.players.length) % this.players.length];
        return prevPlayer;
    }

    public toFrontend(): GameInterface {
        return {
            players: this.players,
            objects: this.objects,
            currentPlayer: this.currentPlayer,
            lastFunction: this.lastFunction,
            field: this.field,
            uuid: this.uuid
        }
    }



    public static async makeGameFromField(field: FieldInterface, players: {id:number, name:string}[], sockets:any[]): Promise<Game> {
        //TODO sockets are not part of frontend, there is nothing to do with this on backend
        const playerInterfaces: PlayerInterface[] = await Promise.all(players.map((player, index) => {
            const playerInterface: PlayerInterface = {
                id: player.id,
                name: player.name,
                location: field.field.players[index].location,
                dimension: field.field.players[index].dimension,
                avoidArea: field.field.players[index].avoidArea
            }
            return playerInterface;
        }));
        return new Game(playerInterfaces, field.field.objects, field, sockets);
    }

    public static async initFromGame(game: Game): Promise<Game> {
        //TODO sockets are not part of frontend, there is nothing to do with this on backend
        return new Game(game.players, game.objects, game.field, game.sockets, game.currentPlayer);
    }

    get gameOver(): boolean {
        //TODO implement this
        return false;
    }

    get CurrentPlayer(): PlayerInterface {
        return this.currentPlayer;
    }

    get Players(): PlayerInterface[] {
        return this.players;
    }
    get Objects(): ObjectInterface[] {
        return this.objects;
    }
    get Field(): FieldInterface {
        return this.field;
    }
    get Sockets(): any[] {
        //TODO sockets are not part of frontend, there is nothing to do with this on backend
        return this.sockets;
    }
    get UUID(): string {
        return this.uuid;
    }
}
