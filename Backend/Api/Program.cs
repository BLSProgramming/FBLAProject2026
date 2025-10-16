using Api.Data;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// Password hasher service
builder.Services.AddSingleton<Api.Services.IPasswordHasher, Api.Services.PasswordHasher>();

builder.Services.AddControllers();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp", policy =>
    {
        policy.WithOrigins("http://localhost:5173")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

var app = builder.Build();


app.UseHttpsRedirection();


app.UseCors("AllowReactApp");

app.UseAuthorization();


app.MapControllers();

// Run the app
app.Run();
