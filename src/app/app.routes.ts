import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { Layout } from './shared/layout/layout';
import { Dashboard } from './pages/dashboard/dashboard';
import { DashboardAdmin } from './pages/dashboard-admin/dashboard-admin';
import { Tanks } from './pages/tanks/tanks';
import { Readings } from './pages/readings/readings';
import { Alerts } from './pages/alerts/alerts';
import { Stats } from './pages/stats/stats';
import { Ia } from './pages/ia/ia';
import { UsersAdmin } from './pages/users-admin/users-admin';
import { DevicesAdmin } from './pages/devices-admin/devices-admin';
import { SystemLogs } from './pages/system-logs/system-logs';
import { authGuard } from './core/guards/auth-guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: Login },
  {
    path: '',
    component: Layout,
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', component: Dashboard, canActivate: [authGuard] },
      { path: 'dashboard-admin', component: DashboardAdmin, canActivate: [authGuard] },
      { path: 'tanks', component: Tanks, canActivate: [authGuard] },
      { path: 'readings', component: Readings, canActivate: [authGuard] },
      { path: 'alerts', component: Alerts, canActivate: [authGuard] },
      { path: 'stats', component: Stats, canActivate: [authGuard] },
      { path: 'ia', component: Ia, canActivate: [authGuard] },
      { path: 'users-admin', component: UsersAdmin, canActivate: [authGuard] },
      { path: 'devices-admin', component: DevicesAdmin, canActivate: [authGuard] },
      { path: 'system-logs', component: SystemLogs, canActivate: [authGuard] },
      { path: 'add-tank', component: Tanks, canActivate: [authGuard] }
    ]
  },
  { path: '**', redirectTo: 'login' }
];