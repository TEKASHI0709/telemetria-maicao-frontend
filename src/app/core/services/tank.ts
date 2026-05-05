import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ImpersonationService } from './impersonation';

export interface Tank {
  id?: number;
  name: string;
  location: string;
  capacity_liters: number;
  height_cm: number;
  created_at?: string;
  owner?: number;
  owner_username?: string;
}

@Injectable({
  providedIn: 'root'
})
export class TankService {
  private apiUrl = `${environment.apiUrl}/tanks/tanks/`;

  constructor(
    private http: HttpClient,
    private impersonationService: ImpersonationService
  ) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('access_token');
    let headers: any = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    const impersonated = this.impersonationService.getImpersonatedUser();
    if (impersonated) {
      headers['X-Impersonate-User'] = impersonated.id.toString();
    }
    
    return new HttpHeaders(headers);
  }

  getAll(): Observable<Tank[]> {
    return this.http.get<Tank[]>(this.apiUrl, { headers: this.getHeaders() });
  }

  getForCurrentView(): Observable<Tank[]> {
    return new Observable(observer => {
      this.getAll().subscribe({
        next: (tanks) => {
          const impersonated = this.impersonationService.getImpersonatedUser();
          if (impersonated) {
            const filtered = tanks.filter(t => t.owner === impersonated.id);
            observer.next(filtered);
          } else {
            observer.next(tanks);
          }
          observer.complete();
        },
        error: (err) => observer.error(err)
      });
    });
  }

  create(tank: Tank): Observable<Tank> {
    return this.http.post<Tank>(this.apiUrl, tank, { headers: this.getHeaders() });
  }

  update(id: number, tank: Tank): Observable<Tank> {
    return this.http.put<Tank>(`${this.apiUrl}${id}/`, tank, { headers: this.getHeaders() });
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}${id}/`, { headers: this.getHeaders() });
  }
}