import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'frontend';
  public authorized = false;
  constructor(private router:Router) { }
  
  ngOnInit(): void {
    if(localStorage.getItem('token') || sessionStorage.getItem('token'))
      this.authorized = true;
    else{
      this.authorized = false;
      if(!window.location.href.includes('reset-password'))
        this.router.navigate(['/login']);
    }
  }
}
