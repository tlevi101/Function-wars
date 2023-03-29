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
