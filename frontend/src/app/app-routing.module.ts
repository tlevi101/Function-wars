import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ForgotPasswordComponent } from './auth-components/forgot-password/forgot-password.component';
import { LoginComponent } from './auth-components/login/login.component';
import { RegisterComponent } from './auth-components/register/register.component';
import { ResetPasswordComponent } from './auth-components/reset-password/reset-password.component';
import { RegisterGuestComponent } from './auth-components/register-guest/register-guest.component';
import { UsersComponent } from './list-component/users/users.component';
import { ReportsComponent } from './list-component/reports/reports.component';
import { FieldListComponent } from './list-component/field-list/field-list.component';
import { FieldEditorComponent } from './field-editor/field-editor.component';
import { GameComponent } from './game/game.component';
import {WaitRoomComponent} from "./wait-room/wait-room.component";
import {CustomGamesComponent} from "./list-component/custom-games/custom-games.component";
import { AdminsComponent } from './list-component/admins/admins.component';

const routes: Routes = [
    { path: 'login', component: LoginComponent },
    { path: 'register', component: RegisterComponent },
    { path: 'forgot-password', component: ForgotPasswordComponent },
    { path: 'reset-password/:uuid', component: ResetPasswordComponent },
    { path: 'register-guest', component: RegisterGuestComponent },
    { path: 'admin/users', component: UsersComponent },
    { path: 'admin/reports', component: ReportsComponent },
    { path: 'admin/fields', component: FieldListComponent },
    { path: 'my-fields', component: FieldListComponent },
    { path: 'field/edit/:id', component: FieldEditorComponent },
    { path: 'field/new', component: FieldEditorComponent },
    { path: 'games/:uuid', component: GameComponent },
    { path: 'wait-rooms/:uuid', component: WaitRoomComponent },
    { path: 'custom-games', component: CustomGamesComponent },
	{ path: 'admin/admins', component: AdminsComponent }
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule],
})
export class AppRoutingModule {
    constructor() {}
}
