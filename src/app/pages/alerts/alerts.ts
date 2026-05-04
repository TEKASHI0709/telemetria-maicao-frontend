import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AlertService, Alert } from '../../core/services/alert';
import { TankService, Tank } from '../../core/services/tank';

@Component({
  selector: 'app-alerts',
  imports: [CommonModule],
  templateUrl: './alerts.html',
  styleUrl: './alerts.css'
})
export class Alerts implements OnInit {
  alerts: Alert[] = [];
  tanks: Tank[] = [];
  loading = true;

  constructor(
    private alertService: AlertService,
    private tankService: TankService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.tankService.getAll().subscribe({
      next: (tanks) => {
        this.tanks = tanks;
        this.loadAlerts();
      },
      error: () => {
        this.loadAlerts();
      }
    });
  }

  loadAlerts(): void {
    this.alertService.getAll().subscribe({
      next: (alerts) => {
        this.alerts = alerts.sort((a, b) => 
          new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
        );
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error cargando alertas:', err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  getTankName(tankId: number): string {
    const tank = this.tanks.find(t => t.id === tankId);
    return tank ? tank.name : 'Desconocido';
  }

  formatTime(timestamp: string | undefined): string {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor(diff / (1000 * 60));
    
    if (minutes < 60) {
      return date.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
    } else if (hours < 24) {
      return date.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' });
    }
  }

  markAsRead(alert: Alert): void {
    if (!alert.id) return;
    this.alertService.markAsRead(alert.id).subscribe({
      next: () => {
        alert.is_read = true;
        this.cdr.detectChanges();
      }
    });
  }
}