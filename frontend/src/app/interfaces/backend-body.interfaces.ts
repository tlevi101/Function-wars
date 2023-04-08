export interface ForgotPasswordBodyInterface {
    email: string;
}
export interface LoginBodyInterface {
    email: string;
    password: string;
}
export interface RegisterBodyInterface {
    name: string;
    email: string;
    password: string;
    passwordAgain: string;
}
export interface ResetPasswordBodyInterface {
    password: string;
    passwordAgain: string;
}

export interface FieldBodyInterface {
	name: string;
	field:{
		dimension : {width: number, height: number},
		players: PlayerInterface[],
		objects: ObjectInterface[]
	}
}	

export interface FieldResponseInterface {
	id: number;
	name: string;
	field:{
		dimension : {width: number, height: number},
		players: PlayerInterface[],
		objects: ObjectInterface[]
	}
}
export interface FieldListResponseInterface {
	id: number;
	name: string;
	deletedAt: string;
	updatedAt: string;
}

export interface PlayerInterface {
	location: {x: number, y: number},
	dimension: {width: number, height: number},
	avoidArea: {location: {x: number, y: number}, radius: number}
}

export interface ObjectInterface {
	location: {x: number, y: number},
	dimension: {width: number, height: number},
	avoidArea: {location: {x: number, y: number}, radius: number}
}