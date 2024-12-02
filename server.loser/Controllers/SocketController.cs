using System.Net;
using Microsoft.AspNetCore.Mvc;
using server.loser.Services;

namespace server.loser.Controllers;

[ApiController]
[Route("game")]
public class GameController : ControllerBase
{

    private SocketService _socketService;

    private string[] _allowedFileTypes = [".png", ".jpg"];
    
    public GameController (
        SocketService socketService
    )
    {
        _socketService = socketService;
    }
    
    [HttpGet]
    public async Task<IActionResult> Get()
    {
        return Ok("Hi");
    }

    [HttpGet("image/{type}/{name}")]
    public async Task<IActionResult> GetImage(string type, string name)
    {
        if (string.IsNullOrEmpty(name) || string.IsNullOrEmpty(type))
        {
            return BadRequest("Invalid file name");
        }
        
        var contentPath = Environment.CurrentDirectory;
        
        if (contentPath == null)
        {
            return Ok();
        }
        
        var path = Path.Combine(contentPath, "Uploads");

        if (type == "commander")
        {
            path = Path.Combine(path, "Commanders");
        }
        else
        {
            path = Path.Combine("other", path);
        }

        if (!Directory.Exists(path))
        {
             Directory.CreateDirectory(path);
        }

        var fileName = Path.Combine(path, name);

        if (!System.IO.File.Exists(fileName))
        {
            return BadRequest("Image doesn't exist");
        }
        
        var b = await System.IO.File.ReadAllBytesAsync(fileName);

        return File(b, "image/jpeg");
    }

    [HttpPost("image/{type}")]
    public async Task<IActionResult> UploadImage(string type, IFormFile file)
    {
        var contentPath = Environment.CurrentDirectory;
        
        if (contentPath == null)
        {
            return Ok();
        }
        
        var path = Path.Combine(contentPath, "Uploads");

        if (type == "commander")
        {
            path = Path.Combine(path, "Commanders");
        } 
        else if (type == "other")
        {
            path = Path.Combine(path, "Other");
        }
        else
        {
            return BadRequest("Invalid type");
        }

        if (!Directory.Exists(path))
        {
            Directory.CreateDirectory(path);
        }

        // Check the allowed extensions
        var ext = Path.GetExtension(file.FileName);
        if (!_allowedFileTypes.Contains(ext))
        {
            return BadRequest($"Only {string.Join(",", _allowedFileTypes)} are allowed.");
        }

        var fileNameWithPath = Path.Combine(path, file.FileName);
        await using var stream = new FileStream(fileNameWithPath, FileMode.Create);
        await file.CopyToAsync(stream);

        await _socketService.AddImage(type == "commander", file.FileName);

        return Ok();
    }

    [ApiExplorerSettings(IgnoreApi = true)]
    [Route("ws")]
    public async Task HandleSocketConnection()
    {
        if (!HttpContext.WebSockets.IsWebSocketRequest)
        {
            HttpContext.Response.StatusCode = (int)HttpStatusCode.BadRequest;
        }

        using var ws = await HttpContext.WebSockets.AcceptWebSocketAsync();

        await _socketService.HandleWebSocketConnection(ws);
    }
    
}