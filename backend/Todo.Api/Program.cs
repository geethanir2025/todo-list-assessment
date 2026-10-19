using Todo.Api;
using Todo.Api.Models;
using Todo.Api.Repositories;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddSingleton<ITodoRepository, InMemoryTodoRepository>();

var app = builder.Build();

// Fetch all TODO items
app.MapGet("/api/todos", (ITodoRepository repository) =>
{
  return Results.Ok(repository.GetAll());
});

// Add a new TODO item
app.MapPost("/api/todos", (CreateTodoRequest request, ITodoRepository repository) =>
{
  if (string.IsNullOrWhiteSpace(request.Title))
  {
    return Results.BadRequest("Task title is required.");
  }

  var title = request.Title.Trim();
  if (title.Length > 200)
  {
    return Results.BadRequest("Task title must be 200 characters or fewer.");
  }

  var todo = repository.Add(title);

  return Results.Json(
      todo,
      statusCode: StatusCodes.Status201Created
  );
});

// Delete a TODO item by ID
app.MapDelete("/api/todos/{id}", (Guid id, ITodoRepository repository) =>
{
  bool deleted = repository.Delete(id);

  if (!deleted)
  {
    return Results.NotFound("Task not found.");
  }

  return Results.NoContent();
});

app.Run();

public record CreateTodoRequest(string? Title);

// Expose the top-level entry point to in-process integration tests.
public partial class Program { }
