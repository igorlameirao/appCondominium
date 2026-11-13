using AppCondominium.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using System.Security.Claims;

namespace AppCondominium.API.Authorization;

/// <summary>
/// Endpoints de arquivo: GET = Visualizar; PUT (upload) = Incluir ou Alterar; DELETE = Excluir.
/// </summary>
[AttributeUsage(AttributeTargets.Class)]
public sealed class PermissionArquivoResourceAttribute : Attribute, IAsyncAuthorizationFilter
{
    public PermissionArquivoResourceAttribute(string permissionKey) => PermissionKey = permissionKey;

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

        var metodo = context.HttpContext.Request.Method.ToUpperInvariant();
        var acoes = metodo switch
        {
            "GET" or "HEAD" => new[] { "Visualizar" },
            "PUT" or "POST" => new[] { "Incluir", "Alterar" },
            "DELETE" => new[] { "Excluir" },
            _ => Array.Empty<string>()
        };
        if (acoes.Length == 0)
            return;

        if (acoes.Any(a => PermissionResourceAttribute.PermissaoNoToken(user, PermissionKey, a)))
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
        foreach (var acao in acoes)
        {
            if (await resolver.HasAsync(idPessoa, idCondominio, PermissionKey, acao, context.HttpContext.RequestAborted))
                return;
        }

        context.Result = new ObjectResult(new { title = "Sem permissão para esta ação." })
        {
            StatusCode = StatusCodes.Status403Forbidden
        };
    }
}
