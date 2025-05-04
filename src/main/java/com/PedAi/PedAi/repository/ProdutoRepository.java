package com.PedAi.PedAi.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.PedAi.PedAi.Model.Produto;

public interface ProdutoRepository extends JpaRepository<Produto, Long> {
}
