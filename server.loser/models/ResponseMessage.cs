using System.Text.Json.Serialization;

namespace server.loser.models;

public class ResponseMessage
{
    [JsonPropertyName("id")]
    public string Id { get; set; }
    [JsonPropertyName("players")]
    public List<User> Players { get; set; }
    [JsonPropertyName("user")]
    public User User { get; set; }
    [JsonPropertyName("game_log")]
    public List<string> GameLog { get; set; }
    [JsonPropertyName("commander_images")]
    
    public List<string> CommanderImages { get; set; }
    [JsonPropertyName("other_images")]
    
    public List<string> OtherImages { get; set; }
}