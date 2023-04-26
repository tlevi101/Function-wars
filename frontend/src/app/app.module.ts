import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LoginComponent } from './auth-components/login/login.component';
import { NgbModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { RegisterComponent } from './auth-components/register/register.component';
import { ForgotPasswordComponent } from './auth-components/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './auth-components/reset-password/reset-password.component';
import { RegisterGuestComponent } from './auth-components/register-guest/register-guest.component';
import { HttpClientModule } from '@angular/common/http';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { InfoComponent } from './pop-up/info/info.component';
import { ConfirmComponent } from './pop-up/confirm/confirm.component';
import { NavBarComponent } from './nav-bar/nav-bar.component';
import { SideBarComponent } from './side-bar/side-bar.component';
import { FriendChatComponent } from './chats/friend-chat/friend-chat.component';
import { UsersComponent } from './list-component/users/users.component';
import { ReportsComponent } from './list-component/reports/reports.component';
import { ConfirmWithInputComponent } from './pop-up/confirm-with-input/confirm-with-input.component';
import { BaseListComponent } from './list-component/base-list/base-list.component';
import { SocketIoModule, SocketIoConfig } from 'ngx-socket-io';
import { FieldEditorComponent } from './field-editor/field-editor.component';
import { FieldListComponent } from './list-component/field-list/field-list.component';
import { NewGameComponent } from './new-game/new-game.component';
import { OnWaitingComponent } from './on-waiting/on-waiting.component';
import { GameComponent } from './game/game.component';
import { GroupChatComponent } from './chats/group-chat/group-chat.component';
import { CreateCustomGameComponent } from './pop-up/create-custom-game/create-custom-game.component';
import { ScaleAbleFieldComponent } from './scale-able-field/scale-able-field.component';
import { WaitRoomComponent } from './wait-room/wait-room.component';
import { CustomGamesComponent } from './list-component/custom-games/custom-games.component';
import { PaginationComponent } from './list-component/pagination/pagination.component';

const config: SocketIoConfig = {
    url: 'http://localhost:3000',
    options: {
        transports: ['websocket'],
        query: { token: sessionStorage.getItem('token') || localStorage.getItem('token') },
        extraHeaders: { Authorization: `Bearer ${sessionStorage.getItem('token') || localStorage.getItem('token')}` },
    },
};
@NgModule({
    declarations: [
        AppComponent,
        LoginComponent,
        RegisterComponent,
        ForgotPasswordComponent,
        ResetPasswordComponent,
        RegisterGuestComponent,
        InfoComponent,
        ConfirmComponent,
        NavBarComponent,
        SideBarComponent,
        FriendChatComponent,
        UsersComponent,
        ReportsComponent,
        ConfirmWithInputComponent,
        BaseListComponent,
        FieldEditorComponent,
        FieldListComponent,
        NewGameComponent,
        OnWaitingComponent,
        GameComponent,
        GroupChatComponent,
        CreateCustomGameComponent,
        ScaleAbleFieldComponent,
        WaitRoomComponent,
        CustomGamesComponent,
        PaginationComponent,
    ],
    imports: [
        BrowserModule,
        HttpClientModule,
        AppRoutingModule,
        NgbModule,
        NgbTooltipModule,
        ReactiveFormsModule,
        FormsModule,
        BrowserAnimationsModule,
        SocketIoModule.forRoot(config),
    ],
    providers: [],
    bootstrap: [AppComponent],
})
export class AppModule {}
