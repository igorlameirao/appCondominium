using Microsoft.Extensions.Configuration;
using MySqlConnector;

namespace AppCondominium.Infrastructure.Persistence;

internal static class MySqlConnectionSetup
{
    /// <summary>
    /// Monta a connection string e, se <c>Database:Ssh</c> estiver configurado, abre túnel local até o host MySQL.
    /// Quem cria o túnel deve mantê-lo vivo (Singleton na API; estático no design-time).
    /// </summary>
    public static (string ConnectionString, SshMySqlTunnel? Tunnel) Resolve(IConfiguration config)
    {
        var connectionString = config.GetConnectionString("DefaultConnection");
        if (string.IsNullOrWhiteSpace(connectionString))
            throw new InvalidOperationException("Connection string 'DefaultConnection' is not configured.");

        var csb = new MySqlConnectionStringBuilder(connectionString);
        var tunnel = SshMySqlTunnel.StartIfConfigured(config, csb.Server, csb.Port);
        if (tunnel is not null)
        {
            csb.Server = "127.0.0.1";
            csb.Port = tunnel.LocalPort;
            connectionString = csb.ConnectionString;
        }

        return (connectionString, tunnel);
    }
}
