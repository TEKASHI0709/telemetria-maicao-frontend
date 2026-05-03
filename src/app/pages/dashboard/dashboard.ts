import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TankService, Tank } from '../../core/services/tank';
import { ReadingService } from '../../core/services/reading';
import { AlertService } from '../../core/services/alert';

interface TankWithLevel extends Tank {
  level: number;
  currentVolume: number;
  statusLabel: string;
}

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit {
  tanks: TankWithLevel[] = [];
  totalTanks = 0;
  onlineTanks = 0;
  activeAlerts = 0;
  averageLevel = 0;
  dailyConsumption = 0;
  efficiency = 'Buena';
  nextFill = '~22h';

  constructor(
    private tankService: TankService,
    private readingService: ReadingService,
    private alertService: AlertService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadTanks();
    this.loadAlerts();
  }

  loadTanks(): void {
    this.tankService.getAll().subscribe({
      next: (tanks) => {
        this.totalTanks = tanks.length;
        this.onlineTanks = tanks.length;
        
        this.tanks = tanks.map(tank => {
          const level = Math.floor(Math.random() * 100);
          return {
            ...tank,
            level,
            currentVolume: Math.floor(tank.capacity_liters * (level / 100)),
            statusLabel: this.getStatusLabel(level)
          };
        });
        
        if (this.tanks.length > 0) {
          const sum = this.tanks.reduce((acc, t) => acc + t.level, 0);
          this.averageLevel = Math.floor(sum / this.tanks.length);
          this.dailyConsumption = Math.floor(this.tanks.reduce((acc, t) => acc + t.capacity_liters * 0.15, 0));
        }
      },
      error: (err) => {
        console.error('Error cargando tanques:', err);
      }
    });
  }

  loadAlerts(): void {
    this.alertService.getAll().subscribe({
      next: (alerts) => {
        this.activeAlerts = alerts.filter(a => !a.is_read).length;
      },
      error: () => {
        this.activeAlerts = 0;
      }
    });
  }

  getStatusLabel(level: number): string {
    if (level >= 90) return 'Lleno';
    if (level >= 40) return 'Normal';
    return 'Bajo';
  }

  addTank(): void {
    this.router.navigate(['/add-tank']);
  }
}