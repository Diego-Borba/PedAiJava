package com.PedAi.PedAi.Model;

import jakarta.persistence.*;

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
    
}