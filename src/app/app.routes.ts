import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { Layout } from './shared/layout/layout';
import { Dashboard } from './pages/dashboard/dashboard';
import { Tanks } from './pages/tanks/tanks';
import { Readings } from './pages/readings/readings';
import { Alerts } from './pages/alerts/alerts';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: Login },
  {
    path: '',
    component: Layout,
    children: [
      { path: 'dashboard', component: Dashboard },
      { path: 'tanks', component: Tanks },
      { path: 'readings', component: Readings },
      { path: 'alerts', component: Alerts },
      { path: 'stats', component: Readings },
      { path: 'ia', component: Dashboard },
      { path: 'add-tank', component: Tanks }
    ]
  }
];