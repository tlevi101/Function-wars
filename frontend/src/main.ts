/// <reference types="@angular/localize" />
import '@angular/localize/init';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';

import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
const firebaseConfig = {
  apiKey: "AIzaSyDbchXaRcty1a0S6jGZZOw2stwnVlN-Nqg",
  authDomain: "function-wars.firebaseapp.com",
  projectId: "function-wars",
  storageBucket: "function-wars.appspot.com",
  messagingSenderId: "18330257871",
  appId: "1:18330257871:web:39d16802fc835490c6eaba",
  measurementId: "G-TZFF7ZGK9N"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

platformBrowserDynamic()
    .bootstrapModule(AppModule)
    .catch(err => console.error(err));
