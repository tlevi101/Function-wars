import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ForgotPasswordBodyInterface } from '../interfaces/backend-body.interfaces';
import { BackendService } from '../services/backend.service';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss']
})
export class ForgotPasswordComponent implements OnInit{
  
  public forgotPasswordForm: FormGroup;
  constructor(private router: Router, private backendService: BackendService) { 
    this.forgotPasswordForm = new FormGroup({
      email: new FormControl('',[
        Validators.required,
        Validators.email
      ])
    });
  }

  public submit(){
    const body : ForgotPasswordBodyInterface = {
      email: this.email?.value
    }
    this.backendService.forgotPassword(body).subscribe(
      (response) => {
        //TODO show success message
        this.router.navigate(['/login']);
      },
      (err) => {
        if(err.status === 404)
          this.forgotPasswordForm.setErrors({notFound: true});
      }
    );
  }
  
  ngOnInit(): void {
    if(localStorage.getItem('token') || sessionStorage.getItem('token'))
      this.router.navigate(['/']);
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
    if(this.email?.invalid || this.getForgotPasswordError()!=='')
      return 'is-invalid';
    return 'is-valid';
  }


  getForgotPasswordError() : string{
    if(this.forgotPasswordForm?.hasError('notFound'))
      return 'Email not found';
    return '';
  }

  get email() {
    return this.forgotPasswordForm.get('email');
  }


}
