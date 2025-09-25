// Caminho: src/main/java/com/PedAi/PedAi/repository/ProdutoRepository.java
package com.PedAi.PedAi.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.PedAi.PedAi.Model.Produto;

public interface ProdutoRepository extends JpaRepository<Produto, Long> {

    @Query("SELECT DISTINCT p FROM Produto p ORDER BY p.nome ASC")
    List<Produto> findAllForAdminList();

    @Query("SELECT DISTINCT p FROM Produto p LEFT JOIN FETCH p.gruposKit WHERE p.ativo = true AND p.vendidoIndividualmente = true")
    List<Produto> findProdutosForCardapio();

    @Query("SELECT DISTINCT p.categoria FROM Produto p WHERE p.categoria IS NOT NULL AND p.categoria != '' ORDER BY p.categoria ASC")
    List<String> findDistinctCategorias();

    @Query("SELECT p FROM Produto p WHERE LOWER(p.nome) LIKE LOWER(concat('%', :termo, '%')) OR CAST(p.codPdv AS string) LIKE concat('%', :termo, '%')")
    List<Produto> searchByNomeOrCodigoPdv(@Param("termo") String termo);
}