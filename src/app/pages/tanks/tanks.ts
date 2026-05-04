import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TankService } from '../../core/services/tank';

@Component({
  selector: 'app-tanks',
  imports: [CommonModule, FormsModule],
  templateUrl: './tanks.html',
  styleUrl: './tanks.css'
})
export class Tanks {
  name = '';
  location = '';
  capacity: number | null = null;
  height: number | null = null;
  loading = false;
  success = false;
  error = '';

  constructor(
    private tankService: TankService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  onSubmit(): void {
    if (!this.name || !this.location || !this.capacity || !this.height) {
      this.error = 'Por favor completa todos los campos';
      this.cdr.detectChanges();
      return;
    }

    this.loading = true;
    this.error = '';
    this.success = false;
    this.cdr.detectChanges();

    this.tankService.create({
      name: this.name,
      location: this.location,
      capacity_liters: this.capacity,
      height_cm: this.height
    }).subscribe({
      next: () => {
        this.loading = false;
        this.success = true;
        this.cdr.detectChanges();
        setTimeout(() => {
          this.router.navigate(['/dashboard']);
        }, 2200);
      },
      error: () => {
        this.loading = false;
        this.error = 'No se pudo crear el tanque. Intenta de nuevo.';
        this.cdr.detectChanges();
      }
    });
  }
}