import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { User } from './user';

@Injectable({
  providedIn: 'root'
})
export class ImpersonationService {
  private impersonatedUserSubject = new BehaviorSubject<User | null>(null);
  public impersonatedUser$ = this.impersonatedUserSubject.asObservable();

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    const stored = localStorage.getItem('impersonated_user');
    if (stored) {
      try {
        this.impersonatedUserSubject.next(JSON.parse(stored));
      } catch {
        localStorage.removeItem('impersonated_user');
      }
    }
  }

  startImpersonation(user: User): void {
    localStorage.setItem('impersonated_user', JSON.stringify(user));
    this.impersonatedUserSubject.next(user);
  }

  stopImpersonation(): void {
    localStorage.removeItem('impersonated_user');
    this.impersonatedUserSubject.next(null);
  }

  getImpersonatedUser(): User | null {
    return this.impersonatedUserSubject.value;
  }

  isImpersonating(): boolean {
    return this.impersonatedUserSubject.value !== null;
  }
}