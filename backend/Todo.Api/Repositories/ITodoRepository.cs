using Todo.Api.Models;

namespace Todo.Api.Repositories
{
  public interface ITodoRepository
  {
    IReadOnlyList<TodoItem> GetAll();

    TodoItem Add(string title);

    bool Delete(Guid id);
  }
}
