import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-register-guest',
    templateUrl: './register-guest.component.html',
    styleUrls: ['./register-guest.component.scss'],
})
export class RegisterGuestComponent implements OnInit {
    public guestForm: FormGroup;
    constructor(private router: Router, private authService: AuthService) {
        this.guestForm = new FormGroup({
            name: new FormControl('', [Validators.required, Validators.minLength(3)]),
        });
    }

    ngOnInit(): void {
        if (localStorage.getItem('token') || sessionStorage.getItem('token')) this.router.navigate(['/']);
    }

    public submit() {
        this.authService.registerGuest(this.guestForm.value).subscribe(
            (res: any) => {
				console.log(res);
                sessionStorage.setItem('token', res.jwt);
                this.router.navigate(['/']);
            },
            err => {
                if (err.status === 404) this.guestForm.setErrors({ notFound: true });
            }
        );
    }

    getNameError(): string {
        if (this.name?.hasError('required')) return 'Name is required';
        if (this.name?.hasError('minlength')) return 'Name must be at least 3 characters long';
        return '';
    }
    getNameState(): string {
        if (!this.name?.touched) return '';
        if (this.name?.invalid) return 'is-invalid';
        return 'is-valid';
    }

    get name() {
        return this.guestForm.get('name');
    }
}
