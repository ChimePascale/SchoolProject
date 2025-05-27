import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

interface AuthResponse {
  token: string;
}

interface User {
  username: string;
  password: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:5000/api/auth';
  private tokenExpirationTimer: any;
  private userSubject = new BehaviorSubject<boolean>(this.isLoggedIn());
  public user$ = this.userSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {
    // Check token validity on service initialization
    if (this.isLoggedIn()) {
      this.checkTokenExpiration();
    }
  }

  register(user: User): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, user).pipe(
      catchError(this.handleError)
    );
  }

  login(user: User): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, user).pipe(
      tap((response: AuthResponse) => {
        this.handleAuthentication(response.token);
      }),
      catchError(this.handleError)
    );
  }

  logout(): void {
    localStorage.removeItem('token');
    this.userSubject.next(false);
    if (this.tokenExpirationTimer) {
      clearTimeout(this.tokenExpirationTimer);
    }
    this.tokenExpirationTimer = null;
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  // Parse JWT token to get expiration
  private getTokenExpirationDate(token: string): Date | null {
    try {
      const decoded = JSON.parse(atob(token.split('.')[1]));
      if (decoded.exp === undefined) return null;
      
      const date = new Date(0);
      date.setUTCSeconds(decoded.exp);
      return date;
    } catch (e) {
      return null;
    }
  }

  // Check if token is expired
  private isTokenExpired(token: string): boolean {
    const expirationDate = this.getTokenExpirationDate(token);
    if (!expirationDate) return true;
    return expirationDate.valueOf() <= new Date().valueOf();
  }

  // Set auto logout when token expires
  private checkTokenExpiration(): void {
    const token = this.getToken();
    if (!token) return;

    if (this.isTokenExpired(token)) {
      this.logout();
      return;
    }

    const expirationDate = this.getTokenExpirationDate(token);
    if (expirationDate) {
      const expiresIn = expirationDate.valueOf() - new Date().valueOf();
      this.autoLogout(expiresIn);
    }
  }

  // Auto logout after token expiration
  private autoLogout(expirationDuration: number): void {
    this.tokenExpirationTimer = setTimeout(() => {
      this.logout();
    }, expirationDuration);
  }

  // Handle successful authentication
  private handleAuthentication(token: string): void {
    localStorage.setItem('token', token);
    this.userSubject.next(true);
    this.checkTokenExpiration();
  }

  // Error handling
  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An unknown error occurred!';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      if (error.status === 401) {
        errorMessage = 'Authentication failed. Please check your credentials.';
      } else if (error.error && typeof error.error === 'object' && error.error.message) {
        errorMessage = error.error.message;
      } else if (error.error && typeof error.error === 'string') {
        errorMessage = error.error;
      } else {
        errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
      }
    }
    
    return throwError(() => new Error(errorMessage));
  }
}
