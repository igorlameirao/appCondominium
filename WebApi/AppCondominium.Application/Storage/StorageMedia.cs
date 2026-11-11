namespace AppCondominium.Application.Storage;

public static class StorageMedia
{
    public static readonly string[] ImagensPerfil = ["image/jpeg", "image/png"];
    public static readonly string[] ImagensTema = ["image/jpeg", "image/png", "image/webp"];
    public static readonly string[] Documentos = ["application/pdf", "image/jpeg", "image/png"];

    public const long FotoPerfilMaxBytes = 2 * 1024 * 1024;
    public const long ImagemLoginMaxBytes = 5 * 1024 * 1024;
    public const long ImagemIconeMaxBytes = 2 * 1024 * 1024;
    public const long DocumentoMaxBytes = 8 * 1024 * 1024;

    public static string ExtensionFor(string contentType) => contentType.ToLowerInvariant() switch
    {
        "image/jpeg" or "image/jpg" => "jpg",
        "image/png" => "png",
        "image/webp" => "webp",
        "application/pdf" => "pdf",
        _ => "bin"
    };

    public static string DetectContentType(ReadOnlySpan<byte> bytes)
    {
        if (bytes.Length >= 8 && bytes[0] == 0x89 && bytes[1] == 0x50 && bytes[2] == 0x4E && bytes[3] == 0x47)
            return "image/png";
        if (bytes.Length >= 3 && bytes[0] == 0xFF && bytes[1] == 0xD8 && bytes[2] == 0xFF)
            return "image/jpeg";
        if (bytes.Length >= 4 && bytes[0] == 0x25 && bytes[1] == 0x50 && bytes[2] == 0x44 && bytes[3] == 0x46)
            return "application/pdf";
        if (bytes.Length >= 12 && bytes[0] == (byte)'R' && bytes[1] == (byte)'I' && bytes[2] == (byte)'F' && bytes[3] == (byte)'F'
            && bytes[8] == (byte)'W' && bytes[9] == (byte)'E' && bytes[10] == (byte)'B' && bytes[11] == (byte)'P')
            return "image/webp";
        return "application/octet-stream";
    }
}
