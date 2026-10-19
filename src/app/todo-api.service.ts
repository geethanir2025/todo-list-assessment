import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Todo } from './todo';

@Injectable({
  providedIn: 'root'
})
export class TodoApiService {

  private readonly http = inject(HttpClient);

  private readonly apiUrl = '/api/todos';

  getTodos(): Observable<Todo[]> {
    return this.http.get<Todo[]>(this.apiUrl);
  }

  addTodo(title: string): Observable<Todo> {
    return this.http.post<Todo>(this.apiUrl, { title });
  }

  deleteTodo(id: string): Observable<void> {
    return this.http.delete<void>(
        `${this.apiUrl}/${encodeURIComponent(id)}`
    );
  }
}