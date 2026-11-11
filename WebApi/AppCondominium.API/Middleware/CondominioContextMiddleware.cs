using AppCondominium.Application.Interfaces;

namespace AppCondominium.API.Middleware;

/// <summary>
/// Propaga o tenant (IdCondominio) do JWT. Header X-Id-Condominio deve coincidir com o claim.
/// </summary>
public class CondominioContextMiddleware
{
    private readonly RequestDelegate _next;

    public CondominioContextMiddleware(RequestDelegate next) => _next = next;

    public async Task InvokeAsync(HttpContext context, ICondominioContext condominioContext)
    {
        condominioContext.Clear();

        if (TenantResolution.PathSkipsTenant(context.Request.Path))
        {
            await _next(context);
            return;
        }

        var claim = context.User.FindFirst("idCondominio")?.Value;
        var header = context.Request.Headers["X-Id-Condominio"].FirstOrDefault();
        var result = TenantResolution.Resolve(context.User.Identity?.IsAuthenticated == true, claim, header);

        switch (result.Status)
        {
            case TenantResolutionStatus.MissingTenant:
                context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                await context.Response.WriteAsync("Tenant (IdCondominio) ausente no token.");
                return;
            case TenantResolutionStatus.HeaderMismatch:
                context.Response.StatusCode = StatusCodes.Status403Forbidden;
                await context.Response.WriteAsync("X-Id-Condominio não confere com o tenant do token.");
                return;
            case TenantResolutionStatus.Resolved:
                condominioContext.SetCondominio(result.TenantId!.Value);
                break;
        }

        await _next(context);
    }
}
