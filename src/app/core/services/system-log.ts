import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface SystemLog {
  id: number;
  log_type: string;
  log_type_display: string;
  level: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS';
  level_display: string;
  message: string;
  user: number | null;
  user_username: string | null;
  metadata: any;
  created_at: string;
}

@Injectable({
  providedIn: 'root'
})
export class SystemLogService {
  private apiUrl = `${environment.apiUrl}/system/logs/`;

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('access_token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  getAll(): Observable<SystemLog[]> {
    return this.http.get<SystemLog[]>(this.apiUrl, { headers: this.getHeaders() });
  }
}