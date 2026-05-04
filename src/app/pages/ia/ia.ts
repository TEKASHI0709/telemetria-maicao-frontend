import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TankService, Tank } from '../../core/services/tank';
import { ReadingService } from '../../core/services/reading';
import { AlertService } from '../../core/services/alert';
import { forkJoin } from 'rxjs';

interface TankWithLevel extends Tank {
  level: number;
}

@Component({
  selector: 'app-ia',
  imports: [CommonModule],
  templateUrl: './ia.html',
  styleUrl: './ia.css'
})
export class Ia implements OnInit {
  tanks: TankWithLevel[] = [];
  healthScore = 0;
  autonomy = 0;
  urgencyStatus = 'No urgente';
  urgencyLabel = 'Llenado';
  consumptionPrediction = 'Cargando análisis...';

  constructor(
    private tankService: TankService,
    private readingService: ReadingService,
    private alertService: AlertService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadAnalysis();
  }

  loadAnalysis(): void {
    forkJoin({
      tanks: this.tankService.getAll(),
      readings: this.readingService.getAll(),
      alerts: this.alertService.getAll()
    }).subscribe({
      next: ({ tanks, readings, alerts }) => {
        this.tanks = tanks.map(tank => {
          const tankReadings = readings.filter(r => r.tank === tank.id);
          const latest = tankReadings.length > 0
            ? tankReadings.sort((a, b) =>
                new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime()
              )[0]
            : null;

          return {
            ...tank,
            level: latest ? Math.round(latest.level_percent) : 0
          };
        });

        this.calculateMetrics(alerts.filter(a => !a.is_read).length);
        this.buildPrediction();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error cargando análisis IA:', err);
      }
    });
  }

  calculateMetrics(unreadAlerts: number): void {
    if (this.tanks.length === 0) {
      this.healthScore = 0;
      this.autonomy = 0;
      this.urgencyStatus = 'Sin datos';
      this.urgencyLabel = 'Sin tanques';
      return;
    }

    const avgLevel = this.tanks.reduce((acc, t) => acc + t.level, 0) / this.tanks.length;

    let score = avgLevel;
    score -= unreadAlerts * 5;
    const lowTanks = this.tanks.filter(t => t.level < 40).length;
    score -= lowTanks * 8;
    this.healthScore = Math.max(0, Math.min(100, Math.round(score)));

    const totalCapacity = this.tanks.reduce((acc, t) => acc + t.capacity_liters, 0);
    const totalAvailable = this.tanks.reduce((acc, t) => acc + (t.capacity_liters * t.level / 100), 0);
    const dailyConsumption = totalCapacity * 0.15;

    if (dailyConsumption > 0) {
      this.autonomy = Math.floor((totalAvailable / dailyConsumption) * 24);
    } else {
      this.autonomy = 0;
    }

    if (avgLevel >= 80) {
      this.urgencyStatus = 'No urgente';
      this.urgencyLabel = 'Llenado';
    } else if (avgLevel >= 50) {
      this.urgencyStatus = 'Pronto';
      this.urgencyLabel = 'Llenado';
    } else if (avgLevel >= 20) {
      this.urgencyStatus = 'Pronto';
      this.urgencyLabel = 'Necesario';
    } else {
      this.urgencyStatus = 'Urgente';
      this.urgencyLabel = 'Crítico';
    }
  }

  buildPrediction(): void {
    if (this.tanks.length === 0) {
      this.consumptionPrediction = 'Registra tus tanques para obtener predicciones inteligentes.';
      return;
    }

    const avgLevel = this.tanks.reduce((acc, t) => acc + t.level, 0) / this.tanks.length;
    const totalCapacity = this.tanks.reduce((acc, t) => acc + t.capacity_liters, 0);
    const hourlyConsumption = Math.round((totalCapacity * 0.15) / 24);

    if (avgLevel >= 70) {
      this.consumptionPrediction = `Basado en patrones, el consumo promedio es de ~${hourlyConsumption}L/hora. Todos los tanques están en buen estado.`;
    } else if (avgLevel >= 40) {
      this.consumptionPrediction = `El consumo actual es de ~${hourlyConsumption}L/hora. Considera revisar el llenado en las próximas horas.`;
    } else {
      this.consumptionPrediction = `Consumo de ~${hourlyConsumption}L/hora con niveles bajos. Se recomienda llenado prioritario.`;
    }
  }

  getRecommendation(level: number): string {
    if (level >= 90) return 'Tanque lleno';
    if (level >= 70) return 'Buen nivel';
    if (level >= 40) return 'Nivel intermedio - considerar llenado';
    if (level > 0) return 'Nivel bajo - llenado prioritario';
    return 'Sin datos del sensor';
  }
}