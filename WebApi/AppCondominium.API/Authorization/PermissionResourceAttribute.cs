using AppCondominium.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using System.Security.Claims;

namespace AppCondominium.API.Authorization;

/// <summary>
/// Exige a ação do verbo HTTP na permissionKey, resolvida no condomínio ativo.
/// </summary>
[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method, AllowMultiple = false)]
public class PermissionResourceAttribute : Attribute, IAsyncAuthorizationFilter
{
    public PermissionResourceAttribute(string permissionKey) => PermissionKey = permissionKey;

    public string PermissionKey { get; }

    public async Task OnAuthorizationAsync(AuthorizationFilterContext context)
    {
        if (context.ActionDescriptor.EndpointMetadata.OfType<IAllowAnonymous>().Any())
            return;

        var user = context.HttpContext.User;
        if (user.Identity?.IsAuthenticated != true)
        {
            context.Result = new UnauthorizedResult();
            return;
        }

        var acao = AcaoDoVerbo(context.HttpContext.Request.Method);
        if (acao == null)
            return;

        if (PermissaoNoToken(user, PermissionKey, acao))
            return;

        var raw = user.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!uint.TryParse(raw, out var idPessoa))
        {
            context.Result = new UnauthorizedResult();
            return;
        }

        var tenant = context.HttpContext.RequestServices.GetRequiredService<ICondominioContext>();
        if (tenant.IdCondominio is not uint idCondominio)
        {
            context.Result = new UnauthorizedResult();
            return;
        }

        var resolver = context.HttpContext.RequestServices.GetRequiredService<IPermissionResolver>();
        if (!await resolver.HasAsync(idPessoa, idCondominio, PermissionKey, acao, context.HttpContext.RequestAborted))
        {
            context.Result = new ObjectResult(new { title = "Sem permissão para esta ação." })
            {
                StatusCode = StatusCodes.Status403Forbidden
            };
        }
    }

    internal static bool PermissaoNoToken(ClaimsPrincipal user, string permissionKey, string acao)
    {
        if (user.HasClaim(PermissionClaimTypes.AcessoTotal, "1"))
            return true;
        if (user.IsInRole("Administrador"))
            return true;
        var claim = $"{permissionKey}:{acao}";
        return user.HasClaim(PermissionClaimTypes.Permissao, claim);
    }

    public static string? AcaoDoVerbo(string method) => method.ToUpperInvariant() switch
    {
        "GET" or "HEAD" => "Visualizar",
        "POST" => "Incluir",
        "PUT" or "PATCH" => "Alterar",
        "DELETE" => "Excluir",
        _ => null
    };
}
