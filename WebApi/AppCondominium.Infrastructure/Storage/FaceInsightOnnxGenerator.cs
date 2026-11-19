using AppCondominium.Application.Storage;
using Microsoft.Extensions.Options;
using Microsoft.ML.OnnxRuntime;
using Microsoft.ML.OnnxRuntime.Tensors;
using SkiaSharp;

namespace AppCondominium.Infrastructure.Storage;

/// <summary>Gera embedding facial com modelo ONNX compatível InsightFace (112×112, RGB).</summary>
public sealed class FaceInsightOnnxGenerator : IFaceEmbeddingGenerator, IDisposable
{
    private readonly InferenceSession? _session;
    private readonly string _inputName = "";

    public FaceInsightOnnxGenerator(IOptions<FaceRecognitionOptions> options)
    {
        var caminho = (options.Value.RecognitionModelPath ?? "").Trim();
        if (string.IsNullOrEmpty(caminho) || !File.Exists(caminho))
            return;

        _session = new InferenceSession(caminho);
        _inputName = _session.InputMetadata.Keys.First();
    }

    public bool Disponivel => _session != null;

    public Task<float[]?> GerarAsync(Stream imagem, CancellationToken ct = default)
    {
        if (_session == null) return Task.FromResult<float[]?>(null);
        return Task.Run(() => GerarInterno(imagem), ct);
    }

    private float[]? GerarInterno(Stream imagem)
    {
        using var origem = SKBitmap.Decode(imagem)
            ?? throw new InvalidOperationException("Não foi possível ler a imagem para o embedding facial.");
        var info = new SKImageInfo(112, 112, SKColorType.Rgba8888, SKAlphaType.Unpremul);
        using var img = origem.Resize(info, new SKSamplingOptions(SKCubicResampler.CatmullRom))
            ?? throw new InvalidOperationException("Não foi possível redimensionar a imagem para o embedding facial.");

        var tensor = new DenseTensor<float>(new[] { 1, 3, 112, 112 });
        for (var y = 0; y < 112; y++)
        {
            for (var x = 0; x < 112; x++)
            {
                var px = img.GetPixel(x, y);
                tensor[0, 0, y, x] = (px.Red - 127.5f) / 127.5f;
                tensor[0, 1, y, x] = (px.Green - 127.5f) / 127.5f;
                tensor[0, 2, y, x] = (px.Blue - 127.5f) / 127.5f;
            }
        }

        using var resultados = _session!.Run(new[] { NamedOnnxValue.CreateFromTensor(_inputName, tensor) });
        var saida = resultados.First().AsEnumerable<float>().ToArray();
        if (saida.Length == 0) return null;
        return NormalizarL2(saida);
    }

    private static float[] NormalizarL2(float[] vetor)
    {
        var norma = 0f;
        foreach (var v in vetor) norma += v * v;
        norma = MathF.Sqrt(norma);
        if (norma < 1e-6f) return vetor;
        var r = new float[vetor.Length];
        for (var i = 0; i < vetor.Length; i++) r[i] = vetor[i] / norma;
        return r;
    }

    public void Dispose() => _session?.Dispose();
}