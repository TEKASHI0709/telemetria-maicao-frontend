import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Tank {
  id?: number;
  name: string;
  location: string;
  capacity_liters: number;
  height_cm: number;
  created_at?: string;
}

@Injectable({
  providedIn: 'root'
})
export class TankService {
  private apiUrl = `${environment.apiUrl}/tanks/tanks/`;

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('access_token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  getAll(): Observable<Tank[]> {
    return this.http.get<Tank[]>(this.apiUrl, { headers: this.getHeaders() });
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