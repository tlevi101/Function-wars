import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import jwt_decode from 'jwt-decode';

@Component({
  selector: 'app-nav-bar',
  templateUrl: './nav-bar.component.html',
  styleUrls: ['./nav-bar.component.scss']
})
export class NavBarComponent implements OnInit {
  
  public name = 'User'
  constructor(private router:Router) { }

  ngOnInit(): void {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if(token){
      const decodedToken = this.getDecodedAccessToken(token);
      this.name = decodedToken.name;
    }
  }
  getDecodedAccessToken(token: string): any {
    try {
      return jwt_decode(token);
    } catch(Error) {
      return null;
    }
  }

  logout(){
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    this.router.navigate(['/login']);
  }
}
