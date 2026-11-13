using AppCondominium.Domain.Entities;
using AppCondominium.Tools.Bancos;
using Xunit;

namespace AppCondominium.API.Tests;

public class BancoImportacaoTests
{
    private static RegistroFonte Csv(string ispb, string? codigo, string nome) =>
        new(BancoFontes.FonteCsv, 2, ispb, false, codigo, false, nome, null, null);

    private static RegistroFonte Json(string ispb, int? codigo, string nome, bool ispbNumerico = false) =>
        new(BancoFontes.FonteJson, 1, ispb, ispbNumerico, codigo?.ToString(), codigo != null, nome, null, null);

    private static ItemImportacao Unico(PlanoImportacao plano) => Assert.Single(plano.Itens);

    [Fact]
    public void Cruza_por_ispb_preservando_zeros_e_priorizando_nome_do_csv()
    {
        var plano = BancoImportacaoPlanejador.Planejar(
            new[] { Csv("00000000", "001", "Banco do  Brasil S.A. "), Json("00000000", 1, "Banco do Brasil S.A.") },
            Array.Empty<Banco>());

        var item = Unico(plano);
        Assert.Equal(SituacaoImportacao.Incluir, item.Situacao);
        Assert.Equal("001", item.Proposto!.CodigoBanco);
        Assert.Equal("00000000", item.Proposto.ISPB);
        Assert.Equal("Banco do Brasil S.A.", item.Proposto.Nome);
        Assert.Null(item.Proposto.CNPJ);
        Assert.Null(item.Proposto.DigitoVerificador);
        Assert.Equal((byte)1, item.Proposto.Ativo);
    }

    [Theory]
    [InlineData("n/a")]
    [InlineData("0")]
    [InlineData("ABC")]
    [InlineData("1234")]
    public void Codigo_indisponivel_ou_invalido_vira_null(string codigo)
    {
        var item = Unico(BancoImportacaoPlanejador.Planejar(new[] { Csv("28719664", codigo, "Sistema do Balcão B3") }, Array.Empty<Banco>()));
        Assert.Equal(SituacaoImportacao.Incluir, item.Situacao);
        Assert.Null(item.Proposto!.CodigoBanco);
    }

    [Fact]
    public void Ispb_numerico_do_json_recebe_zeros_e_ispb_texto_curto_e_rejeitado()
    {
        var numerico = Unico(BancoImportacaoPlanejador.Planejar(new[] { Json("208", 70, "BRB", ispbNumerico: true) }, Array.Empty<Banco>()));
        Assert.Equal("00000208", numerico.Proposto!.ISPB);

        var curto = Unico(BancoImportacaoPlanejador.Planejar(new[] { Csv("208", "070", "BRB") }, Array.Empty<Banco>()));
        Assert.Equal(SituacaoImportacao.Rejeitado, curto.Situacao);
    }

    [Fact]
    public void Codigo_diferente_entre_arquivos_fica_divergente()
    {
        var item = Unico(BancoImportacaoPlanejador.Planejar(
            new[] { Csv("00000000", "001", "Banco do Brasil S.A."), Json("00000000", 2, "Banco do Brasil S.A.") },
            Array.Empty<Banco>()));
        Assert.Equal(SituacaoImportacao.Divergente, item.Situacao);
    }

    [Fact]
    public void Mesmo_codigo_em_ispbs_diferentes_fica_divergente()
    {
        var plano = BancoImportacaoPlanejador.Planejar(
            new[] { Csv("00000000", "001", "A"), Csv("11111111", "001", "B") }, Array.Empty<Banco>());
        Assert.All(plano.Itens, i => Assert.Equal(SituacaoImportacao.Divergente, i.Situacao));
    }

    [Fact]
    public void Registro_existente_identico_e_ignorado_e_diferente_e_preservado()
    {
        var existentes = new[]
        {
            new Banco { IdBanco = 1, CodigoBanco = "001", Nome = "Banco do Brasil S.A.", ISPB = "00000000", CNPJ = "00000000000191", Ativo = 0 },
            new Banco { IdBanco = 2, CodigoBanco = "237", Nome = "Bradesco (manual)", ISPB = "60746948", Ativo = 1 },
        };
        var plano = BancoImportacaoPlanejador.Planejar(
            new[] { Csv("00000000", "001", "Banco do Brasil S.A."), Csv("60746948", "237", "Banco Bradesco S.A.") }, existentes);

        Assert.Equal(SituacaoImportacao.Ignorado, plano.Itens.Single(i => i.Ispb == "00000000").Situacao);
        var bradesco = plano.Itens.Single(i => i.Ispb == "60746948");
        Assert.Equal(SituacaoImportacao.Divergente, bradesco.Situacao);
        Assert.Equal(2u, bradesco.IdExistente);
    }

    [Fact]
    public void Codigo_ja_usado_por_outro_ispb_no_banco_fica_divergente()
    {
        var existentes = new[] { new Banco { IdBanco = 9, CodigoBanco = "001", Nome = "X", ISPB = "99999999", Ativo = 1 } };
        var item = Unico(BancoImportacaoPlanejador.Planejar(new[] { Csv("00000000", "001", "Banco do Brasil S.A.") }, existentes));
        Assert.Equal(SituacaoImportacao.Divergente, item.Situacao);
    }

    [Fact]
    public void Segunda_execucao_nao_propoe_novas_inclusoes()
    {
        var registros = new[]
        {
            Csv("00000000", "001", "Banco do Brasil S.A."), Json("00000000", 1, "Banco do Brasil S.A."),
            Csv("28719664", "0", "Sistema do Balcão B3"), Json("38121", null, "Selic", ispbNumerico: true),
        };
        var plano = BancoImportacaoPlanejador.Planejar(registros, Array.Empty<Banco>());
        Assert.Equal(3, plano.Total(SituacaoImportacao.Incluir));
        Assert.True(BancoImportacaoPlanejador.VerificarIdempotencia(registros, Array.Empty<Banco>(), plano));
    }

    [Fact]
    public void Leitor_csv_respeita_aspas_e_cabecalho_acentuado()
    {
        var caminho = Path.GetTempFileName();
        try
        {
            File.WriteAllText(caminho,
                "\uFEFFISPB,Nome_Reduzido,Número_Código,Nome_Extenso\r\n" +
                "00122327,SANTINVEST S.A. - CFI,539,\"SANTINVEST S.A. - CREDITO, FINANCIAMENTO E INVESTIMENTOS\"\r\n");
            var r = Assert.Single(BancoFontes.LerCsv(caminho));
            Assert.Equal("00122327", r.Ispb);
            Assert.Equal("539", r.Codigo);
            Assert.Equal("SANTINVEST S.A. - CREDITO, FINANCIAMENTO E INVESTIMENTOS", r.NomeCompleto);
        }
        finally
        {
            File.Delete(caminho);
        }
    }
}
