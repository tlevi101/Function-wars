import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { ValidationService } from '../../services/validation.service';
import { RegisterBodyInterface } from '../../interfaces/backend-body.interfaces';
import { Router } from '@angular/router';
@Component({
    selector: 'app-register',
    templateUrl: './register.component.html',
    styleUrls: ['./register.component.scss'],
})
export class RegisterComponent implements OnInit {
    registerForm: FormGroup;

    constructor(
        private authService: AuthService,
        private validationService: ValidationService,
        private router: Router
    ) {
        this.registerForm = new FormGroup(
            {
                name: new FormControl('', [Validators.required, Validators.minLength(3), Validators.maxLength(20)]),
                email: new FormControl('', [Validators.required, Validators.email]),
                password: new FormControl('', [Validators.required, Validators.minLength(8), Validators.maxLength(20)]),
                passwordAgain: new FormControl('', [
                    Validators.required,
                    Validators.minLength(8),
                    Validators.maxLength(20),
                ]),
                rememberMe: new FormControl(false),
            },
            {
                validators: this.validationService.passwordMatchValidator('password', 'passwordAgain'),
            }
        );
    }

    ngOnInit(): void {
        if (localStorage.getItem('token') || sessionStorage.getItem('token')) this.router.navigate(['/']);
    }

    public submit() {
        const body: RegisterBodyInterface = {
            name: this.name?.value,
            email: this.email?.value,
            password: this.password?.value,
            passwordAgain: this.passwordAgain?.value,
        };
        this.authService.register(body).subscribe(
            (res: any) => {
                console.log(res);
                if (this.rememberMe?.value) localStorage.setItem('token', res.jwt);
                else sessionStorage.setItem('token', res.jwt);
                this.authService.connectSocket(res.jwt);
                this.router.navigate(['/']);
            },
            err => {
                const { msg } = err.error;
                if (msg.includes('email') && msg.includes('unique')) this.email?.setErrors({ unique: true });
                if (msg.includes('name') && msg.includes('unique')) this.name?.setErrors({ unique: true });
                console.log(err);
            }
        );
        return;
    }

    getNameError(): string {
        const nameControl = this.name;
        if (!nameControl) return '';
        if (nameControl.hasError('required')) return 'Name is required';
        if (nameControl.hasError('minlength')) return 'Name must be at least 3 character';
        if (nameControl.hasError('maxlength')) return 'Name must be maximum 20 character';
        if (nameControl.hasError('unique')) return 'Name is already taken';
        return '';
    }
    getNameState(): string {
        if (!this.name?.touched) return '';
        if (this.name?.invalid) return 'is-invalid';
        return 'is-valid';
    }

    getEmailError(): string {
        const emailControl = this.email;
        if (!emailControl) return '';
        if (emailControl.hasError('required')) return 'Email is required';
        if (emailControl.hasError('email')) return 'Email is not valid';
        if (emailControl.hasError('unique')) return 'Email is already taken';
        return '';
    }
    getEmailState(): string {
        if (!this.email?.touched) return '';
        if (this.email?.invalid) return 'is-invalid';
        return 'is-valid';
    }

    getPasswordError(): string {
        if (this.password?.hasError('required')) return 'Password is required';
        if (this.password?.hasError('minlength')) return 'Password must be at least 8 character';
        if (this.password?.hasError('maxlength')) return 'Password must be maximum 20 character';
        return '';
    }
    getPasswordState(): string {
        if (!this.password?.touched) return '';
        if (this.password?.invalid) return 'is-invalid';
        return 'is-valid';
    }

    getPasswordAgainError(): string {
        if (this.passwordAgain?.hasError('required')) return 'Password is required';
        if (this.passwordAgain?.hasError('minlength')) return 'Password must be at least 8 character';
        if (this.passwordAgain?.hasError('maxlength')) return 'Password must be maximum 20 character';
        if (this.passwordAgain?.hasError('notEquivalent')) {
            return 'Passwords are not same';
        }
        return '';
    }
    getPasswordAgainState(): string {
        if (!this.passwordAgain?.touched) return '';
        if (this.passwordAgain?.invalid) return 'is-invalid';
        return 'is-valid';
    }

    get name() {
        return this.registerForm.get('name');
    }
    get email() {
        return this.registerForm.get('email');
    }
    get password() {
        return this.registerForm.get('password');
    }
    get passwordAgain() {
        return this.registerForm.get('passwordAgain');
    }
    get rememberMe() {
        return this.registerForm.get('rememberMe');
    }
}
