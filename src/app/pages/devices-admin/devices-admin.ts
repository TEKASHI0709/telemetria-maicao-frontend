import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TankService, Tank } from '../../core/services/tank';
import { ReadingService, Reading } from '../../core/services/reading';
import { forkJoin } from 'rxjs';

interface Device extends Tank {
  status: 'ONLINE' | 'INACTIVE' | 'OFFLINE';
  statusLabel: string;
  lastReading: string;
  readingCount: number;
}

@Component({
  selector: 'app-devices-admin',
  imports: [CommonModule],
  templateUrl: './devices-admin.html',
  styleUrl: './devices-admin.css'
})
export class DevicesAdmin implements OnInit {
  devices: Device[] = [];
  onlineCount = 0;
  inactiveCount = 0;
  offlineCount = 0;
  loading = true;

  constructor(
    private tankService: TankService,
    private readingService: ReadingService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadDevices();
  }

  loadDevices(): void {
    this.loading = true;
    forkJoin({
      tanks: this.tankService.getAll(),
      readings: this.readingService.getAll()
    }).subscribe({
      next: ({ tanks, readings }) => {
        this.devices = tanks.map(tank => {
          const tankReadings = readings.filter(r => r.tank === tank.id);
          const sortedReadings = tankReadings.sort((a, b) =>
            new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime()
          );
          const latest = sortedReadings[0] || null;
          
          const status = this.calculateStatus(latest);
          
          return {
            ...tank,
            status,
            statusLabel: this.getStatusLabel(status),
            lastReading: latest ? this.formatTime(latest.timestamp) : 'Nunca',
            readingCount: tankReadings.length
          };
        });

        this.onlineCount = this.devices.filter(d => d.status === 'ONLINE').length;
        this.inactiveCount = this.devices.filter(d => d.status === 'INACTIVE').length;
        this.offlineCount = this.devices.filter(d => d.status === 'OFFLINE').length;

        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error cargando dispositivos:', err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  calculateStatus(latest: Reading | null): 'ONLINE' | 'INACTIVE' | 'OFFLINE' {
    if (!latest || !latest.timestamp) return 'OFFLINE';
    
    const now = new Date().getTime();
    const last = new Date(latest.timestamp).getTime();
    const diffMinutes = (now - last) / (1000 * 60);
    
    if (diffMinutes <= 10) return 'ONLINE';
    if (diffMinutes <= 60) return 'INACTIVE';
    return 'OFFLINE';
  }

  getStatusLabel(status: string): string {
    const labels: any = {
      'ONLINE': 'En línea',
      'INACTIVE': 'Inactivo',
      'OFFLINE': 'Sin datos'
    };
    return labels[status] || status;
  }

  formatTime(timestamp: string | undefined): string {
    if (!timestamp) return 'Nunca';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMin < 1) return 'Hace segundos';
    if (diffMin < 60) return `Hace ${diffMin} min`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    if (diffDays < 7) return `Hace ${diffDays}d`;
    return date.toLocaleDateString('es-CO');
  }
}