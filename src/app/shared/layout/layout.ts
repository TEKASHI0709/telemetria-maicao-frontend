import { Component, OnInit, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet } from '@angular/router';
import { ThemeService } from '../../core/services/theme';
import { AlertService, Alert } from '../../core/services/alert';
import { TankService, Tank } from '../../core/services/tank';
import { UserService, User } from '../../core/services/user';
import { Auth } from '../../core/services/auth';
import { ImpersonationService } from '../../core/services/impersonation';

@Component({
  selector: 'app-layout',
  imports: [CommonModule, RouterOutlet],
  templateUrl: './layout.html',
  styleUrl: './layout.css'
})
export class Layout implements OnInit {
  theme: 'light' | 'dark' = 'dark';
  activeTab: string = 'inicio';
  alertCount: number = 0;
  alerts: Alert[] = [];
  tanks: Tank[] = [];
  currentUser: User | null = null;
  impersonatedUser: User | null = null;
  showUserMenu: boolean = false;
  showAlertsPanel: boolean = false;

  constructor(
    private themeService: ThemeService,
    private router: Router,
    private alertService: AlertService,
    private tankService: TankService,
    private userService: UserService,
    private authService: Auth,
    private impersonationService: ImpersonationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.theme = this.themeService.getCurrentTheme();
    this.loadCurrentUser();
    this.loadAlerts();
    
    this.impersonationService.impersonatedUser$.subscribe(user => {
      this.impersonatedUser = user;
      this.cdr.detectChanges();
    });
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.user-menu-wrapper')) {
      this.showUserMenu = false;
    }
    if (!target.closest('.alerts-menu-wrapper')) {
      this.showAlertsPanel = false;
    }
    this.cdr.detectChanges();
  }

  loadCurrentUser(): void {
    this.userService.getMe().subscribe({
      next: (user) => {
        this.currentUser = user;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error cargando usuario:', err);
      }
    });
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
    this.theme = this.themeService.getCurrentTheme();
  }

  navigate(route: string, tab: string): void {
    this.activeTab = tab;
    this.router.navigate(['/' + route]);
  }

  loadAlerts(): void {
    this.tankService.getAll().subscribe({
      next: (tanks) => {
        this.tanks = tanks;
        this.alertService.getAll().subscribe({
          next: (alerts) => {
            this.alerts = alerts
              .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
              .slice(0, 10);
            this.alertCount = alerts.filter(a => !a.is_read).length;
            this.cdr.detectChanges();
          },
          error: () => {
            this.alertCount = 0;
          }
        });
      },
      error: () => {
        this.tanks = [];
      }
    });
  }

  toggleUserMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.showUserMenu = !this.showUserMenu;
    this.showAlertsPanel = false;
  }

  toggleAlertsPanel(event: MouseEvent): void {
    event.stopPropagation();
    this.showAlertsPanel = !this.showAlertsPanel;
    this.showUserMenu = false;
    if (this.showAlertsPanel) {
      this.loadAlerts();
    }
  }

  getTankName(tankId: number): string {
    const tank = this.tanks.find(t => t.id === tankId);
    return tank ? tank.name : 'Desconocido';
  }

  getAlertIcon(type: string): string {
    if (type === 'CRITICAL') return '⛔';
    if (type === 'LOW') return '⚠️';
    if (type === 'OVERFLOW') return '💧';
    return 'ℹ️';
  }

  formatAlertTime(timestamp: string | undefined): string {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (minutes < 1) return 'Ahora';
    if (minutes < 60) return `Hace ${minutes} min`;
    if (hours < 24) return `Hace ${hours}h`;
    if (days < 7) return `Hace ${days}d`;
    return date.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' });
  }

  markAlertAsRead(alert: Alert, event: MouseEvent): void {
    event.stopPropagation();
    if (!alert.id || alert.is_read) return;
    this.alertService.markAsRead(alert.id).subscribe({
      next: () => {
        alert.is_read = true;
        this.alertCount = this.alerts.filter(a => !a.is_read).length;
        this.cdr.detectChanges();
      }
    });
  }

  goToAllAlerts(): void {
    this.showAlertsPanel = false;
    this.router.navigate(['/alerts']);
  }

  goToProfile(): void {
    this.showUserMenu = false;
    this.router.navigate(['/my-profile']);
  }

  logout(): void {
    this.authService.logout();
    this.userService.clearUser();
    this.impersonationService.stopImpersonation();
    this.router.navigate(['/login']);
  }

  isAdmin(): boolean {
    return this.currentUser?.is_admin === true;
  }

  isImpersonating(): boolean {
    return this.impersonatedUser !== null;
  }

  exitImpersonation(): void {
    this.impersonationService.stopImpersonation();
    this.router.navigate(['/dashboard-admin']);
  }
}