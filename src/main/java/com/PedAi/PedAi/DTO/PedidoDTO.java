package com.PedAi.PedAi.DTO;
import java.util.List;

public class PedidoDTO {

    private List<ItemPedidoDTO> itens;

    public List<ItemPedidoDTO> getItens() {
        return itens;
    }

    public void setItens(List<ItemPedidoDTO> itens) {
        this.itens = itens;
    }

    // Construtores, se desejar
}

