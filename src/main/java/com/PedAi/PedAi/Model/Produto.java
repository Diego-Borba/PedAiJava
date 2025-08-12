package com.PedAi.PedAi.Model;

import com.fasterxml.jackson.annotation.JsonIdentityInfo;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.ObjectIdGenerators;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Entity
@JsonIdentityInfo(generator = ObjectIdGenerators.PropertyGenerator.class, property = "id")
public class Produto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nome;
    private Double preco;
    private String categoria;
    private Integer qtdeMax;
    private String descricao;
    private String imagem;
    private Integer codPdv;
    private Integer ordemVisualizacao;

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "produto_receita", joinColumns = @JoinColumn(name = "produto_final_id"))
    private List<ItemReceita> receita = new ArrayList<>();

    @Column(nullable = false, precision = 10, scale = 3)
    private BigDecimal estoqueAtual = BigDecimal.ZERO;

    // Flags e configurações
    @Column(nullable = false, columnDefinition = "BOOLEAN DEFAULT TRUE")
    private boolean ativo = true;

    @Column(name = "is_complemento", nullable = false, columnDefinition = "BOOLEAN DEFAULT FALSE")
    private boolean isComplemento = false;

    @Column(nullable = false, columnDefinition = "BOOLEAN DEFAULT TRUE")
    private boolean vendidoIndividualmente = true;

    @Column(nullable = false, columnDefinition = "BOOLEAN DEFAULT FALSE")
    private boolean permiteComplementos = false;

    @Column(nullable = false, columnDefinition = "BOOLEAN DEFAULT FALSE")
    private boolean isMateriaPrima = false;

    @Column(nullable = false, columnDefinition = "BOOLEAN DEFAULT FALSE")
    private boolean isKit = false;

    // Relacionamentos
    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "produto_complemento_configs", joinColumns = @JoinColumn(name = "produto_principal_id"))
    private List<ComplementoConfig> complementosDisponiveis = new ArrayList<>();

    @OneToMany(mappedBy = "produtoKit", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @JsonManagedReference("kit-grupos")
    private List<GrupoComplemento> gruposKit = new ArrayList<>();

    // Getters e Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getNome() {
        return nome;
    }

    public void setNome(String nome) {
        this.nome = nome;
    }

    public Double getPreco() {
        return preco;
    }

    public void setPreco(Double preco) {
        this.preco = preco;
    }

    public String getCategoria() {
        return categoria;
    }

    public void setCategoria(String categoria) {
        this.categoria = categoria;
    }

    public Integer getQtdeMax() {
        return qtdeMax;
    }

    public void setQtdeMax(Integer qtdeMax) {
        this.qtdeMax = qtdeMax;
    }

    public String getDescricao() {
        return descricao;
    }

    public void setDescricao(String descricao) {
        this.descricao = descricao;
    }

    public String getImagem() {
        return imagem;
    }

    public void setImagem(String imagem) {
        this.imagem = imagem;
    }

    public Integer getCodPdv() {
        return codPdv;
    }

    public void setCodPdv(Integer codPdv) {
        this.codPdv = codPdv;
    }

    public Integer getOrdemVisualizacao() {
        return ordemVisualizacao;
    }

    public void setOrdemVisualizacao(Integer ordemVisualizacao) {
        this.ordemVisualizacao = ordemVisualizacao;
    }

    public List<ItemReceita> getReceita() {
        return receita;
    }

    public void setReceita(List<ItemReceita> receita) {
        this.receita = receita;
    }

    public BigDecimal getEstoqueAtual() {
        return estoqueAtual;
    }

    public void setEstoqueAtual(BigDecimal estoqueAtual) {
        this.estoqueAtual = estoqueAtual;
    }

    @JsonProperty("ativo")
    public boolean isAtivo() {
        return ativo;
    }

    public void setAtivo(boolean ativo) {
        this.ativo = ativo;
    }

    @JsonProperty("isComplemento")
    public boolean isComplemento() {
        return isComplemento;
    }

    public void setIsComplemento(boolean isComplemento) {
        this.isComplemento = isComplemento;
    }

    @JsonProperty("vendidoIndividualmente")
    public boolean isVendidoIndividualmente() {
        return vendidoIndividualmente;
    }

    public void setVendidoIndividualmente(boolean vendidoIndividualmente) {
        this.vendidoIndividualmente = vendidoIndividualmente;
    }

    @JsonProperty("permiteComplementos")
    public boolean isPermiteComplementos() {
        return permiteComplementos;
    }

    public void setPermiteComplementos(boolean permiteComplementos) {
        this.permiteComplementos = permiteComplementos;
    }

    @JsonProperty("isMateriaPrima")
    public boolean isMateriaPrima() {
        return isMateriaPrima;
    }

    public void setMateriaPrima(boolean materiaPrima) {
        isMateriaPrima = materiaPrima;
    }

    @JsonProperty("isKit")
    public boolean isKit() {
        return isKit;
    }

    public void setKit(boolean kit) {
        isKit = kit;
    }

    public List<ComplementoConfig> getComplementosDisponiveis() {
        return complementosDisponiveis;
    }

    public void setComplementosDisponiveis(List<ComplementoConfig> complementosDisponiveis) {
        this.complementosDisponiveis = complementosDisponiveis;
    }

    public List<GrupoComplemento> getGruposKit() {
        return gruposKit;
    }

    public void setGruposKit(List<GrupoComplemento> gruposKit) {
        this.gruposKit = gruposKit;
    }
}
