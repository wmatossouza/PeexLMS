using System.Security.Cryptography;
using System.Text;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Peex.Api.Data;
using Peex.Api.Endpoints;
using Peex.Api.Models;
using Peex.Api.Services;

var builder = WebApplication.CreateBuilder(args);

// Não anuncia o servidor nos cabeçalhos de resposta.
builder.WebHost.ConfigureKestrel(opcoes => opcoes.AddServerHeader = false);

// Segredos nunca ficam no repositório. Fora de Development, Jwt:Key é obrigatória (ver README).
// Em Development, se não vier configurada, gera-se uma chave aleatória a cada subida
// (as sessões abertas expiram ao reiniciar o backend).
var chaveJwt = builder.Configuration["Jwt:Key"];
if (string.IsNullOrWhiteSpace(chaveJwt) || chaveJwt.Length < 32)
{
    if (!builder.Environment.IsDevelopment())
        throw new InvalidOperationException("Jwt:Key ausente ou curta (mínimo 32 caracteres). Defina Jwt__Key (ver README).");

    builder.Configuration["Jwt:Key"] = Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));
}
if (string.IsNullOrWhiteSpace(builder.Configuration.GetConnectionString("DefaultConnection")))
    throw new InvalidOperationException("ConnectionStrings:DefaultConnection ausente. Defina ConnectionStrings__DefaultConnection (ver README).");

builder.Services.ConfigureHttpJsonOptions(options =>
    options.SerializerOptions.Converters.Add(new JsonStringEnumConverter()));

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.Http,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
    });
    options.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
    {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Reference = new Microsoft.OpenApi.Models.OpenApiReference { Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            []
        }
    });
});

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services
    .AddIdentityCore<Usuario>(options =>
    {
        options.Password.RequiredLength = 8;
        options.Lockout.MaxFailedAccessAttempts = 5;
        options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(10);
        options.User.RequireUniqueEmail = true;
    })
    .AddRoles<IdentityRole<int>>()
    .AddEntityFrameworkStores<AppDbContext>();

builder.Services.AddScoped<TokenService>();

builder.Services
    .AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
        options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    })
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!)),
            ClockSkew = TimeSpan.FromSeconds(30),
        };
    });

builder.Services.AddAuthorizationBuilder()
    .AddPolicy("AdminOuInstrutor", policy => policy.RequireRole("Admin", "Instrutor"))
    .AddPolicy("Aluno", policy => policy.RequireRole("Aluno"));

builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
    {
        var origins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
                      ?? ["http://localhost:5173"];
        policy.WithOrigins(origins)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("Frontend");

// Falhas inesperadas viram uma resposta genérica (sem stack trace, nem em Development).
// O detalhe fica só no log do servidor, ligado ao traceId devolvido ao cliente.
app.UseExceptionHandler(erroApp => erroApp.Run(async contexto =>
{
    var excecao = contexto.Features.Get<IExceptionHandlerFeature>()?.Error;
    var requisicaoInvalida = excecao is BadHttpRequestException;
    var status = requisicaoInvalida ? StatusCodes.Status400BadRequest : StatusCodes.Status500InternalServerError;

    contexto.RequestServices.GetRequiredService<ILoggerFactory>().CreateLogger("Erros")
        .LogError(excecao, "Erro ao processar {Metodo} {Caminho} (traceId {TraceId})",
            contexto.Request.Method, contexto.Request.Path, contexto.TraceIdentifier);

    contexto.Response.StatusCode = status;
    await contexto.Response.WriteAsJsonAsync(new
    {
        mensagem = requisicaoInvalida
            ? "Requisição inválida."
            : "Ocorreu um erro inesperado. Tente novamente em instantes.",
        traceId = contexto.TraceIdentifier,
    });
}));
app.UseAuthentication();
app.UseAuthorization();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate();

    var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole<int>>>();
    foreach (var papel in new[] { "Aluno", "Instrutor", "Admin" })
    {
        if (!await roleManager.RoleExistsAsync(papel))
            await roleManager.CreateAsync(new IdentityRole<int>(papel));
    }

    // Dados de demonstração: só em Development e só com Seed:Demo=true (ligado no docker-compose).
    if (app.Environment.IsDevelopment() && app.Configuration.GetValue<bool>("Seed:Demo"))
        await DbSeeder.SeedDemoAsync(scope.ServiceProvider);
}

app.MapGet("/health", () => Results.Ok(new { status = "ok" }));

app.MapAuthEndpoints();
app.MapTrilhaEndpoints();
app.MapCursoEndpoints();
app.MapAulaEndpoints();
app.MapQuizEndpoints();
app.MapProgressoEndpoints();
app.MapRelatorioEndpoints();

app.Run();
