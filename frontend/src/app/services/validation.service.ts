import { Injectable } from '@angular/core';
import {AbstractControl, FormGroup, ValidationErrors, ValidatorFn} from '@angular/forms';

@Injectable({
  providedIn: 'any'
})
export class ValidationService {

  constructor() { }

  public passwordMatchValidator(firstControlName:string, secondControlName:string) : ValidatorFn {
    return (group: AbstractControl) : ValidationErrors | null => {
      const control1 = group.get(firstControlName);
      const control2 = group.get(secondControlName);
      if(!control1 || !control2) {
        return null;
      }
      let control2Errors = control2.errors;
      if(!control2Errors){
        control2Errors = {};
      }
      if (control1.value !== control2.value) {
          control2Errors['notEquivalent'] = true;
          control2.setErrors(control2Errors);
      } else {
        delete control2Errors['notEquivalent'];
        control2.setErrors(control2Errors);
      }
      return null;
    };
  }



  //TODO: Implement a better email validator
}
