export interface PointInterface {
    x: number;
    y: number;
}

export interface Dimension {
    width: number;
    height: number;
}

export interface PlayerInterface {
    id: number;
    name: string;
    location: PointInterface;
    dimension: { width: number; height: number };
    avoidArea: { location: PointInterface; radius: number };
}
export interface PlayerFieldInterface {
    location: PointInterface;
    dimension: { width: number; height: number };
    avoidArea: { location: PointInterface; radius: number };
}
export interface ObjectInterface {
    type: string;
    location: PointInterface;
    dimension: { width: number; height: number };
    avoidArea: { location: PointInterface; radius: number };
    damages: { location: PointInterface; radius: number }[];
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

export interface UserInterface {
    id: number;
    name: string;
}
export interface MutesInterface {
    mutedBy: UserInterface;
    mutedUser: UserInterface;
}
export interface MessageInterface {
    from: UserInterface;
    message: string;
}
