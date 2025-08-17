package com.PedAi.PedAi.DTO;

import com.PedAi.PedAi.Model.Produto;
import java.math.BigDecimal;
import java.util.Base64; // IMPORTAR A CLASSE Base64

/**
 * DTO (Data Transfer Object) para representar um produto na lista de administração.
 * Contém os campos necessários para a visualização na tabela de produtos.
 */
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
    
    // --- NOVOS CAMPOS PARA A IMAGEM ---
    private String imagem; // Armazenará a string Base64
    private String imagemTipo; // Armazenará o tipo da imagem (MIME type)


    // Construtor que transforma a entidade Produto em nosso DTO simples
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
        
        // --- LÓGICA DE CONVERSÃO DA IMAGEM ---
        if (produto.getImagemDados() != null && produto.getImagemTipo() != null) {
            this.imagem = Base64.getEncoder().encodeToString(produto.getImagemDados());
            this.imagemTipo = produto.getImagemTipo();
        }
        
        // Lógica para definir o "Tipo" baseado nas flags booleanas
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

    // Getters (Setters não são necessários se usamos o construtor)

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
    
    // --- GETTERS PARA OS NOVOS CAMPOS ---
    public String getImagem() {
        return imagem;
    }

    public String getImagemTipo() {
        return imagemTipo;
    }
}