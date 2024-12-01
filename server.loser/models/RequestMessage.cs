using System.Text.Json.Serialization;

namespace server.loser.models;

public class RequestMessage
{    
    public string? Id { get; set; }

    [JsonPropertyName("type")]
    public string Type { get; set; }
    [JsonPropertyName("name")]
    public string? Name { get; set; }
    [JsonPropertyName("amount")]
    public int? Amount { get; set; }
    
    
    [JsonPropertyName("red")]
    public bool? Red { get; set; }
    [JsonPropertyName("blue")]
    public bool? Blue { get; set; }
    [JsonPropertyName("green")]
    public bool? Green { get; set; }
    [JsonPropertyName("black")]
    public bool? Black { get; set; }
    [JsonPropertyName("white")]
    public bool? White { get; set; }
    [JsonPropertyName("colorless")]
    public bool? Colorless { get; set; }
    
    
    [JsonPropertyName("target_id")]
    public string? TargetId { get; set; }
    
    [JsonPropertyName("commander_images")]
    public string[] CommanderImages { get; set; }
    
    /// <summary>
    /// Used to update which commander damage to update for target. 
    /// </summary>
    [JsonPropertyName("commander_id")]
    public string? CommaderId { get; set; }
}