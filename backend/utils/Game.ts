import FuncCalculator = require('./FuncCalculator');
import { FieldInterface, GameInterface, ObjectInterface, PlayerInterface, PointInterface } from './interfaces';
import Player = require('./Player');
import {Ellipse, Rectangle, Point, DamageCircle, Line} from './Shape';
const MyLogger = require('../logs/logger.js');

module.exports = class Game {
    private players: Player[];
    private objects: (Rectangle | Ellipse)[];
    private currentPlayer: Player;
    private lastFunction: string | undefined;
    private field: FieldInterface;
    private uuid: string;
    private sockets: any[];
    private gameOver = false;
    constructor(
        players: PlayerInterface[],
        objects: ObjectInterface[],
        field: FieldInterface,
        sockets: any[],
        currentPlayer?: PlayerInterface
    ) {
        //TODO sockets are not part of frontend, there is nothing to do with this on backend
        this.players = players.map(
            player => new Player(new Point(player.location.x, player.location.y), player.id, player.name)
        );
        this.objects = objects.map(object => {
            if (object.type === 'Rectangle') {
                return new Rectangle(new Point(object.location.x, object.location.y), {
                    width: object.dimension.width,
                    height: object.dimension.height,
                });
            } else {
                return new Ellipse(new Point(object.location.x, object.location.y), {
                    width: object.dimension.width,
                    height: object.dimension.height,
                });
            }
        });
        this.uuid = `game-${field.id}-${players.map(player => player.id).join('')}`;
        this.field = field;
        this.currentPlayer =
            currentPlayer !== undefined
                ? new Player(
                      new Point(currentPlayer.location.x, currentPlayer.location.y),
                      currentPlayer.id,
                      currentPlayer.name
                  )
                : this.players[0];
        this.sockets = sockets;
    }

    public changeCurrentPlayer(): void {
        const currentPlayerIndex = this.players.findIndex(player => player.ID === this.currentPlayer.ID);
        this.currentPlayer = this.players[(currentPlayerIndex + 1) % this.players.length];
    }

    public async submitFunction(func: string): Promise<void> {
        const funcCalculator = new FuncCalculator(func, this.currentPlayer.Location.x, this.currentPlayer.Location.y);
        if (!funcCalculator.isValidFunction()) {
            throw new Error('Invalid function');
        } else {
            this.lastFunction = func;
        }
    }

    public async calculateFunctionPoints(): Promise<{
        points: { leftSide: PointInterface[]; rightSide: PointInterface[] };
        damages: {
            leftSide?: { location: PointInterface; radius: number } | null;
            rightSide?: { location: PointInterface; radius: number } | null;
        };
    }> {
        if (!this.lastFunction) {
            throw new Error('No function were submitted');
        }
        const funcCalculator = new FuncCalculator(
            this.lastFunction,
            this.currentPlayer.Location.x,
            this.currentPlayer.Location.y
        );
        let leftSide = await funcCalculator.calculateLeftSidePoints();
        let rightSide = await funcCalculator.calculateRightSidePoints();
        let damages: {
            leftSide?: { location: PointInterface; radius: number } | null;
            rightSide?: { location: PointInterface; radius: number } | null;
        } = {};
        const maxLen = Math.max(leftSide.length, rightSide.length);
        for (let i = 0; i < maxLen; i++) {
            if (i < leftSide.length) {
                if (await this.isGameOver(leftSide[i])) {
                    leftSide = leftSide.slice(0, i);
                    rightSide = rightSide.slice(0, i > rightSide.length ? undefined : i);
                } else if (await this.checkObjectCollision(leftSide[i])) {
                    leftSide = leftSide.slice(0, i+1);
                    damages.leftSide = await this.damageObject(
                        leftSide[i],
                        await funcCalculator.distanceFromOrigo(new Point(leftSide[i].x, leftSide[i].y))
                    );
                }
            }
            if (i < rightSide.length) {
                if (await this.isGameOver(rightSide[i])) {
                    leftSide = leftSide.slice(0, i > leftSide.length ? undefined : i);
                    rightSide = rightSide.slice(0, i);
                } else if (await this.checkObjectCollision(rightSide[i])) {
                    rightSide = rightSide.slice(0, i+1);
                    damages.rightSide = await this.damageObject(
                        rightSide[i],
                        await funcCalculator.distanceFromOrigo(new Point(rightSide[i].x, rightSide[i].y))
                    );
                }
            }
        }
        MyLogger('functionCalculations/', { gameOver: this.gameOver, leftSide, rightSide });
        return { points: { leftSide, rightSide }, damages };
    }

    private async checkObjectCollision(point: PointInterface): Promise<boolean> {
        for await (const object of this.objects) {
            if (await object.pointInside(new Point(point.x, point.y))) {
                return true;
            }
        }
        return false;
    }
    private async damageObject(
        point: PointInterface,
        distance: number
    ): Promise<{ location: PointInterface; radius: number } | null> {
        let damage = null;
        try {
            this.objects = await Promise.all(
                this.objects.map(async object => {
                    if (await object.pointInside(new Point(point.x, point.y))) {
                        damage = object.damageMe(new Point(point.x, point.y), distance).toJSON();
                    }
                    return object;
                })
            );
        } catch (e) {
            console.error(e);
        }
        return damage;
    }

    get prevPlayer(): Player {
        const index = this.players.findIndex(player => player.ID === this.currentPlayer.ID);
        const prevPlayer = this.players[(index - 1 + this.players.length) % this.players.length];
        return prevPlayer;
    }

    public toFrontend(): GameInterface {
        return {
            players: this.players.map(player => player.toJSON()),
            objects: this.objects.map(object => object.toJSON()),
            currentPlayer: this.currentPlayer.toJSON(),
            lastFunction: this.lastFunction,
            field: this.field,
            uuid: this.uuid,
        };
    }

    public static async makeGameFromField(
        field: FieldInterface,
        players: { id: number; name: string }[],
        sockets: any[]
    ): Promise<Game> {
        //TODO sockets are not part of frontend, there is nothing to do with this on backend
        const playerInterfaces: PlayerInterface[] = await Promise.all(
            players.map((player, index) => {
                const playerInterface: PlayerInterface = {
                    id: player.id,
                    name: player.name,
                    location: field.field.players[index].location,
                    dimension: field.field.players[index].dimension,
                    avoidArea: field.field.players[index].avoidArea,
                };
                return playerInterface;
            })
        );
        return new Game(playerInterfaces, field.field.objects, field, sockets);
    }

    private async isGameOver(point: PointInterface): Promise<boolean> {
        await Promise.all(
            this.players.map(async player => {
                if (!this.gameOver && player.ID !== this.currentPlayer.ID) {
                    if (await player.pointInside(new Point(point.x, point.y))) {
                        this.gameOver = true;
                    }
                }
            })
        );
        return this.gameOver;
    }

    get CurrentPlayer(): Player {
        return this.currentPlayer;
    }

    get Players(): Player[] {
        return this.players;
    }
    get Objects(): Object[] {
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

    get GameOver(): boolean {
        return this.gameOver;
    }
};
