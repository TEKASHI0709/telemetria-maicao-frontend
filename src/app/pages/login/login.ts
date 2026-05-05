import { Component, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Auth } from '../../core/services/auth';
import { UserService } from '../../core/services/user';

@Component({
  selector: 'app-login',
  imports: [FormsModule, CommonModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  username = '';
  password = '';
  loading = false;
  loginSuccess = false;
  error = '';
  particles = Array(12).fill(0);

  constructor(
    private authService: Auth,
    private userService: UserService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  onSubmit(): void {
    if (!this.username || !this.password) {
      this.error = 'Por favor completa todos los campos';
      this.cdr.detectChanges();
      return;
    }

    this.loading = true;
    this.error = '';
    this.cdr.detectChanges();

    this.authService.login(this.username, this.password).subscribe({
      next: () => {
        this.loading = false;
        this.loginSuccess = true;
        this.cdr.detectChanges();

        this.userService.getMe().subscribe({
          next: (user) => {
            setTimeout(() => {
              if (user.is_admin) {
                this.router.navigate(['/dashboard-admin']);
              } else {
                this.router.navigate(['/dashboard']);
              }
            }, 2200);
          },
          error: () => {
            setTimeout(() => {
              this.router.navigate(['/dashboard']);
            }, 2200);
          }
        });
      },
      error: () => {
        this.loading = false;
        this.error = 'Usuario o contraseña incorrectos';
        this.cdr.detectChanges();
      }
    });
  }
}