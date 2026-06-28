using System.Security.Claims;
using AppCondominium.Application.Interfaces;

namespace AppCondominium.API.Middleware;

/// <summary>
/// Propaga IdCondominio do JWT para ICondominioContext (RT-Gerais 12).
/// </summary>
public class CondominioContextMiddleware
{
    private readonly RequestDelegate _next;

    public CondominioContextMiddleware(RequestDelegate next) => _next = next;

    public async Task InvokeAsync(HttpContext context, ICondominioContext condominioContext)
    {
        var claim = context.User.FindFirst("idCondominio")?.Value
            ?? context.Request.Headers["X-Id-Condominio"].FirstOrDefault();

        if (uint.TryParse(claim, out var id))
            condominioContext.SetCondominio(id);

        await _next(context);
    }
}
