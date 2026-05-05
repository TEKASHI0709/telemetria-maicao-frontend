import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { Router } from '@angular/router';
import { TankService } from '../../core/services/tank';
import { ReadingService } from '../../core/services/reading';
import { AlertService, Alert } from '../../core/services/alert';
import { UserService, User } from '../../core/services/user';
import { ImpersonationService } from '../../core/services/impersonation';
import { forkJoin } from 'rxjs';

interface UserWithStats extends User {
  tankCount: number;
  readingCount: number;
  alertCount: number;
}

@Component({
  selector: 'app-dashboard-admin',
  imports: [CommonModule, DecimalPipe],
  templateUrl: './dashboard-admin.html',
  styleUrl: './dashboard-admin.css'
})
export class DashboardAdmin implements OnInit {
  totalUsers = 0;
  activeUsers = 0;
  totalTanks = 0;
  onlineTanks = 0;
  totalReadings = 0;
  totalAlerts = 0;
  activeAlerts = 0;
  totalCapacity = 0;
  tanksPerUser = 0;
  
  alerts: Alert[] = [];
  usersWithStats: UserWithStats[] = [];
  loading = true;

  constructor(
    private userService: UserService,
    private tankService: TankService,
    private readingService: ReadingService,
    private alertService: AlertService,
    private impersonationService: ImpersonationService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadAllData();
  }

  loadAllData(): void {
    forkJoin({
      users: this.userService.getAll(),
      tanks: this.tankService.getAll(),
      readings: this.readingService.getAll(),
      alerts: this.alertService.getAll()
    }).subscribe({
      next: ({ users, tanks, readings, alerts }) => {
        this.totalUsers = users.length;
        this.activeUsers = users.filter(u => u.is_active).length;
        this.totalTanks = tanks.length;
        this.totalReadings = readings.length;
        this.totalAlerts = alerts.length;
        this.activeAlerts = alerts.filter(a => !a.is_read).length;
        this.alerts = alerts;
        
        this.totalCapacity = tanks.reduce((acc, t) => acc + t.capacity_liters, 0);
        this.tanksPerUser = users.length > 0 ? this.totalTanks / users.length : 0;
        
        // Calcular tanques en línea (con lecturas)
        const tankIdsWithReadings = new Set(readings.map(r => r.tank));
        this.onlineTanks = tanks.filter(t => t.id && tankIdsWithReadings.has(t.id)).length;
        
        // Estadísticas por usuario
        this.usersWithStats = users.map(user => {
          const userTanks = tanks.filter(t => (t as any).owner === user.id);
          const userTankIds = userTanks.map(t => t.id).filter(id => id !== undefined);
          const userReadings = readings.filter(r => userTankIds.includes(r.tank));
          const userAlerts = alerts.filter(a => userTankIds.includes(a.tank) && !a.is_read);
          
          return {
            ...user,
            tankCount: userTanks.length,
            readingCount: userReadings.length,
            alertCount: userAlerts.length
          };
        });
        
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error cargando datos del admin:', err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  hasAdminRole(user: User): boolean {
    return user.roles?.some(r => r.nombre === 'Administrador') === true;
  }

  getAlertCount(type: 'CRITICAL' | 'LOW' | 'OVERFLOW'): number {
    return this.alerts.filter(a => a.alert_type === type).length;
  }

  getAlertPercent(type: 'CRITICAL' | 'LOW' | 'OVERFLOW'): number {
    if (this.totalAlerts === 0) return 0;
    return (this.getAlertCount(type) / this.totalAlerts) * 100;
  }

  goToUsers(): void {
    this.router.navigate(['/users-admin']);
  }

  viewAsUser(user: User): void {
    if (this.hasAdminRole(user)) return;
    this.impersonationService.startImpersonation(user);
    this.router.navigate(['/dashboard']);
  }
}