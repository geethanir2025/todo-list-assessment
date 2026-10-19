using Todo.Api.Models;

namespace Todo.Api.Repositories
{
  public class InMemoryTodoRepository : ITodoRepository
  {
    private readonly List<TodoItem> _todos = new();
    private readonly object _lock = new();

    public IReadOnlyList<TodoItem> GetAll()
    {
      lock (_lock)
      {
        return _todos.ToArray();
      }
    }

    public TodoItem Add(string title)
    {
      lock (_lock)
      {
        var todo = new TodoItem(
            Guid.NewGuid(),
            title
        );

        _todos.Add(todo);

        return todo;
      }
    }

    public bool Delete(Guid id)
    {
      lock (_lock)
      {
        var todo = _todos.FirstOrDefault(x => x.Id == id);

        if (todo is null)
          return false;

        _todos.Remove(todo);

        return true;
      }
    }
  }
}
