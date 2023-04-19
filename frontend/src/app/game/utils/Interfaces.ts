export interface Point {
    x: number;
    y: number;
}

export interface PlayerInterface {
    id: number;
    name: string;
    location: { x: number; y: number };
    dimension: { width: number; height: number };
    avoidArea: { location: { x: number; y: number }; radius: number };
}
export interface PlayerFieldInterface {
    location: { x: number; y: number };
    dimension: { width: number; height: number };
    avoidArea: { location: { x: number; y: number }; radius: number };
}
export interface ObjectInterface {
    type: string;
    location: { x: number; y: number };
    dimension: { width: number; height: number };
    avoidArea: { location: { x: number; y: number }; radius: number };
    damages: { location: { x: number; y: number }; radius: number }[];
}
export interface FieldInterface {
    id: number;
    name: string;
    field: {
        dimension: { width: number; height: number };
        players: PlayerFieldInterface[];
        objects: ObjectInterface[];
    };
}

export interface GameInterface {
    players: PlayerInterface[];
    objects: ObjectInterface[];
    currentPlayer: PlayerInterface;
    lastFunction: string | undefined;
    field: FieldInterface;
    uuid: string;
}
