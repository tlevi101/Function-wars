import { Injectable } from '@angular/core';
import { AbstractControl, AsyncValidatorFn, ValidationErrors, ValidatorFn } from '@angular/forms';
import { FunctionCalculator } from '../game/utils/FunctionCalculator';

@Injectable({
    providedIn: 'any',
})
export class ValidationService {
    public passwordMatchValidator(firstControlName: string, secondControlName: string): ValidatorFn {
        return (group: AbstractControl): ValidationErrors | null => {
            const control1 = group.get(firstControlName);
            const control2 = group.get(secondControlName);
            if (!control1 || !control2) {
                return null;
            }
            let control2Errors = control2.errors;
            if (!control2Errors) {
                control2Errors = {};
            }
            if (control1.value !== control2.value) {
                control2Errors['notEquivalent'] = true;
                control2.setErrors(control2Errors);
            } else {
                delete control2Errors['notEquivalent'];
                if (Object.keys(control2Errors).length === 0) control2Errors = null;
                control2.setErrors(control2Errors);
            }
            return null;
        };
    }

    public mathFunctionValidator(controlName: string): AsyncValidatorFn {
        return async (group: AbstractControl): Promise<ValidationErrors | null> => {
            const control = group.get(controlName);
            if (!control) {
                return null;
            }
            const functionCalculator = new FunctionCalculator(control.value, 0, 0);

            let controlErrors = control.errors;
            if (!controlErrors) {
                controlErrors = {};
            }
            if (!(await functionCalculator.isValidFunction())) {
                controlErrors!['invalidMathFunction'] = await functionCalculator.error();
            } else {
                delete controlErrors['invalidMathFunction'];
                if (Object.keys(controlErrors).length === 0) controlErrors = null;
            }

            control.setErrors(controlErrors);
            return null;
        };
    }
}
