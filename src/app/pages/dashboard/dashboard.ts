import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TankService, Tank } from '../../core/services/tank';
import { ReadingService } from '../../core/services/reading';
import { AlertService } from '../../core/services/alert';
import { ImpersonationService } from '../../core/services/impersonation';
import { forkJoin, Subscription, interval } from 'rxjs';
import { switchMap } from 'rxjs/operators';

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
export class Dashboard implements OnInit, OnDestroy {
  tanks: TankWithLevel[] = [];
  totalTanks = 0;
  onlineTanks = 0;
  activeAlerts = 0;
  averageLevel = 0;
  dailyConsumption = 0;
  efficiency = 'Sin datos';
  nextFill = '—';
  lastUpdate = '';

  showDeleteModal = false;
  tankToDelete: TankWithLevel | null = null;
  deleting = false;

  private pollingSubscription: Subscription | null = null;
  private alertSubscription: Subscription | null = null;

  constructor(
    private tankService: TankService,
    private readingService: ReadingService,
    private alertService: AlertService,
    private impersonationService: ImpersonationService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadDashboard();
    this.loadAlerts();
    this.startPolling();
  }

  ngOnDestroy(): void {
    this.stopPolling();
  }

  startPolling(): void {
    this.pollingSubscription = interval(3000).subscribe(() => {
      this.loadDashboard();
      this.loadAlerts();
    });
  }

  stopPolling(): void {
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
      this.pollingSubscription = null;
    }
  }

  loadDashboard(): void {
    forkJoin({
      tanks: this.tankService.getForCurrentView(),
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

        const now = new Date();
        this.lastUpdate = now.toLocaleTimeString('es-CO', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });

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
        const impersonated = this.impersonationService.getImpersonatedUser();
        if (impersonated) {
          this.tankService.getForCurrentView().subscribe(tanks => {
            const tankIds = tanks.map(t => t.id);
            this.activeAlerts = alerts.filter(a => !a.is_read && tankIds.includes(a.tank)).length;
            this.cdr.detectChanges();
          });
        } else {
          this.activeAlerts = alerts.filter(a => !a.is_read).length;
          this.cdr.detectChanges();
        }
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

  confirmDelete(tank: TankWithLevel): void {
    this.tankToDelete = tank;
    this.showDeleteModal = true;
    this.cdr.detectChanges();
  }

  cancelDelete(): void {
    this.showDeleteModal = false;
    this.tankToDelete = null;
    this.cdr.detectChanges();
  }

  deleteTank(): void {
    if (!this.tankToDelete || !this.tankToDelete.id) return;

    this.deleting = true;
    this.cdr.detectChanges();

    this.tankService.delete(this.tankToDelete.id).subscribe({
      next: () => {
        this.deleting = false;
        this.showDeleteModal = false;
        this.tankToDelete = null;
        this.loadDashboard();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error eliminando tanque:', err);
        this.deleting = false;
        this.cdr.detectChanges();
      }
    });
  }
}