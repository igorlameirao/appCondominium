using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace AppCondominium.API.Authorization;

/// <summary>Restringe ao usuário com claim <see cref="PermissionClaimTypes.AcessoTotal"/>.</summary>
[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method)]
public sealed class RequireAcessoTotalAttribute : Attribute, IAuthorizationFilter
{
    public void OnAuthorization(AuthorizationFilterContext context)
    {
        var user = context.HttpContext.User;
        if (user.Identity?.IsAuthenticated != true)
        {
            context.Result = new UnauthorizedResult();
            return;
        }

        if (!user.HasClaim(PermissionClaimTypes.AcessoTotal, "1"))
        {
            context.Result = new ObjectResult(new { title = "Acesso restrito à administração global do sistema." })
            {
                StatusCode = StatusCodes.Status403Forbidden
            };
        }
    }
}