import { Component } from '@angular/core';
import { Router } from '@angular/router';

import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TempLoginService } from '../../Services/templogin/templogin';

@Component({
  selector: 'app-templogin',
  standalone: true,
  imports: [
    FormsModule,
    CommonModule
  ],
  templateUrl: './templogin.html',
  styleUrl: './templogin.scss'
})
export class Templogin {

  username = '';
  password = '';

  loading = false;
  errorMessage = '';

  constructor(
    private router: Router,
    private loginService: TempLoginService
  ) {}

  /* ===============================
     LOGIN FUNCTION
  =============================== */

login() {

  if (!this.username || !this.password) {
    this.errorMessage = 'Please enter username and password';
    return;
  }

  this.loading = true;
  this.errorMessage = '';

  this.loginService.login({
    username: this.username,
    password: this.password
  }).subscribe({

    next: (res: any) => {

      this.loading = false;

      if (res?.token) {

        // Save token
        this.loginService.saveToken(res.token);

        // Navigate dashboard
        this.router.navigate(['/allReviews']);

      } else {
        this.errorMessage = 'Authentication failed';
      }

    },

    error: (err: any) => {

      this.loading = false;

      if (err.status === 401) {
        this.errorMessage = 'Invalid username or password';
      }
      else if (err.status === 429) {
        this.errorMessage = 'Too many login attempts. Try later.';
      }
      else {
        this.errorMessage =
          err.error?.message ||
          'Server error occurred';
      }

    }

  });
}
}