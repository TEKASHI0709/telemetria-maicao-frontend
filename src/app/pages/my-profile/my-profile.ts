import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService, User } from '../../core/services/user';

@Component({
  selector: 'app-my-profile',
  imports: [CommonModule, FormsModule],
  templateUrl: './my-profile.html',
  styleUrl: './my-profile.css'
})
export class MyProfile implements OnInit {
  currentUser: User | null = null;
  
  profileData = {
    nombre: '',
    apellido: '',
    email: ''
  };

  passwordData = {
    current: '',
    new: '',
    confirm: ''
  };

  savingProfile = false;
  changingPassword = false;
  profileError = '';
  profileSuccess = '';
  passwordError = '';
  passwordSuccess = '';

  constructor(
    private userService: UserService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    this.userService.getMe().subscribe({
      next: (user) => {
        this.currentUser = user;
        this.profileData = {
          nombre: user.nombre || '',
          apellido: user.apellido || '',
          email: user.email || ''
        };
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error cargando perfil:', err);
      }
    });
  }

  updateProfile(): void {
    if (!this.profileData.nombre || !this.profileData.apellido) {
      this.profileError = 'El nombre y apellido son obligatorios';
      this.profileSuccess = '';
      this.cdr.detectChanges();
      return;
    }

    this.savingProfile = true;
    this.profileError = '';
    this.profileSuccess = '';

    this.userService.updateMyProfile(this.profileData).subscribe({
      next: (user) => {
        this.savingProfile = false;
        this.currentUser = user;
        this.profileSuccess = 'Perfil actualizado correctamente';
        this.cdr.detectChanges();
        setTimeout(() => {
          this.profileSuccess = '';
          this.cdr.detectChanges();
        }, 3000);
      },
      error: (err) => {
        this.savingProfile = false;
        this.profileError = err.error?.detail || 'Error al actualizar el perfil';
        this.cdr.detectChanges();
      }
    });
  }

  changePassword(): void {
    if (!this.passwordData.current || !this.passwordData.new || !this.passwordData.confirm) {
      this.passwordError = 'Todos los campos son obligatorios';
      this.passwordSuccess = '';
      this.cdr.detectChanges();
      return;
    }

    if (this.passwordData.new.length < 6) {
      this.passwordError = 'La nueva contraseña debe tener al menos 6 caracteres';
      this.cdr.detectChanges();
      return;
    }

    if (this.passwordData.new !== this.passwordData.confirm) {
      this.passwordError = 'Las contraseñas nuevas no coinciden';
      this.cdr.detectChanges();
      return;
    }

    this.changingPassword = true;
    this.passwordError = '';
    this.passwordSuccess = '';

    this.userService.changeMyPassword(this.passwordData.current, this.passwordData.new).subscribe({
      next: () => {
        this.changingPassword = false;
        this.passwordSuccess = 'Contraseña cambiada correctamente';
        this.passwordData = { current: '', new: '', confirm: '' };
        this.cdr.detectChanges();
        setTimeout(() => {
          this.passwordSuccess = '';
          this.cdr.detectChanges();
        }, 3000);
      },
      error: (err) => {
        this.changingPassword = false;
        this.passwordError = err.error?.detail || 'Error al cambiar la contraseña';
        this.cdr.detectChanges();
      }
    });
  }
}