package com.PedAi.PedAi.DTO;

import com.PedAi.PedAi.Model.GrupoComplemento;
import com.PedAi.PedAi.Model.TipoSelecao;
import java.util.List;
import java.util.stream.Collectors;

public class GrupoCardapioDTO {
    private Long id;
    private String nome;
    private TipoSelecao tipoSelecao;
    private int quantidadeMaxima;
    private List<OpcaoCardapioDTO> opcoes;

    public GrupoCardapioDTO(GrupoComplemento grupo) {
        this.id = grupo.getId();
        this.nome = grupo.getNome();
        this.tipoSelecao = grupo.getTipoSelecao();
        this.quantidadeMaxima = grupo.getQuantidadeMaxima();
        this.opcoes = grupo.getOpcoes().stream()
                            .filter(opcao -> opcao.getProduto() != null)
                            .map(OpcaoCardapioDTO::new)
                            .collect(Collectors.toList());
    }

    public Long getId() { return id; }
    public String getNome() { return nome; }
    public TipoSelecao getTipoSelecao() { return tipoSelecao; }
    public int getQuantidadeMaxima() { return quantidadeMaxima; }
    public List<OpcaoCardapioDTO> getOpcoes() { return opcoes; }
}