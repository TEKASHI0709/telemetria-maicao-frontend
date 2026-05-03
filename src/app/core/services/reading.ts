import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Reading {
  id?: number;
  tank: number;
  distance_cm: number;
  level_percent: number;
  timestamp?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ReadingService {
  private apiUrl = `${environment.apiUrl}/readings/readings/`;

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('access_token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  getAll(): Observable<Reading[]> {
    return this.http.get<Reading[]>(this.apiUrl, { headers: this.getHeaders() });
  }

  getByTank(tankId: number): Observable<Reading[]> {
    return this.http.get<Reading[]>(`${this.apiUrl}?tank=${tankId}`, { headers: this.getHeaders() });
  }

  create(reading: Reading): Observable<Reading> {
    return this.http.post<Reading>(this.apiUrl, reading, { headers: this.getHeaders() });
  }
}