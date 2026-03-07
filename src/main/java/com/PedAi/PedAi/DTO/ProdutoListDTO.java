package com.PedAi.PedAi.DTO;

import com.PedAi.PedAi.Model.Produto;
import java.math.BigDecimal;
import java.util.Base64;
public class ProdutoListDTO {

    private Long id;
    private String nome;
    private Double preco;
    private BigDecimal estoqueAtual;
    private String categoria;
    private Integer codPdv;
    private boolean isKit;
    private boolean isMateriaPrima;
    private boolean isComplemento;
    private String tipo;
    private String imagem; 
    private String imagemTipo;

    public ProdutoListDTO(Produto produto) {
        this.id = produto.getId();
        this.nome = produto.getNome();
        this.preco = produto.getPreco();
        this.estoqueAtual = produto.getEstoqueAtual();
        this.categoria = produto.getCategoria();
        this.codPdv = produto.getCodPdv();
        this.isKit = produto.isKit();
        this.isMateriaPrima = produto.isMateriaPrima();
        this.isComplemento = produto.isComplemento();
        
        if (produto.getImagemDados() != null && produto.getImagemTipo() != null) {
            this.imagem = Base64.getEncoder().encodeToString(produto.getImagemDados());
            this.imagemTipo = produto.getImagemTipo();
        }
        
       
        if (produto.isKit()) {
            this.tipo = "Kit";
        } else if (produto.isMateriaPrima()) {
            this.tipo = "Matéria-Prima";
        } else if (produto.isComplemento()) {
            this.tipo = "Complemento";
        } else if (produto.getReceita() != null && !produto.getReceita().isEmpty()) {
            this.tipo = "Composto";
        } else {
            this.tipo = "Venda Direta";
        }
    }

    public Long getId() {
        return id;
    }

    public String getNome() {
        return nome;
    }

    public Double getPreco() {
        return preco;
    }

    public BigDecimal getEstoqueAtual() {
        return estoqueAtual;
    }

    public String getCategoria() {
        return categoria;
    }

    public Integer getCodPdv() {
        return codPdv;
    }

    public boolean isKit() {
        return isKit;
    }

    public boolean isMateriaPrima() {
        return isMateriaPrima;
    }

    public boolean isComplemento() {
        return isComplemento;
    }

    public String getTipo() {
        return tipo;
    }
    
    public String getImagem() {
        return imagem;
    }

    public String getImagemTipo() {
        return imagemTipo;
    }
}