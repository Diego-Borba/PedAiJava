package com.PedAi.PedAi.Model;

import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;

@Entity
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
    
    @Column(nullable = false, columnDefinition = "BOOLEAN DEFAULT TRUE")
    private boolean ativo = true;

    @Column(nullable = false, columnDefinition = "BOOLEAN DEFAULT FALSE")
    private boolean isComplemento = false; 
    
    @Column(nullable = false, columnDefinition = "BOOLEAN DEFAULT FALSE")
    private boolean permiteComplementos = false;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "produto_complemento_configs", joinColumns = @JoinColumn(name = "produto_principal_id"))
    private List<ComplementoConfig> complementosDisponiveis = new ArrayList<>();

    // Mantenha TODOS os getters e setters como na resposta anterior completa.
    // Omitidos aqui por brevidade, mas são essenciais.

    // Getters e Setters para 'ativo'
    public boolean isAtivo() { // Corrigido para seguir convenção para boolean primitivo
        return ativo;
    }
    public void setAtivo(boolean ativo) { // Corrigido para boolean primitivo
        this.ativo = ativo;
    }

    // Getters e Setters para 'isComplemento'
    public boolean isComplemento() {
        return isComplemento;
    }
    public void setComplemento(boolean complemento) {
        isComplemento = complemento;
    }

    // Getters e Setters para 'permiteComplementos'
    public boolean isPermiteComplementos() {
        return permiteComplementos;
    }
    public void setPermiteComplementos(boolean permiteComplementos) {
        this.permiteComplementos = permiteComplementos;
    }

    // Getters e Setters para 'complementosDisponiveis'
    public List<ComplementoConfig> getComplementosDisponiveis() {
        return complementosDisponiveis;
    }
    public void setComplementosDisponiveis(List<ComplementoConfig> complementosDisponiveis) {
        this.complementosDisponiveis = complementosDisponiveis;
    }
    // ... outros getters e setters ...
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getNome() { return nome; }
    public void setNome(String nome) { this.nome = nome; }
    public Double getPreco() { return preco; }
    public void setPreco(Double preco) { this.preco = preco; }
    public String getCategoria() { return categoria; }
    public void setCategoria(String categoria) { this.categoria = categoria; }
    public Integer getQtdeMax() { return qtdeMax; }
    public void setQtdeMax(Integer qtdeMax) { this.qtdeMax = qtdeMax; }
    public String getDescricao() { return descricao; }
    public void setDescricao(String descricao) { this.descricao = descricao; }
    public String getImagem() { return imagem; }
    public void setImagem(String imagem) { this.imagem = imagem; }
    public Integer getCodPdv() { return codPdv; }
    public void setCodPdv(Integer codPdv) { this.codPdv = codPdv; }
    public Integer getOrdemVisualizacao() { return ordemVisualizacao; }
    public void setOrdemVisualizacao(Integer ordemVisualizacao) { this.ordemVisualizacao = ordemVisualizacao; }
}