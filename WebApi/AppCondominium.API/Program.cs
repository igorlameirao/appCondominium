using System.Net;
using System.Text;
using AppCondominium.API.Authorization;
using AppCondominium.API.Middleware;
using AppCondominium.Application.Interfaces;
using AppCondominium.Infrastructure;
using AppCondominium.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Mvc.Authorization;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

var jwtKey = builder.Configuration["Jwt:Key"];
if (string.IsNullOrWhiteSpace(jwtKey) || jwtKey.Length < 32)
{
    throw new InvalidOperationException(
        "CONFIGURAÇÃO OBRIGATÓRIA: Jwt:Key ausente ou com menos de 32 caracteres. " +
        "Desenvolvimento: dotnet user-secrets set \"Jwt:Key\" \"...\" (em WebApi/AppCondominium.API). " +
        "Produção: variável de ambiente Jwt__Key. " +
        "Modelo: appsettings.Example.json");
}
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
            ValidateIssuer = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"] ?? "AppCondominium",
            ValidateAudience = true,
            ValidAudience = builder.Configuration["Jwt:Audience"] ?? "AppCondominium-App",
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromMinutes(2)
        };
    });

builder.Services.AddAuthorization();
builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddScoped<AppCondominium.API.Storage.ArquivoAplicacao>();
builder.Services.AddHostedService<PermissionCatalogSync>();
builder.WebHost.ConfigureKestrel(o => o.Limits.MaxRequestBodySize = 10 * 1024 * 1024);

builder.Services.AddControllers(options =>
{
    options.Filters.Add(new AuthorizeFilter());
})
.AddJsonOptions(o =>
{
    o.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
    o.JsonSerializerOptions.PropertyNameCaseInsensitive = true;
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "AppCondominium API", Version = "v1" });
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Bearer",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            Array.Empty<string>()
        }
    });
});

if (builder.Environment.IsDevelopment())
{
    builder.Services.AddCors(o => o.AddDefaultPolicy(p =>
        p.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod()));
}
else
{
    var corsOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? Array.Empty<string>();
    builder.Services.AddCors(o => o.AddDefaultPolicy(p =>
    {
        if (corsOrigins.Length > 0)
            p.WithOrigins(corsOrigins).AllowAnyHeader().AllowAnyMethod();
        else
            p.AllowAnyHeader().AllowAnyMethod();
    }));
}

var app = builder.Build();

if (!app.Environment.IsDevelopment())
{
    var forwardedHeaders = new ForwardedHeadersOptions
    {
        ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto
    };
    forwardedHeaders.KnownProxies.Add(IPAddress.Loopback);
    forwardedHeaders.KnownProxies.Add(IPAddress.IPv6Loopback);
    app.UseForwardedHeaders(forwardedHeaders);
}

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    var hasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher>();
    var config = scope.ServiceProvider.GetRequiredService<IConfiguration>();
    var logger = scope.ServiceProvider.GetRequiredService<ILoggerFactory>().CreateLogger("Bootstrap");
    await AdminBootstrapSeeder.SeedAsync(db, hasher, config, app.Environment.IsDevelopment(), logger);
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseMiddleware<ApiExceptionMiddleware>();
app.UseCors();
app.UseAuthentication();
app.UseMiddleware<CondominioContextMiddleware>();
app.UseAuthorization();
app.MapControllers();

app.Run();
