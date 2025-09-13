// src/main/java/com/PedAi/PedAi/services/ProdutoService.java
package com.PedAi.PedAi.services;

import com.PedAi.PedAi.DTO.ProdutoCardapioDTO;
import com.PedAi.PedAi.Model.Produto;
import com.PedAi.PedAi.repository.ProdutoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ProdutoService {

    @Autowired
    private ProdutoRepository repository;

    /**
     * Busca os produtos para o cardápio e os converte para DTO dentro de uma
     * transação garantida.
     * Isso resolve problemas de LazyInitializationException em diferentes ambientes.
     */
    @Transactional(readOnly = true)
    public List<ProdutoCardapioDTO> getProdutosParaCardapio() {
        // 1. Busca os produtos e todos os seus dados aninhados (kits, opções, etc.)
        List<Produto> produtos = repository.findProdutosForCardapio();

        // 2. Converte para DTO dentro da mesma transação, garantindo que todos os
        // dados estejam acessíveis.
        return produtos.stream()
                .map(ProdutoCardapioDTO::new)
                .collect(Collectors.toList());
    }
}