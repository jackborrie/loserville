using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace server.loser;

public class LoserContext : DbContext
{
    private string DbPath { get; set; }
    
    public DbSet<Card> Cards { get; set; }

    public LoserContext()
    {
        var path = Environment.CurrentDirectory;
        DbPath = Path.Join(path, "loser.db");
    }

    protected override void OnConfiguring(DbContextOptionsBuilder options)
        => options.UseSqlite($"Data Source={DbPath}");


    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Deck>()
            .HasMany(d => d.Cards)
            .WithMany(c => c.Decks)
            .UsingEntity<DeckCard>(
                d => d.HasOne<Card>(e => e.Card).WithMany().HasForeignKey(l => l.CardId),
                c => c.HasOne<Deck>(e => e.Deck).WithMany().HasForeignKey(l => l.DeckId));
        
        modelBuilder.Entity<User>()
            .HasMany(d => d.Decks)
            .WithOne(c => c.User);
    }
}

[Table("deck_cards")]
public class DeckCard
{
    [Column("deck_id")]
    public int DeckId { get; set; }
    [Column("card_id")]
    public int CardId { get; set; }

    public Deck Deck { get; set; }
    public Card Card { get; set; }
}

public class Card
{
    [Column("id")]
    public int Id { get; set; }
    [Column("name")]
    public string Name { get; set; }

    public List<Deck> Decks { get; set; } = [];
}

public class Deck
{
    [Column("id")]
    public int Id { get; set; }
    [Column("name")]
    public string Name { get; set; }
    
    [Column("user_id")]
    public string UserId { get; set; }
    [Column("commander_id")]
    public int CommanderId { get; set; }

    public List<Card> Cards { get; set; } = [];
    
    public Card CommanderCard { get; set; }
    
    public User User { get; set; }
}

public class User
{
    [Column("id")]
    public int Id { get; set; }
    [Column("name")]
    public string Name { get; set; }

    public List<Deck> Decks { get; set; } = [];
}
