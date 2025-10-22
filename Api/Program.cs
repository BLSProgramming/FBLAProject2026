using Api.Data;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// Password hasher service
builder.Services.AddSingleton<Api.Services.IPasswordHasher, Api.Services.PasswordHasher>();

builder.Services.AddControllers();

// Register IHttpClientFactory for HttpClient usage in controllers (used for Turnstile verification)
builder.Services.AddHttpClient();

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

// Serve uploaded files from the /uploads path
var uploadsPath = Path.Combine(Directory.GetCurrentDirectory(), "Uploads");
if (!Directory.Exists(uploadsPath)) Directory.CreateDirectory(uploadsPath);
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(uploadsPath),
    RequestPath = "/uploads"
});

app.MapControllers();

// Run the app
app.Run();
