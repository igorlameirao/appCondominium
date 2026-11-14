using System.Net;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;

namespace AppCondominium.API.Middleware;

/// <summary>Evita expor stack trace ao cliente; mapeia violações de índice único do MySQL.</summary>
public sealed class ApiExceptionMiddleware
{
    private static readonly JsonSerializerOptions Json = new() { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
    private readonly RequestDelegate _next;
    private readonly ILogger<ApiExceptionMiddleware> _logger;

    public ApiExceptionMiddleware(RequestDelegate next, ILogger<ApiExceptionMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            await EscreverRespostaAsync(context, ex);
        }
    }

    private async Task EscreverRespostaAsync(HttpContext context, Exception ex)
    {
        var causa = CausaRaiz(ex);
        var texto = causa.Message;

        if (ex is DbUpdateException || texto.Contains("Duplicate entry", StringComparison.OrdinalIgnoreCase))
        {
            if (texto.Contains("Duplicate entry", StringComparison.OrdinalIgnoreCase))
            {
                context.Response.StatusCode = (int)HttpStatusCode.Conflict;
                await context.Response.WriteAsJsonAsync(new
                {
                    title = "Conflito",
                    message = MensagemDuplicidade(texto),
                }, Json);
                return;
            }

            if (EhIncompatibilidadeSchemaUnidade(texto))
            {
                context.Response.StatusCode = (int)HttpStatusCode.BadRequest;
                await context.Response.WriteAsJsonAsync(new
                {
                    title = "Banco de dados",
                    message = "A tabela Unidade está desatualizada. Execute database/migrations/20261113_unidade_idhidrometro_nullable.sql e 20261113_unidade_idunidade_autoincrement.sql (ou dotnet run --project WebApi/AppCondominium.Tools -- fix-unidade-schema).",
                }, Json);
                return;
            }

            if (texto.Contains("doesn't have a default value", StringComparison.OrdinalIgnoreCase)
                || texto.Contains("cannot be null", StringComparison.OrdinalIgnoreCase))
            {
                context.Response.StatusCode = (int)HttpStatusCode.BadRequest;
                await context.Response.WriteAsJsonAsync(new
                {
                    title = "Dados incompletos",
                    message = "Há campos obrigatórios sem valor. Verifique o formulário e tente novamente.",
                }, Json);
                return;
            }
        }

        if (texto.Contains("Storage:S3:Bucket", StringComparison.OrdinalIgnoreCase)
            || texto.Contains("S3:Bucket", StringComparison.OrdinalIgnoreCase))
        {
            context.Response.StatusCode = (int)HttpStatusCode.ServiceUnavailable;
            await context.Response.WriteAsJsonAsync(new
            {
                title = "Armazenamento",
                message = "O armazenamento de arquivos (S3) não está configurado neste ambiente.",
            }, Json);
            return;
        }

        if (EhFalhaCredencialS3(ex, texto))
        {
            _logger.LogError(ex, "Autenticação S3 inválida em {Method} {Path}", context.Request.Method, context.Request.Path);
            context.Response.StatusCode = (int)HttpStatusCode.BadGateway;
            await context.Response.WriteAsJsonAsync(new
            {
                title = "Armazenamento",
                message = "Não foi possível autenticar na AWS/S3. Defina o perfil local (AWS_PROFILE) ou as credenciais padrão do SDK.",
            }, Json);
            return;
        }

        if (EhFalhaS3(ex, texto))
        {
            _logger.LogError(ex, "Falha no S3 em {Method} {Path}", context.Request.Method, context.Request.Path);
            var permissao = texto.Contains("Access Denied", StringComparison.OrdinalIgnoreCase)
                || texto.Contains("AccessDenied", StringComparison.OrdinalIgnoreCase)
                || texto.Contains("AllAccessDisabled", StringComparison.OrdinalIgnoreCase);
            context.Response.StatusCode = (int)HttpStatusCode.BadGateway;
            await context.Response.WriteAsJsonAsync(new
            {
                title = "Armazenamento",
                message = permissao
                    ? "Sem permissão para acessar o objeto no S3. Verifique se o caminho está sob app-condominium/dev/."
                    : "Não foi possível concluir a operação no S3. Tente novamente.",
            }, Json);
            return;
        }

        _logger.LogError(ex, "Erro não tratado em {Method} {Path}", context.Request.Method, context.Request.Path);
        context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;
        await context.Response.WriteAsJsonAsync(new
        {
            title = "Erro",
            message = "Não foi possível concluir a operação. Tente novamente.",
        }, Json);
    }

    private static Exception CausaRaiz(Exception ex)
    {
        var atual = ex;
        while (atual.InnerException != null)
            atual = atual.InnerException;
        return atual;
    }

    private static bool EhFalhaS3(Exception ex, string texto) =>
        ContemNaCadeia(ex, s => s.Contains("AmazonS3Exception", StringComparison.OrdinalIgnoreCase))
        || texto.Contains("AmazonS3Exception", StringComparison.OrdinalIgnoreCase);

    private static bool EhFalhaCredencialS3(Exception ex, string texto)
    {
        static bool Credencial(string s) =>
            s.Contains("Unable to locate credentials", StringComparison.OrdinalIgnoreCase)
            || s.Contains("Unable to get IAM security credentials", StringComparison.OrdinalIgnoreCase)
            || s.Contains("InvalidAccessKeyId", StringComparison.OrdinalIgnoreCase)
            || s.Contains("SignatureDoesNotMatch", StringComparison.OrdinalIgnoreCase)
            || s.Contains("ErrorCode=InvalidAccessKeyId", StringComparison.OrdinalIgnoreCase);

        return Credencial(texto) || ContemNaCadeia(ex, Credencial);
    }

    private static bool ContemNaCadeia(Exception ex, Func<string, bool> predicao)
    {
        for (var atual = ex; atual != null; atual = atual.InnerException)
        {
            if (predicao(atual.Message))
                return true;
        }
        return false;
    }

    private static string MensagemDuplicidade(string mysql)
    {
        if (mysql.Contains("IdxCKTipoUnidade", StringComparison.OrdinalIgnoreCase))
            return "Já existe um tipo de unidade com esta descrição neste condomínio.";
        if (mysql.Contains("uq_Condominio_Nome", StringComparison.OrdinalIgnoreCase))
            return "Já existe um condomínio com este nome.";
        if (mysql.Contains("uq_Condominio_CNPJ", StringComparison.OrdinalIgnoreCase))
            return "Já existe um condomínio com este CNPJ.";
        return "Já existe um registro com os mesmos dados. Verifique os campos informados.";
    }

    private static bool EhIncompatibilidadeSchemaUnidade(string mysql) =>
        (mysql.Contains("Unidade", StringComparison.OrdinalIgnoreCase)
            || mysql.Contains("IdUnidade", StringComparison.OrdinalIgnoreCase)
            || mysql.Contains("IdHidrometro", StringComparison.OrdinalIgnoreCase))
        && (mysql.Contains("doesn't have a default value", StringComparison.OrdinalIgnoreCase)
            || mysql.Contains("cannot be null", StringComparison.OrdinalIgnoreCase)
            || mysql.Contains("Incorrect integer value", StringComparison.OrdinalIgnoreCase));
}
