using System.Collections.Concurrent;
using System.Net.WebSockets;
using System.Text.Json;
using server.loser.models;

namespace server.loser.Services;

public class SocketService
{
    private readonly ConcurrentDictionary<string, WebSocket> _sockets = new();
    private readonly ConcurrentDictionary<string, User> _users = new();
    private static Random rng = new();

    private User? _currentMonarch;

    private int _currentLastOrder;

    private List<string> _gameLog =
    [
        "A new game has begun."
    ];

    private List<string> _commanderImages = [];
    private List<string> _otherImages = [];

    public SocketService()
    {
        var contentPath = Environment.CurrentDirectory;
        var basePath = Path.Combine(contentPath, "Uploads");

        _commanderImages = getImagesFromDirectory(Path.Combine(basePath, "Commanders"));
        _otherImages = getImagesFromDirectory(Path.Combine(basePath, "Other"));
    }

    private List<string> getImagesFromDirectory(string path)
    {
        List<string> images = [];
        
        if (!Directory.Exists(path))
        {
            Directory.CreateDirectory(path);
        }

        var files = Directory.GetFiles(path);

        foreach (var file in files)
        {
            var split = file.Split('\\');

            images.Add(split[^1]);
        }

        return images;
    }

    public async Task HandleWebSocketConnection(WebSocket socket)
    {
        var buffer = new byte[1024 * 2];

        string? socketId = null;

        while (socket.State == WebSocketState.Open)
        {
            var result = await socket.ReceiveAsync(new ArraySegment<byte>(buffer), default);
            if (result.MessageType == WebSocketMessageType.Close)
            {
                if (result.CloseStatus != null)
                {
                    await socket.CloseAsync(result.CloseStatus.Value, result.CloseStatusDescription, default);
                }

                break;
            }

            RequestMessage? message;

            try
            {
                message = JsonSerializer.Deserialize<RequestMessage>(
                    System.Text.Encoding.UTF8.GetString(buffer[..result.Count]));
            }
            catch (Exception)
            {
                Console.WriteLine("Unable to parse message...");
                return;
            }

            if (message == null)
            {
                return;
            }

            if (socketId != null)
            {
                message.Id = socketId;
            }

            var sId = await HandleMessage(socket, message);

            if (!string.IsNullOrEmpty(sId))
            {
                socketId = sId;
            }
        }

        if (!string.IsNullOrEmpty(socketId))
        {
            if (_sockets.TryRemove(socketId, out _))
            {
                _gameLog.Add($"[{socketId}] left the game.");
            }
        }
    }

    private async Task<string?> HandleMessage(WebSocket socket, RequestMessage requestMessage)
    {
        switch (requestMessage.Type)
        {
            case "name":
                if (!string.IsNullOrEmpty(requestMessage.Id))
                {
                    return null;
                }

                var user = await HandleName(socket, requestMessage);

                if (user == null)
                {
                    return null;
                }

                _sockets[user.Id] = socket;
                await SendChangesToClients();
                return user.Id;
            case "commander":
                HandleCommander(requestMessage);
                break;
            case "commander_change":
                HandleCommanderChange(requestMessage);
                break;
            case "life":
                if (string.IsNullOrEmpty(requestMessage.Id))
                {
                    return null;
                }

                HandleLife(requestMessage);
                break;
            case "monarch":
                HandleMonarch(requestMessage);
                break;
            case "color":
                HandleColorChange(requestMessage);
                break;
            case "restart":
                HandleRestart(requestMessage);
                break;
        }

        await SendChangesToClients();
        return null;
    }

    public async Task HandleCommanderChange(RequestMessage requestMessage)
    {
        if (requestMessage.Id == null || requestMessage.TargetId == null || requestMessage.CommanderImages.Length == 0)
        {
            return;
        }

        var user = _users[requestMessage.TargetId];

        user.CommanderImages.Clear();
        
        user.CommanderImages.AddRange(requestMessage.CommanderImages);
        
        _gameLog.Add($"[{requestMessage.Id}] changed [{requestMessage.TargetId}]'s commanders.");
        
        await SendChangesToClients();
    }

