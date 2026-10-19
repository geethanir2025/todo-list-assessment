# TODO List — Angular and ASP.NET Core

Small full-stack TODO application supporting list, add and delete operations. The web UI uses Angular signals and a typed HttpClient service; a .NET Minimal API stores tasks in a process-local, thread-safe in-memory repository.

## Prerequisites

- Node.js compatible with Angular 22 (for example Node 24.15+), and npm
- .NET 10 SDK
- No database or globally installed Angular CLI is required

## Run locally

From the repository root, start the backend in one terminal:

```powershell
dotnet restore backend/Todo.Api/Todo.Api.csproj
dotnet run --project backend/Todo.Api --launch-profile http
```

The API listens on **http://localhost:5001**.

In a second terminal, from the repository root:

```powershell
npm install
npm start
```

Open **http://localhost:4201**. `npm start` runs Angular with the proxy configured in `angular.json`; calls to `/api/**` are forwarded to port 5001. Start the backend before testing the UI. If another process is using either port, stop that process or update the respective configuration and run command together.

## Features and API

| Method | Endpoint | Behaviour |
| --- | --- | --- |
| GET | `/api/todos` | Returns an array of tasks, oldest first |
| POST | `/api/todos` | Accepts `{ "title": "Buy milk" }` and returns 201 with a generated ID |
| DELETE | `/api/todos/{id}` | Deletes by GUID, returns 204; missing IDs return 404 |

Titles are trimmed, must be nonempty and must not exceed 200 UTF-16 code units. Duplicate titles are allowed. Angular waits for successful server responses before updating the displayed list. Errors are shown with a retry button for failed initial loading, or a contextual message for add/delete.

## Architecture

- `src/app/app.ts` and `app.html`: page UI and Angular signals
- `src/app/todo-api.service.ts`: typed HTTP operations
- `backend/Todo.Api/Program.cs`: .NET Minimal API endpoints and DI registration
- `backend/Todo.Api/Repositories`: `ITodoRepository` contract and locked in-memory implementation
- `backend/Todo.Api.Tests`: repository unit and HTTP integration tests

The repository is registered as a singleton and is shared by all requests to the same backend process. A backend restart clears all tasks; this application has no persistent database or user authentication.

## Build and test

From the repository root:

```powershell
# Backend API build
dotnet build backend/Todo.Api/Todo.Api.csproj

# Backend tests (run without a development server)
dotnet test backend/Todo.Api.Tests/Todo.Api.Tests.csproj

# Frontend tests (run without a development server)
npm ci
npm run test:ci

# Angular production build
npm run build
```

The backend test project uses xUnit v3, Microsoft's HTTP integration testing package and `WebApplicationFactory`. The frontend uses Angular's default Vitest runner and `HttpTestingController`. The tests use isolated repositories or mocked HTTP endpoints; a running backend is not required.

**Verification:** Test files were created during review, but their successful execution has **not** been verified in the review environment. Before submitting, run the commands above and record actual results. Also manually exercise GET, POST and DELETE through the Angular UI, including a browser refresh.

## Limitations

- Tasks are shared between clients using one backend process and lost after a restart.
- No database, authentication, editing or completion state.
- The Angular proxy is a **local development** convenience. Static production assets require a web server to route `/api` to the backend; publishing source on GitHub does not host this application.
- A failed POST/DELETE connection can leave the server state uncertain; reload the list before deliberately retrying to avoid accidental duplicate additions.

## Dependencies and references

- [Angular framework and CLI](https://angular.dev/)
- [Angular HTTP testing](https://angular.dev/guide/http/testing)
- [TypeScript](https://www.typescriptlang.org/)
- [RxJS](https://rxjs.dev/)
- [ASP.NET Core Minimal APIs](https://learn.microsoft.com/aspnet/core/fundamentals/minimal-apis/overview)
- [ASP.NET Core integration testing](https://learn.microsoft.com/aspnet/core/test/integration-tests)
- [Vitest](https://vitest.dev/)
- [xUnit.net](https://xunit.net/)
- [GitHub Actions](https://docs.github.com/actions) (not configured in this project)

Installed versions are specified in `package.json`, `package-lock.json` and the relevant `.csproj` files. Include any additional examples or development assistance according to the assessment's attribution and authorship rules before submission.

## Verification Results

The following checks were completed locally on Windows
on 19 October 2026.

| Verification | Result |
| --- | --- |
| .NET restore and build | Passed |
| Backend automated tests | 15 passed, 0 failed |
| Angular automated tests | 16 passed, 0 failed |
| Angular production build | Passed |
| Total automated tests | 31 passed, 0 failed |

The backend uses xUnit v3 with Microsoft Testing Platform.
The frontend uses Vitest with Angular's testing utilities.

The backend test run reported non-blocking xUnit1051
analyzer warnings relating to cancellation tokens.

Final end-to-end browser verification of the updated
project should be completed before submission.


### Backend Test Runner

The backend test project uses xUnit v3 and
Microsoft Testing Platform.

The repository includes `global.json` to configure
the .NET test runner.

Run backend tests from the repository root:

```powershell
dotnet test backend/Todo.Api.Tests/Todo.Api.Tests.csproj
```