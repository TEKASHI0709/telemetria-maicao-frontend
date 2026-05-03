import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Alert {
  id?: number;
  tank: number;
  alert_type: 'LOW' | 'CRITICAL' | 'OVERFLOW';
  message: string;
  is_read: boolean;
  created_at?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AlertService {
  private apiUrl = `${environment.apiUrl}/alerts/alerts/`;

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('access_token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  getAll(): Observable<Alert[]> {
    return this.http.get<Alert[]>(this.apiUrl, { headers: this.getHeaders() });
  }

  markAsRead(id: number): Observable<Alert> {
    return this.http.patch<Alert>(`${this.apiUrl}${id}/`, { is_read: true }, { headers: this.getHeaders() });
  }
}