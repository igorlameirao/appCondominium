using System.Net;
using System.Net.Sockets;
using Microsoft.Extensions.Configuration;
using Renci.SshNet;

namespace AppCondominium.Infrastructure.Persistence;

/// <summary>
/// Encaminha o MySQL por SSH, como o Workbench faz com o bastion e a chave .pem.
/// </summary>
public sealed class SshMySqlTunnel : IDisposable
{
    private readonly SshClient _client;
    private readonly ForwardedPortLocal _forward;

    private SshMySqlTunnel(SshClient client, ForwardedPortLocal forward)
    {
        _client = client;
        _forward = forward;
    }

    public uint LocalPort => _forward.BoundPort;

    public static SshMySqlTunnel? StartIfConfigured(IConfiguration config, string mysqlHost, uint mysqlPort)
    {
        var sshHost = config["Database:Ssh:Host"];
        if (string.IsNullOrWhiteSpace(sshHost))
            return null;

        var sshPort = config.GetValue("Database:Ssh:Port", 22);
        var sshUser = config["Database:Ssh:Username"];
        var keyFile = config["Database:Ssh:KeyFile"];
        if (string.IsNullOrWhiteSpace(sshUser) || string.IsNullOrWhiteSpace(keyFile))
        {
            throw new InvalidOperationException(
                "Database:Ssh:Host está definido, mas Username ou KeyFile não foi configurado.");
        }

        if (!File.Exists(keyFile))
            throw new InvalidOperationException($"Chave SSH não encontrada: {keyFile}");

        var client = new SshClient(sshHost, sshPort, sshUser, new PrivateKeyFile(keyFile))
        {
            KeepAliveInterval = TimeSpan.FromSeconds(30)
        };
        client.HostKeyReceived += (_, e) => e.CanTrust = true;
        client.Connect();

        var forward = new ForwardedPortLocal("127.0.0.1", ReserveLoopbackPort(), mysqlHost, mysqlPort);
        client.AddForwardedPort(forward);
        forward.Start();
        return new SshMySqlTunnel(client, forward);
    }

    public void Dispose()
    {
        try
        {
            if (_forward.IsStarted)
                _forward.Stop();
        }
        catch (Exception)
        {
            // O processo está encerrando.
        }

        try
        {
            if (_client.IsConnected)
                _client.Disconnect();
        }
        catch (Exception)
        {
            // O processo está encerrando.
        }

        _client.Dispose();
    }

    private static uint ReserveLoopbackPort()
    {
        var listener = new TcpListener(IPAddress.Loopback, 0);
        listener.Start();
        var port = (uint)((IPEndPoint)listener.LocalEndpoint).Port;
        listener.Stop();
        return port;
    }
}
