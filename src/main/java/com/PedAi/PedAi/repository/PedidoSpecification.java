package com.PedAi.PedAi.repository;

import com.PedAi.PedAi.Model.Cliente;
import com.PedAi.PedAi.Model.Pedido;
import com.PedAi.PedAi.Model.TipoPedido;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.List;

public class PedidoSpecification {

    public static Specification<Pedido> comFiltros(
            TipoPedido tipo, String cliente, String status, ZonedDateTime dataInicial, ZonedDateTime dataFinal) {

        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Filtro obrigatório por tipo de pedido
            predicates.add(criteriaBuilder.equal(root.get("tipo"), tipo));

            // Filtro opcional por nome do cliente (com JOIN explícito e seguro)
            if (cliente != null && !cliente.isEmpty()) {
                Join<Pedido, Cliente> clienteJoin = root.join("cliente");
                predicates.add(criteriaBuilder.like(criteriaBuilder.lower(clienteJoin.get("nome")), "%" + cliente.toLowerCase() + "%"));
            }

            // Filtro opcional por status
            if (status != null && !status.isEmpty()) {
                predicates.add(criteriaBuilder.equal(root.get("status"), status));
            }

            // Filtro opcional por data inicial
            if (dataInicial != null) {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("dataPedido"), dataInicial));
            }

            // Filtro opcional por data final
            if (dataFinal != null) {
                predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get("dataPedido"), dataFinal));
            }

            // Ordena pelo mais antigo primeiro
            query.orderBy(criteriaBuilder.asc(root.get("dataPedido")));

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
    }
}