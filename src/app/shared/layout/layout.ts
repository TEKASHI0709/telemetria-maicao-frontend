import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet } from '@angular/router';
import { ThemeService } from '../../core/services/theme';
import { AlertService } from '../../core/services/alert';
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
  currentUser: User | null = null;
  impersonatedUser: User | null = null;
  showUserMenu: boolean = false;

  constructor(
    private themeService: ThemeService,
    private router: Router,
    private alertService: AlertService,
    private userService: UserService,
    private authService: Auth,
    private impersonationService: ImpersonationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.theme = this.themeService.getCurrentTheme();
    this.loadCurrentUser();
    this.loadAlertCount();
    
    this.impersonationService.impersonatedUser$.subscribe(user => {
      this.impersonatedUser = user;
      this.cdr.detectChanges();
    });
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

  loadAlertCount(): void {
    this.alertService.getAll().subscribe({
      next: (alerts) => {
        this.alertCount = alerts.filter(a => !a.is_read).length;
        this.cdr.detectChanges();
      },
      error: () => {
        this.alertCount = 0;
      }
    });
  }

  toggleUserMenu(): void {
    this.showUserMenu = !this.showUserMenu;
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