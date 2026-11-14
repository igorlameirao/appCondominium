using System.Globalization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace AppCondominium.API.Routing;

/// <summary>Constraint de rota para parâmetros uint (não incluso no mapa padrão do ASP.NET Core).</summary>
public sealed class UIntRouteConstraint : IRouteConstraint
{
    public bool Match(
        HttpContext? httpContext,
        IRouter? route,
        string routeKey,
        RouteValueDictionary values,
        RouteDirection routeDirection)
    {
        if (!values.TryGetValue(routeKey, out var raw) || raw is null)
            return false;
        if (raw is uint) return true;
        var text = Convert.ToString(raw, CultureInfo.InvariantCulture);
        return uint.TryParse(text, NumberStyles.Integer, CultureInfo.InvariantCulture, out _);
    }
}