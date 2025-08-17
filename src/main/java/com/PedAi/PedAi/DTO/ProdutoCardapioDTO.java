package com.PedAi.PedAi.DTO;

import com.PedAi.PedAi.Model.Produto;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

public class ProdutoCardapioDTO {

    private Long id;
    private String nome;
    private Double preco;
    private String descricao;
    private String imagem;
    private String categoria;
    private boolean isKit;
    private Integer ordemVisualizacao;
    private boolean vendidoIndividualmente;
    private List<GrupoCardapioDTO> gruposKit;

    public ProdutoCardapioDTO(Produto produto) {
        this.id = produto.getId();
        this.nome = produto.getNome();
        this.preco = produto.getPreco();
        this.descricao = produto.getDescricao();
        this.imagem = produto.getImagem();
        this.categoria = produto.getCategoria();
        this.isKit = produto.isKit();
        this.ordemVisualizacao = produto.getOrdemVisualizacao();
        this.vendidoIndividualmente = produto.isVendidoIndividualmente();

        if (produto.isKit() && produto.getGruposKit() != null) {
            this.gruposKit = produto.getGruposKit().stream()
                                  .map(GrupoCardapioDTO::new)
                                  .collect(Collectors.toList());
        } else {
            this.gruposKit = Collections.emptyList();
        }
    }

    
    public Long getId() { return id; }
    public String getNome() { return nome; }
    public Double getPreco() { return preco; }
    public String getDescricao() { return descricao; }
    public String getImagem() { return imagem; }
    public String getCategoria() { return categoria; }
    
    @JsonProperty("isKit")
    public boolean isKit() { return isKit; } 

    public Integer getOrdemVisualizacao() { return ordemVisualizacao; }
    public boolean isVendidoIndividualmente() { return vendidoIndividualmente; }
    public List<GrupoCardapioDTO> getGruposKit() { return gruposKit; }
}