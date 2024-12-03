using server.loser.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddCors();
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddSingleton<SocketService>();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors(options => options.AllowAnyMethod().AllowAnyHeader().WithOrigins(new []{"http://localhost:4201", "http://http://163.47.239.93:3000"}).AllowCredentials());

app.UseHttpsRedirection();

app.UseWebSockets();
app.MapControllers();

app.Run();