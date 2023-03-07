import { Component, OnInit} from '@angular/core';
import { BackendService } from '../services/backend.service';
import { FormControl, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  
  loginForm: FormGroup;
  
  constructor(private backendService:BackendService, private formBuilder: FormBuilder, private router: Router) {
    this.loginForm =  new FormGroup({
      email: new FormControl('',[
        Validators.required,
        Validators.email
      ]),
      password: new FormControl('',[
        Validators.required,
        Validators.minLength(8),
      ]),
      rememberMe: new FormControl(false)
    });
   }

  ngOnInit(): void {
    if(localStorage.getItem('token') || sessionStorage.getItem('token'))
      this.router.navigate(['/']);
  }

  public submit() {
    return;
  }


  getEmailError() : string{
    const emailControl = this.email;
    if(emailControl?.hasError('required'))
      return 'Email is required';
    if(emailControl?.hasError('email'))
      return 'Email is not valid';
    return '';
  }
  getEmailState() : string {
    if(!this.email?.touched)
      return '';
    if(this.email?.invalid)
      return 'is-invalid';
    return 'is-valid';
  }


  getPasswordError() : string{
    if(this.password?.hasError('required'))
      return 'Password is required'
    if(this.password?.hasError('minlength'))
      return 'Password must be at least 8 character';
    return '';
  }
  getPasswordState() : string{
    if(!this.password?.touched)
      return '';
    if(this.password?.invalid)
      return 'is-invalid';
    return 'is-valid';
  }
  get email(){
    return this.loginForm.get('email');
  }
  get password(){
    return this.loginForm.get('password');
  }

}
