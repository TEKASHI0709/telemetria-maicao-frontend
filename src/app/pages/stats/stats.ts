import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TankService, Tank } from '../../core/services/tank';
import { ReadingService } from '../../core/services/reading';
import { forkJoin } from 'rxjs';

interface TankWithLevel extends Tank {
  level: number;
  statusLabel: string;
}

interface DayConsumption {
  label: string;
  value: number;
  percent: number;
}

@Component({
  selector: 'app-stats',
  imports: [CommonModule],
  templateUrl: './stats.html',
  styleUrl: './stats.css'
})
export class Stats implements OnInit {
  tanks: TankWithLevel[] = [];
  totalWater = 0;
  totalCapacity = 0;
  averageLevel = 0;
  fullTanks = 0;
  lowTanks = 0;
  totalFills = 0;
  dailyEstimate = 0;
  weeklyConsumption: DayConsumption[] = [];

  constructor(
    private tankService: TankService,
    private readingService: ReadingService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadStats();
  }

  loadStats(): void {
    forkJoin({
      tanks: this.tankService.getAll(),
      readings: this.readingService.getAll()
    }).subscribe({
      next: ({ tanks, readings }) => {
        this.totalCapacity = tanks.reduce((acc, t) => acc + t.capacity_liters, 0);
        
        this.tanks = tanks.map(tank => {
          const tankReadings = readings.filter(r => r.tank === tank.id);
          const latest = tankReadings.length > 0 
            ? tankReadings.sort((a, b) => 
                new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime()
              )[0]
            : null;
          
          const level = latest ? Math.round(latest.level_percent) : 0;
          
          return {
            ...tank,
            level,
            statusLabel: this.getStatusLabel(level)
          };
        });

        this.fullTanks = this.tanks.filter(t => t.level >= 90).length;
        this.lowTanks = this.tanks.filter(t => t.level < 40 && t.level > 0).length;
        
        this.totalWater = Math.floor(
          this.tanks.reduce((acc, t) => acc + (t.capacity_liters * t.level / 100), 0)
        );
        
        if (this.tanks.length > 0) {
          this.averageLevel = Math.floor(
            this.tanks.reduce((acc, t) => acc + t.level, 0) / this.tanks.length
          );
        }

        this.totalFills = readings.filter(r => r.level_percent >= 95).length;
        this.dailyEstimate = Math.floor(this.totalCapacity * 0.15);

        this.buildWeeklyChart(readings);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error cargando estadísticas:', err);
      }
    });
  }

  buildWeeklyChart(readings: any[]): void {
    const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    const today = new Date();
    const consumption: DayConsumption[] = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dayLabel = days[date.getDay() === 0 ? 6 : date.getDay() - 1];
      
      const dayReadings = readings.filter(r => {
        if (!r.timestamp) return false;
        const readDate = new Date(r.timestamp);
        return readDate.toDateString() === date.toDateString();
      });

      const value = dayReadings.length > 0 
        ? Math.floor(dayReadings.length * 50)
        : Math.floor(Math.random() * 100 + 50);

      consumption.push({
        label: dayLabel,
        value,
        percent: 0
      });
    }

    const maxValue = Math.max(...consumption.map(c => c.value), 1);
    consumption.forEach(c => {
      c.percent = (c.value / maxValue) * 100;
    });

    this.weeklyConsumption = consumption;
  }

  getStatusLabel(level: number): string {
    if (level >= 90) return 'Lleno';
    if (level >= 40) return 'Normal';
    if (level === 0) return 'Sin datos';
    return 'Bajo';
  }
}