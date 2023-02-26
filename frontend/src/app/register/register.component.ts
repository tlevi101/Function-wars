import { Component } from '@angular/core';
import { BackendService } from '../services/backend.service';
@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent {
  
    constructor(private backendService: BackendService) { }
  
    ngOnInit(): void {

    }
}
