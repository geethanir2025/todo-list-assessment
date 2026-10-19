using Todo.Api.Repositories;

namespace Todo.Api.Tests.Unit;

public class InMemoryTodoRepositoryTests
{
    [Fact]
    public void NewRepository_StartsEmpty()
    {
        var repository = new InMemoryTodoRepository();
        Assert.Empty(repository.GetAll());
    }

    [Fact]
    public void Add_GeneratesDistinctIds_AndPreservesInsertionOrder()
    {
        var repository = new InMemoryTodoRepository();
        var first = repository.Add("Buy milk");
        var second = repository.Add("Buy milk");

        Assert.NotEqual(Guid.Empty, first.Id);
        Assert.NotEqual(first.Id, second.Id);
        Assert.Equal(new[] { first.Id, second.Id }, repository.GetAll().Select(x => x.Id));
        Assert.All(repository.GetAll(), x => Assert.Equal("Buy milk", x.Title));
    }

    [Fact]
    public void Delete_RemovesOnlyRequestedItem_AndReturnsFalseForMissingId()
    {
        var repository = new InMemoryTodoRepository();
        var first = repository.Add("First");
        var second = repository.Add("Second");

        Assert.True(repository.Delete(first.Id));
        Assert.False(repository.Delete(first.Id));
        Assert.False(repository.Delete(Guid.NewGuid()));
        Assert.Equal(second.Id, Assert.Single(repository.GetAll()).Id);
    }

    [Fact]
    public void GetAll_ReturnsDetachedSnapshot()
    {
        var repository = new InMemoryTodoRepository();
        repository.Add("Original");

        var snapshot = repository.GetAll();
        repository.Add("Later");

        Assert.Single(snapshot);
        Assert.Equal(2, repository.GetAll().Count);
    }

    [Fact]
    public async Task ConcurrentAdds_KeepAllItemsAndUniqueIds()
    {
        var repository = new InMemoryTodoRepository();
        var added = await Task.WhenAll(Enumerable.Range(0, 100)
            .Select(i => Task.Run(() => repository.Add($"Task {i}"))));

        Assert.Equal(100, repository.GetAll().Count);
        Assert.Equal(100, added.Select(x => x.Id).Distinct().Count());
    }

    [Fact]
    public async Task ConcurrentDeletes_OnlyOneSucceeds()
    {
        var repository = new InMemoryTodoRepository();
        var todo = repository.Add("One");
        var results = await Task.WhenAll(Enumerable.Range(0, 16)
            .Select(_ => Task.Run(() => repository.Delete(todo.Id))));

        Assert.Single(results.Where(success => success));
        Assert.Empty(repository.GetAll());
    }
}