    public async Task AddImage(bool commander, string filePath)
    {
        if (commander)
        {
            _commanderImages.Add(filePath);
        }
        else
        {
            _otherImages.Add(filePath);
        }
        
        await SendChangesToClients();
    }

    private void HandleCommander(RequestMessage requestMessage)
    {
        if (requestMessage.Id == null || requestMessage.TargetId == null || requestMessage.CommaderId == null ||
            !requestMessage.Amount.HasValue)
        {
            return;
        }

        var target = _users[requestMessage.TargetId];

        target.CommanderDamage.TryAdd(requestMessage.CommaderId, 0);

        target.CommanderDamage[requestMessage.CommaderId] += requestMessage.Amount.Value;

        if (target.CommanderDamage[requestMessage.CommaderId] > 21)
        {
            target.CommanderDamage[requestMessage.CommaderId] = 21;
        }

        if (target.CommanderDamage[requestMessage.CommaderId] < 0)
        {
            target.CommanderDamage[requestMessage.CommaderId] = 0;
        }

        target.Life -= requestMessage.Amount.Value;

        _gameLog.Add( $"[{requestMessage.Id}] set {(requestMessage.Id == requestMessage.TargetId ? "their" : "[" + requestMessage.TargetId + "]'s")} commander damage from [{requestMessage.CommaderId}] to {requestMessage.Amount.Value}.");
    }

    private void HandleColorChange(RequestMessage requestMessage)
    {
        var hasChange = false;
        var color = "";
        var add = false;

        if (requestMessage.TargetId == null)
        {
            return;
        }

        if (requestMessage.Blue.HasValue)
        {
            hasChange = true;
            _users[requestMessage.TargetId].Blue = requestMessage.Blue.Value;
            color = "blue";

            add = requestMessage.Blue.HasValue;
        }

        if (requestMessage.Red.HasValue)
        {
            hasChange = true;
            _users[requestMessage.TargetId].Red = requestMessage.Red.Value;
            _users[requestMessage.TargetId].Colorless = false;
            color = "red";

            add = requestMessage.Red.HasValue;
        }

        if (requestMessage.Green.HasValue)
        {
            hasChange = true;
            _users[requestMessage.TargetId].Green = requestMessage.Green.Value;
            _users[requestMessage.TargetId].Colorless = false;
            color = "green";

            add = requestMessage.Green.HasValue;
        }

        if (requestMessage.Black.HasValue)
        {
            hasChange = true;
            _users[requestMessage.TargetId].Black = requestMessage.Black.Value;
            _users[requestMessage.TargetId].Colorless = false;
            color = "black";

            add = requestMessage.Black.HasValue;
        }

        if (requestMessage.White.HasValue)
        {
            hasChange = true;
            _users[requestMessage.TargetId].White = requestMessage.White.Value;
            _users[requestMessage.TargetId].Colorless = false;
            color = "white";

            add = requestMessage.White.HasValue;
        }

        if (requestMessage.Colorless.HasValue)
        {
            hasChange = true;
            _users[requestMessage.TargetId].Colorless = requestMessage.Colorless.Value;

            if (requestMessage.Colorless.Value)
            {
                _users[requestMessage.TargetId].Red = false;
                _users[requestMessage.TargetId].Blue = false;
                _users[requestMessage.TargetId].Black = false;
                _users[requestMessage.TargetId].White = false;
                _users[requestMessage.TargetId].Green = false;
            }

            color = "colorless";

            add = requestMessage.Colorless.HasValue;
        }

        if (!hasChange)
        {
            return;
        }

        if (color == "colorless")
        {
            _gameLog.Add(
                $"[{requestMessage.Id}] {(add ? "assigned" : "unassigned")} {(requestMessage.Id == requestMessage.TargetId ? "themself" : "[" + requestMessage.TargetId + "]")} to colorless");
        }
        else
        {
            var outLog = $"[{requestMessage.Id}] {(add ? "added" : "removed")} {color}";

            if (requestMessage.Id != requestMessage.TargetId)
            {
                outLog += $" to [{requestMessage.TargetId}]'s colors";
            }

            outLog += ".";

            _gameLog.Add(outLog);
        }
    }

    private void HandleMonarch(RequestMessage requestMessage)
    {
        if (requestMessage.TargetId == null)
        {
            return;
        }

        var oldMonarch = _currentMonarch;

        if (oldMonarch != null)
        {
            oldMonarch.Monarch = false;
        }

        _currentMonarch = _users[requestMessage.TargetId];
        _currentMonarch.Monarch = true;

        var message = $"[{_currentMonarch.Id}] became the monarch";

        if (oldMonarch != null)
        {
            message += $", stealing it away from [{oldMonarch.Id}]";
        }

        message += ".";

        _gameLog.Add(message);
    }

    private void HandleRestart(RequestMessage requestMessage)
    {
        
        foreach (var (key, user) in _users)
        {
            if (!_sockets.ContainsKey(key))
            {
                _users.TryRemove(key, out _);
                continue;
            }
            
            user.Life = 40;
            user.CommanderDamage = new ConcurrentDictionary<string, int>();
            user.Monarch = false;
        }
        var order = _users.Keys.OrderBy(_ => rng.Next()).ToList();

        var idx = 1;
        
        
        
        foreach (var o in order)
        {
            _users[o].Order = idx;
            _currentLastOrder = idx;

            idx++;
        }

        _currentMonarch = null;

        _gameLog =
        [
            $"[{requestMessage.Id}] started a new game."
        ];
    }

    private void HandleLife(RequestMessage requestMessage)
    {
        if (requestMessage.Id == null || !requestMessage.Amount.HasValue || requestMessage.TargetId == null)
        {
            return;
        }

        _users[requestMessage.TargetId].Life += requestMessage.Amount.Value;
        
        if (_users[requestMessage.TargetId].Life < 0)
        {
            _users[requestMessage.TargetId].Life = 0;
        }

        _gameLog.Add(
            $"[{requestMessage.Id}] {(requestMessage.Amount > 0 ? "added" : "removed")} {(requestMessage.Amount < 0 ? -requestMessage.Amount : requestMessage.Amount)} from {(requestMessage.Id == requestMessage.TargetId ? "themselves" : "[" + requestMessage.TargetId + "]")}");
    }

    private async Task<User?> HandleName(WebSocket socket, RequestMessage requestMessage)
    {
        if (string.IsNullOrEmpty(requestMessage?.Name))
        {
            return null;
        }

        var user = GetUserWithName(requestMessage.Name);

        if (user == null)
        {
            if (_users.Keys.Count == 4)
            {
                var byteMessage = "reject"u8.ToArray();
                await socket.SendAsync(byteMessage, WebSocketMessageType.Text, true, default);
                return null;
            }
            
            _currentLastOrder++;
            
            user = new User
            {
                Name = requestMessage.Name,
                Order = _currentLastOrder
            };
            
            _users[user.Id] = user;

            _gameLog.Add($"[{user.Id}] joined the game.");
        }
        else
        {
            if (_sockets.ContainsKey(user.Id))
            {
                var byteMessage = "reject"u8.ToArray();
                await socket.SendAsync(byteMessage, WebSocketMessageType.Text, true, default);
                return null;
            }

            _gameLog.Add($"[{user.Id}] rejoined the game.");
        }

        return user;
    }

    private User? GetUserWithName(string name)
    {
        foreach (var user in _users)
        {
            if (user.Value.Name == name)
            {
                return user.Value;
            }
        }

        return null;
    }

    private async Task SendChangesToClients()
    {
        foreach (var (key, socket) in _sockets)
        {
            var response = new ResponseMessage
            {
                Id = key
            };

            var user = _users[key];

            response.User = user;

            var players = _users.Where(u => u.Key != key).Select(u => u.Value);

            response.Players = players.ToList();
            response.GameLog = _gameLog;
            response.CommanderImages = _commanderImages.ToList();

            var jsonString = JsonSerializer.Serialize(response);

            if (string.IsNullOrEmpty(jsonString))
            {
                continue;
            }

            var byteMessage = System.Text.Encoding.ASCII.GetBytes(jsonString);

            await socket.SendAsync(byteMessage, WebSocketMessageType.Text, true, default);
        }
    }
}