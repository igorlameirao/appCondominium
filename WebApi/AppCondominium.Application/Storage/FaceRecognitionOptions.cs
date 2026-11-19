namespace AppCondominium.Application.Storage;

/// <summary>Modelos ONNX (InsightFace). Caminhos vazios desabilitam o cálculo automático.</summary>
public sealed class FaceRecognitionOptions
{
    public const string SectionName = "FaceRecognition";

    /// <summary>Ex.: buffalo_l <c>w600k_r50.onnx</c> (entrada 1×3×112×112).</summary>
    public string RecognitionModelPath { get; set; } = "";
}