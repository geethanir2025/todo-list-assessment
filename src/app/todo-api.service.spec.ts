import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TodoApiService } from './todo-api.service';

// These tests use Angular's HTTP testing backend; no .NET server is needed.
describe('TodoApiService', () => {
  let service: TodoApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(TodoApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('GET requests and returns the todo collection', () => {
    let result: { id: string; title: string }[] | undefined;
    service.getTodos().subscribe(value => result = value);
    const req = http.expectOne('/api/todos');
    expect(req.request.method).toBe('GET');
    req.flush([{ id: '1', title: 'Buy milk' }]);
    expect(result?.[0]?.title).toBe('Buy milk');
  });

  it('POST sends a title and returns the created task', () => {
    let id: string | undefined;
    service.addTodo('Clean garage').subscribe(value => id = value.id);
    const req = http.expectOne('/api/todos');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ title: 'Clean garage' });
    req.flush({ id: 'created-id', title: 'Clean garage' }, { status: 201, statusText: 'Created' });
    expect(id).toBe('created-id');
  });

  it('DELETE targets only the requested task ID', () => {
    let completed = false;
    service.deleteTodo('todo/id').subscribe(() => completed = true);
    const req = http.expectOne('/api/todos/todo%2Fid');
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });
    expect(completed).toBe(true);
  });

  it('surfaces API errors to the caller', () => {
    let failed = false;
    service.getTodos().subscribe({ error: () => failed = true });
    const req = http.expectOne('/api/todos');
    req.flush('Service unavailable', { status: 503, statusText: 'Service Unavailable' });
    expect(failed).toBe(true);
  });
});
