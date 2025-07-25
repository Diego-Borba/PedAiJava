package com.PedAi.PedAi.Model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIdentityInfo;
import com.fasterxml.jackson.annotation.ObjectIdGenerators;
import jakarta.persistence.*;

@Entity
@JsonIdentityInfo(generator = ObjectIdGenerators.PropertyGenerator.class, property = "id")
public class OpcaoComplemento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "opcao_produto_id")
    private Produto produto;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "grupo_complemento_id")
    @JsonBackReference("grupo-opcoes") // Corresponde ao nome em GrupoComplemento
    private GrupoComplemento grupo;

    // ... (seus Getters e Setters permanecem inalterados)
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Produto getProduto() { return produto; }
    public void setProduto(Produto produto) { this.produto = produto; }
    public GrupoComplemento getGrupo() { return grupo; }
    public void setGrupo(GrupoComplemento grupo) { this.grupo = grupo; }
}