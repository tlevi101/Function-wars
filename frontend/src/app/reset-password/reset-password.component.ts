import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ResetPasswordBodyInterface } from '../interfaces/backend-body.interfaces';
import { BackendService } from '../services/backend.service';
import { ValidationService } from '../services/validation.service';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss']
})
export class ResetPasswordComponent implements OnInit {
  
  public resetPasswordForm : FormGroup;
  constructor(private router: Router,
              private backendService: BackendService,
              private validationService: ValidationService,
              private currentRoute: ActivatedRoute) { 
    this.resetPasswordForm = new FormGroup({
      password: new FormControl('',[
        Validators.required,
        Validators.minLength(8),
      ]),
      passwordConfirmation: new FormControl('')
    },{
      validators: this.validationService.passwordMatchValidator('password','passwordConfirmation')
    });
  }

  ngOnInit(): void {
    if(localStorage.getItem('token') || sessionStorage.getItem('token')) {
      this.router.navigate(['/']);
    }
  }


  
  public submit() {
    const uuid = this.currentRoute.snapshot.paramMap.get('uuid') || '';
    console.log(uuid);
    const body: ResetPasswordBodyInterface = {
      password: this.password?.value,
      passwordAgain: this.passwordConfirmation?.value,
    }
    this.backendService.resetPassword(uuid,body).subscribe(
      (res: any) => {
        //TODO: Show success message
        this.router.navigate(['/login']);
      },
      (err: any) => {
        console.log(err);
        if(err.status === 404)
          this.resetPasswordForm.setErrors({incorrectLink: true});
        if(err.error.message === 'Link expired')
          this.resetPasswordForm.setErrors({expiredLink: true});
      }
    );
  }



  public getPasswordError() : string {
    if(this.password?.hasError('required'))
      return 'Password is required';
    if(this.password?.hasError('minlength'))
      return 'Password must be at least 8 characters';
    return '';
  }

  public getPasswordState() : string{
    if(!this.password?.touched)
      return '';
    if(this.password?.invalid || this.getResetPasswordError()!=='')
      return 'is-invalid';
    return 'is-valid';
  }

  public getPasswordConfirmationError() : string {
    if(this.resetPasswordForm?.hasError('notEquivalent'))
      return 'Passwords do not match';
    return '';
  }
  public getPasswordConfirmationState() : string{
    if(!this.passwordConfirmation?.touched)
      return '';
    if(this.getPasswordConfirmationError()!=='')
      return 'is-invalid';
    return 'is-valid';
  }

  public getResetPasswordError() : string {
    //TODO Get these errors from backend before page loads in
    if(this.resetPasswordForm?.hasError('incorrectLink'))
      return 'Incorrect link';
    if(this.resetPasswordForm?.hasError('expiredLink'))
      return 'Link expired';
    return '';
  }
  get password() {
    return this.resetPasswordForm.get('password');
  }
  get passwordConfirmation() {
    return this.resetPasswordForm.get('passwordConfirmation');
  }

}
