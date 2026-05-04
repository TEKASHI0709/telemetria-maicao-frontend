import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TankService, Tank } from '../../core/services/tank';
import { ReadingService, Reading } from '../../core/services/reading';
import { AlertService } from '../../core/services/alert';
import { forkJoin } from 'rxjs';

interface TankWithLevel extends Tank {
  level: number;
  currentVolume: number;
  statusLabel: string;
  hasData: boolean;
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
  efficiency = 'Sin datos';
  nextFill = '—';

  constructor(
    private tankService: TankService,
    private readingService: ReadingService,
    private alertService: AlertService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadDashboard();
    this.loadAlerts();
  }

  loadDashboard(): void {
    forkJoin({
      tanks: this.tankService.getAll(),
      readings: this.readingService.getAll()
    }).subscribe({
      next: ({ tanks, readings }) => {
        this.totalTanks = tanks.length;
        
        this.tanks = tanks.map(tank => {
          const tankReadings = readings.filter(r => r.tank === tank.id);
          const latest = tankReadings.length > 0 
            ? tankReadings.sort((a, b) => 
                new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime()
              )[0]
            : null;
          
          const hasData = latest !== null;
          const level = hasData ? Math.round(latest!.level_percent) : 0;
          
          return {
            ...tank,
            level,
            currentVolume: hasData ? Math.floor(tank.capacity_liters * (level / 100)) : 0,
            statusLabel: hasData ? this.getStatusLabel(level) : 'Sin datos',
            hasData
          };
        });
        
        this.onlineTanks = this.tanks.filter(t => t.hasData).length;
        
        const tanksWithData = this.tanks.filter(t => t.hasData);
        if (tanksWithData.length > 0) {
          const sum = tanksWithData.reduce((acc, t) => acc + t.level, 0);
          this.averageLevel = Math.floor(sum / tanksWithData.length);
          this.efficiency = this.averageLevel >= 70 ? 'Buena' : this.averageLevel >= 40 ? 'Regular' : 'Baja';
        } else {
          this.averageLevel = 0;
          this.efficiency = 'Sin datos';
        }
        
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error cargando dashboard:', err);
      }
    });
  }

  loadAlerts(): void {
    this.alertService.getAll().subscribe({
      next: (alerts) => {
        this.activeAlerts = alerts.filter(a => !a.is_read).length;
        this.cdr.detectChanges();
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