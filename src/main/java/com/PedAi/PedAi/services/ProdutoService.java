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

    
    @Transactional(readOnly = true)
    public List<ProdutoCardapioDTO> getProdutosParaCardapio() {
        List<Produto> produtos = repository.findProdutosForCardapio();

        return produtos.stream()
                .map(ProdutoCardapioDTO::new)
                .collect(Collectors.toList());
    }
}