import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface Rol {
  id: number;
  nombre: string;
  estado: boolean;
}

export interface User {
  id: number;
  username: string;
  email: string;
  nombre: string;
  apellido: string;
  is_active: boolean;
  roles: Rol[];
  is_admin?: boolean;
}

export interface CreateUserData {
  username: string;
  email: string;
  password: string;
  nombre: string;
  apellido: string;
  is_active: boolean;
  roles: number[];
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = `${environment.apiUrl}/users/usuarios/`;
  private rolesUrl = `${environment.apiUrl}/users/roles/`;

  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('access_token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  getMe(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}me/`, { headers: this.getHeaders() }).pipe(
      tap(user => this.currentUserSubject.next(user))
    );
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isAdmin(): boolean {
    const user = this.currentUserSubject.value;
    return user?.is_admin === true;
  }

  getAll(): Observable<User[]> {
    return this.http.get<User[]>(this.apiUrl, { headers: this.getHeaders() });
  }

  create(data: CreateUserData): Observable<User> {
    return this.http.post<User>(this.apiUrl, data, { headers: this.getHeaders() });
  }

  update(id: number, data: Partial<CreateUserData>): Observable<User> {
    return this.http.patch<User>(`${this.apiUrl}${id}/`, data, { headers: this.getHeaders() });
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}${id}/`, { headers: this.getHeaders() });
  }

  resetPassword(id: number, newPassword: string): Observable<any> {
    return this.http.post(`${this.apiUrl}${id}/reset-password/`, { new_password: newPassword }, { headers: this.getHeaders() });
  }

  changeMyPassword(currentPassword: string, newPassword: string): Observable<any> {
    return this.http.post(`${this.apiUrl}change-password/`, {
      current_password: currentPassword,
      new_password: newPassword
    }, { headers: this.getHeaders() });
  }

  updateMyProfile(data: { nombre?: string; apellido?: string; email?: string }): Observable<User> {
    return this.http.patch<User>(`${this.apiUrl}update-profile/`, data, { headers: this.getHeaders() }).pipe(
      tap(user => this.currentUserSubject.next(user))
    );
  }

  getRoles(): Observable<Rol[]> {
    return this.http.get<Rol[]>(this.rolesUrl, { headers: this.getHeaders() });
  }

  clearUser(): void {
    this.currentUserSubject.next(null);
  }
}