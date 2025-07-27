package com.PedAi.PedAi.Model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIdentityInfo;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.fasterxml.jackson.annotation.ObjectIdGenerators;
import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;

@Entity
@JsonIdentityInfo(generator = ObjectIdGenerators.PropertyGenerator.class, property = "id")
public class GrupoComplemento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nome;

    @Enumerated(EnumType.STRING)
    private TipoSelecao tipoSelecao;

    private int quantidadeMaxima;

    @OneToMany(mappedBy = "grupo", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @JsonManagedReference("grupo-opcoes")
    private List<OpcaoComplemento> opcoes = new ArrayList<>();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "produto_kit_id")
    @JsonBackReference("kit-grupos") // Corresponde ao nome em Produto
    private Produto produtoKit;

    // ... (seus Getters e Setters permanecem inalterados)
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getNome() { return nome; }
    public void setNome(String nome) { this.nome = nome; }
    public TipoSelecao getTipoSelecao() { return tipoSelecao; }
    public void setTipoSelecao(TipoSelecao tipoSelecao) { this.tipoSelecao = tipoSelecao; }
    public int getQuantidadeMaxima() { return quantidadeMaxima; }
    public void setQuantidadeMaxima(int quantidadeMaxima) { this.quantidadeMaxima = quantidadeMaxima; }
    public List<OpcaoComplemento> getOpcoes() { return opcoes; }
    public void setOpcoes(List<OpcaoComplemento> opcoes) { this.opcoes = opcoes; }
    public Produto getProdutoKit() { return produtoKit; }
    public void setProdutoKit(Produto produtoKit) { this.produtoKit = produtoKit; }
}