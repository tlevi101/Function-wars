import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { LoginBodyInterface } from '../../interfaces/backend-body.interfaces';
@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;

  constructor(private authService: AuthService, private router: Router) {
    this.loginForm = new FormGroup({
      email: new FormControl('', [Validators.required, Validators.email]),
      password: new FormControl('', [
        Validators.required,
        Validators.minLength(8),
      ]),
      rememberMe: new FormControl(false),
    });
  }

  ngOnInit(): void {
    if (localStorage.getItem('token') || sessionStorage.getItem('token'))
      this.router.navigate(['/']);
  }
  public keyDownFunction(event: any) {
    if (event.keyCode === 13) {
      this.submit();
    }
  }
  public submit() {
    const body: LoginBodyInterface = {
      email: this.email?.value,
      password: this.password?.value,
    };
    this.authService.login(body).subscribe(
      (res: any) => {
        if (this.rememberMe?.value) localStorage.setItem('token', res.jwt);
        else sessionStorage.setItem('token', res.jwt);
        this.router.navigate(['/']);
      },
      err => {
        if (err.status === 400 || err.status === 404)
          this.loginForm.setErrors({ invalidCredentials: true });
        if (err.status === 403) this.loginForm.setErrors({ userBanned: true });
        console.log(err);
      }
    );
    return;
  }

  getEmailError(): string {
    const emailControl = this.email;
    if (emailControl?.hasError('required')) return 'Email is required';
    if (emailControl?.hasError('email')) return 'Email is not valid';
    return '';
  }
  getEmailState(): string {
    if (!this.email?.touched) return '';
    if (this.email?.invalid || this.getLoginError() !== '') return 'is-invalid';
    return 'is-valid';
  }

  getPasswordError(): string {
    if (this.password?.hasError('required')) return 'Password is required';
    if (this.password?.hasError('minlength'))
      return 'Password must be at least 8 character';
    return '';
  }
  getPasswordState(): string {
    if (!this.password?.touched) return '';
    if (this.password?.invalid || this.getLoginError() !== '')
      return 'is-invalid';
    return 'is-valid';
  }
  getLoginError(): string {
    if (this.loginForm.hasError('invalidCredentials'))
      return 'Email or password is incorrect';
    if (this.loginForm.hasError('userBanned')) return 'User is banned';
    return '';
  }
  get email() {
    return this.loginForm.get('email');
  }
  get password() {
    return this.loginForm.get('password');
  }
  get rememberMe() {
    return this.loginForm.get('rememberMe');
  }
}
