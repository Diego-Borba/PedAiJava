package com.PedAi.PedAi.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.PedAi.PedAi.Model.Produto;

public interface ProdutoRepository extends JpaRepository<Produto, Long> {
    
    @Query("SELECT DISTINCT p.categoria FROM Produto p")
    List<String> findDistinctCategorias();
    
    @Query("SELECT p FROM Produto p WHERE lower(p.categoria) = lower(:categoria) AND p.isMateriaPrima = false AND p.isComplemento = false AND p.ativo = true")
    List<Produto> findProdutosDeCardapioPorCategoria(@Param("categoria") String categoria);
}