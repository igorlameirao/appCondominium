using System.Globalization;
using System.Linq.Expressions;
using Microsoft.EntityFrameworkCore;
using AppCondominium.Domain.Entities;

namespace AppCondominium.Infrastructure.Persistence;

public partial class AppDbContext
{
    /// <summary>
    /// Bancos criados com schema.sql antigo gravam decimais em VARCHAR(255).
    /// Conversão até a migração database/migrations/20261115_material_decimal_columns.sql ser aplicada.
    /// </summary>
    private void ConfigureLegacyVarcharDecimals(ModelBuilder modelBuilder)
    {
        ConfigurarDecimalLegacyVarchar<Material>(modelBuilder, m => m.ValorAquisicao);
        ConfigurarDecimalLegacyVarchar<Material>(modelBuilder, m => m.ValorDepreciavel);

        ConfigurarDecimalLegacyVarchar<EstoqueMaterialConsumo>(modelBuilder, e => e.ValorUnitarioUltimaAquisicao);
        ConfigurarDecimalLegacyVarchar<EstoqueMaterialConsumo>(modelBuilder, e => e.ValorUnitarioMedio);
        ConfigurarDecimalLegacyVarchar<EstoqueMaterialConsumo>(modelBuilder, e => e.Quantidade);

        ConfigurarDecimalLegacyVarchar<EntradaSaidaMaterialConsumo>(modelBuilder, e => e.ValorUnitarioAquisicao);
        ConfigurarDecimalLegacyVarchar<EntradaSaidaMaterialConsumo>(modelBuilder, e => e.Quantidade);

        modelBuilder.Entity<Material>()
            .Property(m => m.VidaUtil)
            .HasConversion(
                v => v == null ? null : v.Value.ToString(CultureInfo.InvariantCulture),
                v => string.IsNullOrWhiteSpace(v) ? null : uint.Parse(v, CultureInfo.InvariantCulture))
            .HasColumnType("varchar(255)");
    }

    private static void ConfigurarDecimalLegacyVarchar<TEntity>(
        ModelBuilder modelBuilder,
        Expression<Func<TEntity, decimal?>> property)
        where TEntity : class
    {
        modelBuilder.Entity<TEntity>()
            .Property(property)
            .HasConversion(
                v => v == null ? null : v.Value.ToString(CultureInfo.InvariantCulture),
                v => string.IsNullOrWhiteSpace(v) ? null : decimal.Parse(v, CultureInfo.InvariantCulture))
            .HasColumnType("varchar(255)");
    }
}