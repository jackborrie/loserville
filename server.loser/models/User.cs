using System.Collections.Concurrent;
using System.Text.Json.Serialization;

namespace server.loser.models;

public class User
{
    [JsonPropertyName("id")]
    public string Id { get; set; }
    [JsonPropertyName("name")]
    public string Name { get; set; }

    [JsonPropertyName("commander_damage")]
    public ConcurrentDictionary<string, int> CommanderDamage { get; set; } = new();
    [JsonPropertyName("monarch")]
    public bool Monarch { get; set; } = false;
    [JsonPropertyName("life")]
    public int Life { get; set; } = 40;

    [JsonPropertyName("red")]
    public bool Red { get; set; } = false;
    [JsonPropertyName("green")]
    public bool Green { get; set; } = false;
    [JsonPropertyName("black")]
    public bool Black { get; set; } = false;
    [JsonPropertyName("blue")]
    public bool Blue { get; set; } = false;
    [JsonPropertyName("white")]
    public bool White { get; set; } = false;
    [JsonPropertyName("colorless")]
    public bool Colorless { get; set; } = false;
    [JsonPropertyName("order")]
    public int Order { get; set; }

    public User()
    {
        Id = Guid.NewGuid().ToString();
    }
}