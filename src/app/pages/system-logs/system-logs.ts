import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SystemLogService, SystemLog } from '../../core/services/system-log';

@Component({
  selector: 'app-system-logs',
  imports: [CommonModule],
  templateUrl: './system-logs.html',
  styleUrl: './system-logs.css'
})
export class SystemLogs implements OnInit {
  logs: SystemLog[] = [];
  filteredLogs: SystemLog[] = [];
  filterLevel: 'ALL' | 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' = 'ALL';
  loading = true;

  constructor(
    private systemLogService: SystemLogService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadLogs();
  }

  loadLogs(): void {
    this.loading = true;
    this.systemLogService.getAll().subscribe({
      next: (logs) => {
        this.logs = logs;
        this.applyFilter();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error cargando logs:', err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  setFilter(level: 'ALL' | 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR'): void {
    this.filterLevel = level;
    this.applyFilter();
  }

  applyFilter(): void {
    if (this.filterLevel === 'ALL') {
      this.filteredLogs = this.logs;
    } else {
      this.filteredLogs = this.logs.filter(l => l.level === this.filterLevel);
    }
  }

  countByLevel(level: string): number {
    return this.logs.filter(l => l.level === level).length;
  }

  formatTime(timestamp: string): string {
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
    return date.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  }
}