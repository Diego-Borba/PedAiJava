package com.PedAi.PedAi.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import com.PedAi.PedAi.Model.Produto;

public interface ProdutoRepository extends JpaRepository<Produto, Long> {
    
    @Query("SELECT DISTINCT p.categoria FROM Produto p")
    List<String> findDistinctCategorias();
}