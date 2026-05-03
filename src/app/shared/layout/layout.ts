import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet } from '@angular/router';
import { ThemeService } from '../../core/services/theme';
import { AlertService } from '../../core/services/alert';

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

  constructor(
    private themeService: ThemeService,
    private router: Router,
    private alertService: AlertService
  ) {}

  ngOnInit(): void {
    this.theme = this.themeService.getCurrentTheme();
    this.loadAlertCount();
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
      },
      error: () => {
        this.alertCount = 0;
      }
    });
  }
}