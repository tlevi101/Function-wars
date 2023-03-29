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
    ],
    providers: [],
    bootstrap: [AppComponent],
})
export class AppModule {}
