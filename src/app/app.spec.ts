import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { App } from './app';

// Tests inspect the real template and mock only HTTP transport.
describe('App TODO page', () => {
  let fixture: ComponentFixture<App>;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();
    fixture = TestBed.createComponent(App);
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges(); // ngOnInit -> GET
  });

  afterEach(() => http.verify());

  function completeInitialLoad(items: { id: string; title: string }[] = []) {
    const req = http.expectOne('/api/todos');
    expect(req.request.method).toBe('GET');
    req.flush(items);
    fixture.detectChanges();
  }

  function submitTitle(title: string) {
    const input = fixture.nativeElement.querySelector('#newTask') as HTMLInputElement;
    input.value = title;
    const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    fixture.detectChanges();
    return input;
  }

  it('shows loading state while GET is pending', () => {
    expect(fixture.nativeElement.textContent).toContain('Loading tasks...');
    expect(fixture.nativeElement.textContent).not.toContain('No tasks yet.');
    completeInitialLoad();
  });

  it('shows the empty state after a successful empty GET', () => {
    completeInitialLoad();
    expect(fixture.nativeElement.textContent).toContain('No tasks yet.');
  });

  it('renders tasks from the backend', () => {
    completeInitialLoad([{ id: 'a', title: 'Buy milk' }, { id: 'b', title: 'Clean garage' }]);
    const rows = fixture.nativeElement.querySelectorAll('li.todo-item');
    expect(rows.length).toBe(2);
    expect(rows[0].textContent).toContain('Buy milk');
    expect(rows[1].textContent).toContain('Clean garage');
  });

  it('rejects blank task input without sending POST', () => {
    completeInitialLoad();
    submitTitle('    ');
    expect(fixture.nativeElement.textContent).toContain('Please enter a task title.');
    http.expectNone(req => req.method === 'POST');
  });

  it('rejects titles over 200 characters without sending POST', () => {
    completeInitialLoad();
    submitTitle('x'.repeat(201));
    expect(fixture.nativeElement.textContent).toContain('200 characters or fewer');
    http.expectNone(req => req.method === 'POST');
  });

  it('adds the server-confirmed item and clears the field after 201', () => {
    completeInitialLoad();
    const input = submitTitle('  Read book  ');
    const req = http.expectOne('/api/todos');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ title: 'Read book' });
    expect(input.value).toContain('Read book'); // no optimistic clear
    req.flush({ id: 'new', title: 'Read book' }, { status: 201, statusText: 'Created' });
    fixture.detectChanges();
    expect(input.value).toBe('');
    expect(fixture.nativeElement.textContent).toContain('Read book');
  });

  it('prevents a double-submit while POST is pending', () => {
    completeInitialLoad();
    submitTitle('Task');
    submitTitle('Task');
    const req = http.expectOne('/api/todos');
    req.flush({ id: '1', title: 'Task' });
    fixture.detectChanges();
    http.expectNone(req => req.method === 'POST');
  });

  it('keeps the draft when adding fails', () => {
    completeInitialLoad();
    const input = submitTitle('Keep draft');
    http.expectOne('/api/todos').flush('failure', { status: 500, statusText: 'Error' });
    fixture.detectChanges();
    expect(input.value).toBe('Keep draft');
    expect(fixture.nativeElement.textContent).toContain('Could not add task.');
  });

  it('removes only the selected task after a successful DELETE', () => {
    completeInitialLoad([{ id: 'a', title: 'Same' }, { id: 'b', title: 'Same' }]);
    const buttons = fixture.nativeElement.querySelectorAll('button.delete-button') as NodeListOf<HTMLButtonElement>;
    buttons[0].click();
    fixture.detectChanges();
    const req = http.expectOne('/api/todos/a');
    expect(req.request.method).toBe('DELETE');
    expect(fixture.nativeElement.querySelectorAll('li.todo-item').length).toBe(2);
    req.flush(null, { status: 204, statusText: 'No Content' });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('li.todo-item').length).toBe(1);
    expect(fixture.componentInstance.todos()[0].id).toBe('b');
  });

  it('disallows adding while a deletion is pending', () => {
    completeInitialLoad([{ id: 'a', title: 'Existing' }]);
    const button = fixture.nativeElement.querySelector('button.delete-button') as HTMLButtonElement;
    button.click();
    fixture.detectChanges();
    submitTitle('Should wait');
    http.expectNone(req => req.method === 'POST');
    http.expectOne('/api/todos/a').flush(null, { status: 204, statusText: 'No Content' });
  });

  it('retains the task and shows an error when deletion fails', () => {
    completeInitialLoad([{ id: 'a', title: 'Keep this' }]);
    (fixture.nativeElement.querySelector('button.delete-button') as HTMLButtonElement).click();
    http.expectOne('/api/todos/a').flush('error', { status: 500, statusText: 'Error' });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Could not delete task.');
    expect(fixture.componentInstance.todos().length).toBe(1);
  });

  it('shows a retry button if GET fails and recovers on retry', () => {
    http.expectOne('/api/todos').flush('error', { status: 503, statusText: 'Unavailable' });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Could not load tasks.');
    (fixture.nativeElement.querySelector('button[type=button]') as HTMLButtonElement).click();
    http.expectOne('/api/todos').flush([{ id: 'r', title: 'Recovered' }]);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Recovered');
  });
});
