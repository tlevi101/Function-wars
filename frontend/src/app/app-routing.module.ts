import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ForgotPasswordComponent } from './auth-components/forgot-password/forgot-password.component';
import { LoginComponent } from './auth-components/login/login.component';
import { RegisterComponent } from './auth-components/register/register.component';
import { ResetPasswordComponent } from './auth-components/reset-password/reset-password.component';
import { RegisterGuestComponent } from './auth-components/register-guest/register-guest.component';
import { UsersComponent } from './list-component/users/users.component';
import jwt_decode from 'jwt-decode';
import { DecodedTokenInterface } from './interfaces/token.interface';
import { ReportsComponent } from './list-component/reports/reports.component';

const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'reset-password/:uuid', component: ResetPasswordComponent },
  { path: 'register-guest', component: RegisterGuestComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {
  constructor() {
    const token =
      localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token) {
      const user = this.getDecodedAccessToken(token);
	  console.log(user);
      if (user?.is_admin) {
        routes.push(
          { path: 'admin/users', component: UsersComponent },
          { path: 'admin/reports', component: ReportsComponent},
          { path: '', redirectTo: '/admin/users', pathMatch: 'full' }
        );
      }
    }
  }

  getDecodedAccessToken(token: string): DecodedTokenInterface | null {
    try {
      return jwt_decode(token);
    } catch (Error) {
      return null;
    }
  }
}
