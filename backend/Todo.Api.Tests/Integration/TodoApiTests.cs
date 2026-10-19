using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Todo.Api.Models;

namespace Todo.Api.Tests.Integration;

public class TodoApiTests
{
    [Fact]
    public async Task NewHost_GetTodos_ReturnsEmptyArray()
    {
        using var factory = new WebApplicationFactory<Program>();
        using var client = factory.CreateClient();

        using var response = await client.GetAsync("/api/todos");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Empty((await response.Content.ReadFromJsonAsync<TodoItem[]>())!);
    }

    [Fact]
    public async Task PostGetDelete_FollowsExpectedHttpContract()
    {
        using var factory = new WebApplicationFactory<Program>();
        using var client = factory.CreateClient();

        using var created = await client.PostAsJsonAsync("/api/todos", new { title = "  Buy milk  " });
        Assert.Equal(HttpStatusCode.Created, created.StatusCode);
        var todo = await created.Content.ReadFromJsonAsync<TodoItem>();
        Assert.NotNull(todo);
        Assert.NotEqual(Guid.Empty, todo.Id);
        Assert.Equal("Buy milk", todo.Title);

        var items = await client.GetFromJsonAsync<TodoItem[]>("/api/todos");
        Assert.Equal(todo.Id, Assert.Single(items!).Id);

        using var removed = await client.DeleteAsync($"/api/todos/{todo.Id}");
        Assert.Equal(HttpStatusCode.NoContent, removed.StatusCode);
        Assert.Equal(string.Empty, await removed.Content.ReadAsStringAsync());
        Assert.Empty((await client.GetFromJsonAsync<TodoItem[]>("/api/todos"))!);

        using var repeated = await client.DeleteAsync($"/api/todos/{todo.Id}");
        Assert.Equal(HttpStatusCode.NotFound, repeated.StatusCode);
    }

    [Theory]
    [InlineData("")]
    [InlineData(" ")]
    [InlineData("  	  ")]
    public async Task PostRejectsMissingText(string title)
    {
        using var factory = new WebApplicationFactory<Program>();
        using var client = factory.CreateClient();
        using var response = await client.PostAsJsonAsync("/api/todos", new { title });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Empty((await client.GetFromJsonAsync<TodoItem[]>("/api/todos"))!);
    }

    [Fact]
    public async Task PostRejectsMissingTitleAndLongTitle()
    {
        using var factory = new WebApplicationFactory<Program>();
        using var client = factory.CreateClient();

        using var missing = await client.PostAsJsonAsync("/api/todos", new { });
        using var tooLong = await client.PostAsJsonAsync("/api/todos", new { title = new string('x', 201) });

        Assert.Equal(HttpStatusCode.BadRequest, missing.StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, tooLong.StatusCode);
        Assert.Empty((await client.GetFromJsonAsync<TodoItem[]>("/api/todos"))!);
    }

    [Fact]
    public async Task SeparateHttpClientsOnSameHostShareRepository()
    {
        using var factory = new WebApplicationFactory<Program>();
        using var firstClient = factory.CreateClient();
        using var secondClient = factory.CreateClient();

        using var response = await firstClient.PostAsJsonAsync("/api/todos", new { title = "Shared" });
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        var items = await secondClient.GetFromJsonAsync<TodoItem[]>("/api/todos");
        Assert.Equal("Shared", Assert.Single(items!).Title);
    }

    [Fact]
    public async Task DuplicateTitles_CanBeDeletedIndependently()
    {
        using var factory = new WebApplicationFactory<Program>();
        using var client = factory.CreateClient();

        using var firstResult = await client.PostAsJsonAsync("/api/todos", new { title = "Same" });
        using var secondResult = await client.PostAsJsonAsync("/api/todos", new { title = "Same" });
        var first = (await firstResult.Content.ReadFromJsonAsync<TodoItem>())!;
        var second = (await secondResult.Content.ReadFromJsonAsync<TodoItem>())!;
        Assert.NotEqual(first.Id, second.Id);

        using var delete = await client.DeleteAsync($"/api/todos/{first.Id}");
        Assert.Equal(HttpStatusCode.NoContent, delete.StatusCode);
        Assert.Equal(second.Id, Assert.Single((await client.GetFromJsonAsync<TodoItem[]>("/api/todos"))!).Id);
    }

    [Fact]
    public async Task MalformedId_ReturnsBadRequest()
    {
        using var factory = new WebApplicationFactory<Program>();
        using var client = factory.CreateClient();

        using var response = await client.DeleteAsync("/api/todos/not-a-guid");
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

}
