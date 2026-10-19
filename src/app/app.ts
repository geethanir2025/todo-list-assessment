import {
  Component,
  DestroyRef,
  OnInit,
  inject,
  signal
} from '@angular/core';

import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { Todo } from './todo';
import { TodoApiService } from './todo-api.service';

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {

  private readonly todoApi = inject(TodoApiService);
  private readonly destroyRef = inject(DestroyRef);

  // Angular Signals
  todos = signal<Todo[]>([]);
  loading = signal<boolean>(true);
  error = signal<string>('');
  adding = signal(false);
  addError = signal('');
  deletingId = signal<string | null>(null);
  deleteError = signal('');

  // Called when the component loads
  ngOnInit(): void {
    this.loadTodos();
  }

  // Get TODO items from .NET API
  loadTodos(): void {

    this.loading.set(true);
    this.error.set('');

    this.todoApi.getTodos()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.todos.set(data);
          this.loading.set(false);
        },
        error: (err) => {
          console.error('Error loading TODOs:', err);
          this.error.set('Could not load tasks.');
          this.loading.set(false);
        }
      });
  }

  addTodo(event: Event, input: HTMLInputElement): void {
  event.preventDefault();

  if (this.adding() || this.loading() || this.error() || this.deletingId() !== null) {
    return;
  }

  const title = input.value.trim();

  if (!title) {
    this.addError.set('Please enter a task title.');
    return;
  }

  if (title.length > 200) {
    this.addError.set('Task title must be 200 characters or fewer.');
    return;
  }

  this.adding.set(true);
  this.addError.set('');

  this.todoApi.addTodo(title)
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe({
      next: (newTodo) => {
        // Add the returned task to the Angular signal
        this.todos.update(current => [...current, newTodo]);

        // Clear the input after successful creation
        input.value = '';
        this.adding.set(false);
      },
      error: () => {
        this.addError.set('Could not add task.');
        this.adding.set(false);
      }
    });
  }

  deleteTodo(id: string): void {

    if (this.deletingId() || this.adding() || this.loading()) {
      return;
    }

    this.deletingId.set(id);
    this.deleteError.set('');

    this.todoApi.deleteTodo(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {

          // Remove the deleted item from the signal
          this.todos.update(current =>
            current.filter(todo => todo.id !== id)
          );

          this.deletingId.set(null);
        },

        error: (err) => {
          console.error('Error deleting TODO:', err);
          this.deleteError.set('Could not delete task.');
          this.deletingId.set(null);
        }
      });
  }
}